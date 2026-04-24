import { NextRequest, NextResponse } from "next/server";

import {
  ensureYoutubeAccessTokenForUser,
  getAuthenticatedYoutubeUser,
} from "@/lib/youtube/session";
import { createClient } from "@/utils/supabase/server";

type YoutubeVideoRow = {
  video_id: string;
  title: string;
  published_at: string;
  thumbnail?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  duration?: string;
};

type YoutubeAnalyticsMap = Record<
  string,
  {
    views: number;
    watch_time_minutes: number;
    avg_view_duration: number;
    avg_view_percentage: number;
    likes: number;
    comments: number;
    subscribers_gained: number;
  }
>;

async function fetchYouTubeData(accessToken: string, maxVideos = 50) {
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const channelData = await channelRes.json();

  if (!channelData.items || channelData.items.length === 0) {
    throw new Error("No channel found");
  }

  const channel = channelData.items[0];
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  const videos: YoutubeVideoRow[] = [];
  let nextPageToken: string | undefined;

  while (videos.length < maxVideos && uploadsPlaylistId) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", String(Math.min(50, maxVideos - videos.length)));
    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    if (data.items) {
      for (const item of data.items) {
        videos.push({
          video_id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          published_at: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.medium?.url,
        });
      }
    }

    nextPageToken = data.nextPageToken || undefined;
    if (!nextPageToken) {
      break;
    }
  }

  const videoDetails: Record<string, Partial<YoutubeVideoRow>> = {};
  for (let i = 0; i < videos.length; i += 50) {
    const batch = videos.slice(i, i + 50);
    const ids = batch.map((video) => video.video_id).join(",");

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const statsData = await statsRes.json();

    if (statsData.items) {
      for (const item of statsData.items) {
        videoDetails[item.id] = {
          view_count: parseInt(item.statistics?.viewCount || "0", 10),
          like_count: parseInt(item.statistics?.likeCount || "0", 10),
          comment_count: parseInt(item.statistics?.commentCount || "0", 10),
          duration: item.contentDetails?.duration,
        };
      }
    }
  }

  for (const video of videos) {
    if (videoDetails[video.video_id]) {
      Object.assign(video, videoDetails[video.video_id]);
    }
  }

  return {
    channel: {
      channel_id: channel.id,
      title: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails?.default?.url,
      subscriber_count: parseInt(channel.statistics?.subscriberCount || "0", 10),
      video_count: parseInt(channel.statistics?.videoCount || "0", 10),
      view_count: parseInt(channel.statistics?.viewCount || "0", 10),
    },
    videos,
  };
}

async function fetchAnalyticsData(accessToken: string, videoIds: string[]) {
  if (videoIds.length === 0) {
    return {} satisfies YoutubeAnalyticsMap;
  }

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  const analytics: YoutubeAnalyticsMap = {};

  try {
    const response = await fetch(
      "https://youtubeanalytics.googleapis.com/v2/reports?" +
        `ids=channel==MINE&startDate=${startDate.toISOString().split("T")[0]}` +
        `&endDate=${endDate.toISOString().split("T")[0]}` +
        "&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,subscribersGained" +
        "&dimensions=video&maxResults=500",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = await response.json();

    if (data.rows) {
      for (const row of data.rows) {
        const videoId = row[0];
        analytics[videoId] = {
          views: row[1] || 0,
          watch_time_minutes: row[2] || 0,
          avg_view_duration: row[3] || 0,
          avg_view_percentage: row[4] || 0,
          likes: row[5] || 0,
          comments: row[6] || 0,
          subscribers_gained: row[7] || 0,
        };
      }
    }
  } catch (error) {
    console.error("[YouTube Sync] Analytics API error:", error);
  }

  return analytics;
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await ensureYoutubeAccessTokenForUser(user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to YouTube" }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json().catch(() => ({}));
    const maxVideos =
      typeof body.maxVideos === "number" && body.maxVideos > 0
        ? Math.min(Math.floor(body.maxVideos), 200)
        : 50;

    const ytData = await fetchYouTubeData(accessToken, maxVideos);
    const analyticsData = await fetchAnalyticsData(
      accessToken,
      ytData.videos.map((video) => video.video_id),
    );

    const { error: channelError } = await supabase.from("youtube_channels").upsert(
      {
        user_id: user.id,
        channel_id: ytData.channel.channel_id,
        title: ytData.channel.title,
        subscriber_count: ytData.channel.subscriber_count,
        video_count: ytData.channel.video_count,
        view_count: ytData.channel.view_count,
        channel_data: ytData.channel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,channel_id" },
    );

    if (channelError) {
      console.error("[YouTube Sync] Channel save error:", channelError);
    }

    const videosToUpsert = ytData.videos.map((video) => ({
      user_id: user.id,
      channel_id: ytData.channel.channel_id,
      video_id: video.video_id,
      title: video.title,
      published_at: video.published_at,
      view_count: video.view_count || 0,
      like_count: video.like_count || 0,
      comment_count: video.comment_count || 0,
      avg_view_duration: analyticsData[video.video_id]?.avg_view_duration || 0,
      avg_view_percentage: analyticsData[video.video_id]?.avg_view_percentage || 0,
      analytics_data: analyticsData[video.video_id] || null,
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < videosToUpsert.length; i += 50) {
      const batch = videosToUpsert.slice(i, i + 50);
      const { error: videoError } = await supabase.from("youtube_videos").upsert(batch, {
        onConflict: "user_id,video_id",
      });

      if (videoError) {
        console.error("[YouTube Sync] Video save error:", videoError);
      }
    }

    return NextResponse.json({
      success: true,
      channel: ytData.channel,
      videoCount: ytData.videos.length,
      message: `${ytData.videos.length} videos synced.`,
    });
  } catch (error) {
    console.error("[YouTube Sync] Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: channelData } = await supabase
      .from("youtube_channels")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: videosData } = await supabase
      .from("youtube_videos")
      .select("*")
      .eq("user_id", user.id)
      .order("published_at", { ascending: false });

    return NextResponse.json({
      channel: channelData,
      videos: videosData || [],
      videoCount: videosData?.length || 0,
    });
  } catch (error) {
    console.error("[YouTube Sync] Get data error:", error);
    return NextResponse.json({ error: "Failed to load synced YouTube data" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import {
  clearYoutubeConnectionCookies,
  ensureYoutubeAccessTokenForUser,
  getAuthenticatedYoutubeUser,
} from "@/lib/youtube/session";

async function processChannelData(channelData: any, accessToken: string) {
  if (!channelData.items || channelData.items.length === 0) {
    return NextResponse.json({ connected: true, channel: null, videos: [] });
  }

  const channel = channelData.items[0];
  const channelInfo = {
    id: channel.id,
    title: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails?.default?.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount || "0", 10),
    videoCount: parseInt(channel.statistics.videoCount || "0", 10),
    viewCount: parseInt(channel.statistics.viewCount || "0", 10),
  };

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let videos: Array<Record<string, unknown>> = [];

  if (uploadsPlaylistId) {
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const videosData = await videosResponse.json();

    if (videosData.items) {
      const videoIds = videosData.items.map((video: any) => video.snippet.resourceId.videoId).join(",");

      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const statsData = await statsResponse.json();
      const statsMap = new Map(statsData.items?.map((video: any) => [video.id, video]) || []);

      videos = videosData.items.map((item: any) => {
        const videoId = item.snippet.resourceId.videoId;
        const stats = statsMap.get(videoId) as any;
        return {
          id: videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(stats?.statistics?.viewCount || "0", 10),
          likeCount: parseInt(stats?.statistics?.likeCount || "0", 10),
          commentCount: parseInt(stats?.statistics?.commentCount || "0", 10),
        };
      });
    }
  }

  return NextResponse.json({
    connected: true,
    channel: channelInfo,
    videos,
  });
}

export async function GET() {
  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    return NextResponse.json(
      { connected: false, channel: null, videos: [], error: "Unauthorized" },
      { status: 401 },
    );
  }

  const accessToken = await ensureYoutubeAccessTokenForUser(user.id);
  if (!accessToken) {
    return NextResponse.json(
      { connected: false, channel: null, videos: [], error: "Not connected to YouTube" },
      { status: 401 },
    );
  }

  try {
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const channelData = await channelResponse.json();

    if (channelData.error) {
      return NextResponse.json(
        {
          connected: false,
          channel: null,
          videos: [],
          error: channelData.error.message || "Failed to fetch YouTube data",
        },
        { status: 400 },
      );
    }

    return processChannelData(channelData, accessToken);
  } catch (error) {
    console.error("YouTube stats error:", error);
    return NextResponse.json(
      { connected: false, channel: null, videos: [], error: "Failed to fetch YouTube data" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: "YouTube disconnected" });
  clearYoutubeConnectionCookies(response);
  return response;
}

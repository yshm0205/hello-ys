export type YoutubeChannelMetadata = {
  title: string;
  subscriberCount: number;
  totalVideoCount: number;
  profileImageUrl: string;
  firstUploadDate: string | null;
};

export class YoutubeMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoutubeMetadataError";
  }
}

type YoutubeApiChannel = {
  id: string;
  snippet?: {
    title?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

type ChannelLookup =
  | { type: "id"; value: string }
  | { type: "handle"; value: string }
  | { type: "username"; value: string }
  | { type: "query"; value: string };

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_UPLOAD_PLAYLIST_PAGES = 80;

function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
}

function parseNumber(value: string | undefined) {
  return parseInt(value || "0", 10) || 0;
}

function normalizeChannelUrl(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.startsWith("@")) return `https://www.youtube.com/${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function getChannelLookup(channelUrl: string, fallbackQuery: string): ChannelLookup | null {
  const normalizedUrl = normalizeChannelUrl(channelUrl);

  if (normalizedUrl) {
    try {
      const url = new URL(normalizedUrl);
      const segments = url.pathname.split("/").filter(Boolean);
      const first = segments[0] || "";
      const second = segments[1] || "";

      if (first === "channel" && second) return { type: "id", value: second };
      if (first.startsWith("@")) return { type: "handle", value: first.slice(1) };
      if (first === "@" && second) return { type: "handle", value: second.replace(/^@/, "") };
      if (first === "user" && second) return { type: "username", value: second };
      if (first === "c" && second) return { type: "query", value: second };
      if (first) return { type: "query", value: first.replace(/^@/, "") };
    } catch {
      if (channelUrl.startsWith("@")) return { type: "handle", value: channelUrl.slice(1) };
    }
  }

  const query = fallbackQuery.trim();
  return query ? { type: "query", value: query } : null;
}

async function youtubeGet(path: string, params: Record<string, string>) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new YoutubeMetadataError("YOUTUBE_API_KEY is not configured.");
  }

  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw new YoutubeMetadataError(data?.error?.message || response.statusText);
  }

  return data;
}

async function fetchChannelById(channelId: string): Promise<YoutubeApiChannel | null> {
  const data = await youtubeGet("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId,
    maxResults: "1",
  });

  return (data?.items?.[0] as YoutubeApiChannel | undefined) || null;
}

async function resolveChannel(lookup: ChannelLookup): Promise<YoutubeApiChannel | null> {
  if (lookup.type === "id") {
    return fetchChannelById(lookup.value);
  }

  if (lookup.type === "handle") {
    const byHandle = await youtubeGet("channels", {
      part: "snippet,statistics,contentDetails",
      forHandle: lookup.value,
      maxResults: "1",
    });
    const channel = byHandle?.items?.[0] as YoutubeApiChannel | undefined;
    if (channel) return channel;
  }

  if (lookup.type === "username") {
    const byUsername = await youtubeGet("channels", {
      part: "snippet,statistics,contentDetails",
      forUsername: lookup.value,
      maxResults: "1",
    });
    const channel = byUsername?.items?.[0] as YoutubeApiChannel | undefined;
    if (channel) return channel;
  }

  const search = await youtubeGet("search", {
    part: "snippet",
    type: "channel",
    q: lookup.value,
    maxResults: "1",
  });
  const channelId = search?.items?.[0]?.snippet?.channelId as string | undefined;
  return channelId ? fetchChannelById(channelId) : null;
}

async function fetchFirstUploadDate(uploadsPlaylistId: string | undefined) {
  if (!uploadsPlaylistId) return null;

  let nextPageToken = "";
  let oldestPublishedAt: string | null = null;
  let page = 0;

  do {
    const data = await youtubeGet("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      pageToken: nextPageToken,
    });

    if (!data?.items?.length) break;

    for (const item of data.items) {
      const publishedAt =
        item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null;
      if (publishedAt) oldestPublishedAt = publishedAt;
    }

    nextPageToken = data.nextPageToken || "";
    page += 1;
  } while (nextPageToken && page < MAX_UPLOAD_PLAYLIST_PAGES);

  return oldestPublishedAt ? oldestPublishedAt.slice(0, 10) : null;
}

export async function fetchYoutubeChannelMetadata(
  channelUrl: string,
  fallbackQuery = "",
  options: { throwOnApiError?: boolean } = {},
): Promise<YoutubeChannelMetadata | null> {
  const lookup = getChannelLookup(channelUrl, fallbackQuery);
  if (!lookup) return null;

  try {
    const channel = await resolveChannel(lookup);
    if (!channel) return null;

    const firstUploadDate = await fetchFirstUploadDate(
      channel.contentDetails?.relatedPlaylists?.uploads,
    );

    return {
      title: channel.snippet?.title || fallbackQuery,
      subscriberCount: parseNumber(channel.statistics?.subscriberCount),
      totalVideoCount: parseNumber(channel.statistics?.videoCount),
      profileImageUrl:
        channel.snippet?.thumbnails?.high?.url ||
        channel.snippet?.thumbnails?.medium?.url ||
        channel.snippet?.thumbnails?.default?.url ||
        "",
      firstUploadDate,
    };
  } catch (error) {
    if (options.throwOnApiError && error instanceof YoutubeMetadataError) {
      throw error;
    }
    console.warn("[YouTube Metadata] Failed to fetch channel metadata", error);
    return null;
  }
}

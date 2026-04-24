import { NextRequest, NextResponse } from "next/server";

import {
  ensureYoutubeAccessTokenForUser,
  getAuthenticatedYoutubeUser,
} from "@/lib/youtube/session";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await ensureYoutubeAccessTokenForUser(user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to YouTube" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?` +
        `ids=channel==MINE` +
        `&startDate=${startDate.toISOString().split("T")[0]}` +
        `&endDate=${endDate.toISOString().split("T")[0]}` +
        `&metrics=audienceWatchRatio,relativeRetentionPerformance` +
        `&dimensions=elapsedVideoTimeRatio` +
        `&filters=video==${videoId}` +
        `&sort=elapsedVideoTimeRatio`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        {
          error: data.error.message || "Analytics API error",
          code: data.error.code,
        },
        { status: 400 },
      );
    }

    if (!data.rows || data.rows.length === 0) {
      return NextResponse.json({
        videoId,
        dataPoints: [],
        message: "No retention data available (may take up to 48 hours)",
      });
    }

    const dataPoints = data.rows.map((row: any[]) => ({
      ratio: parseFloat(row[0]),
      retention: parseFloat(row[1]) || 0,
      relativePerformance: parseFloat(row[2]) || 0.5,
    }));

    const retentions = dataPoints.map((point: any) => point.retention);
    const avgRetention =
      retentions.length > 0
        ? retentions.reduce((left: number, right: number) => left + right, 0) / retentions.length
        : 0;

    const dropOffPoints: number[] = [];
    const spikePoints: number[] = [];

    for (let index = 1; index < retentions.length; index += 1) {
      const diff = retentions[index] - retentions[index - 1];
      if (diff < -0.1) {
        dropOffPoints.push(index);
      } else if (diff > 0.05) {
        spikePoints.push(index);
      }
    }

    return NextResponse.json({
      videoId,
      dataPoints,
      avgRetention,
      dropOffPoints,
      spikePoints,
      pointCount: dataPoints.length,
    });
  } catch (error: any) {
    console.error("Retention API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch retention data" },
      { status: 500 },
    );
  }
}

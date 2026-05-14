export function recordLectureStart(vodId: string) {
  if (!vodId) return;

  fetch("/api/lectures/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vod_id: vodId, started: true }),
  }).catch(() => {
    // Ignore telemetry failures so navigation and playback are never blocked.
  });
}

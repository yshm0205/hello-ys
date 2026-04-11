"use client";

import { useMemo, useState } from "react";

type VideoThumbnailProps = {
  src?: string | null;
  videoId?: string | null;
  alt?: string;
  className?: string;
};

function buildFallback(videoId?: string | null) {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;
}

export function VideoThumbnail({
  src,
  videoId,
  alt = "",
  className = "h-12 w-16 rounded-md border object-cover",
}: VideoThumbnailProps) {
  const fallbackSrc = useMemo(() => buildFallback(videoId), [videoId]);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || "");
  const [hasFailed, setHasFailed] = useState(false);

  if (!currentSrc || hasFailed) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
        VIDEO
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }

        setHasFailed(true);
      }}
    />
  );
}

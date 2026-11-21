"use client";

import type { GalleryItem } from "@/lib/types";

export function SitePhoto({ item, className = "" }: { item: GalleryItem; className?: string }) {
  if (item.src) {
    return <img src={item.src} alt={item.title} className={`h-full w-full object-cover ${className}`} />;
  }

  const floors = 2 + (item.seed % 6);
  const crane = item.seed % 3 !== 0;
  const skyTop = item.phase === "before" ? "#C9B59A" : item.phase === "after" ? "#D5D8D4" : "#D9CABB";
  const mass = item.phase === "before" ? "#8A6244" : "#C9C2B6";

  return (
    <svg viewBox="0 0 640 400" className={`h-full w-full ${className}`} role="img" aria-label={item.title}>
      <defs>
        <linearGradient id={`sky-${item.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor="#E7E1D6" />
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill={`url(#sky-${item.id})`} />
      <rect y="292" width="640" height="108" fill="#CDBBA4" />
      <rect y="300" width="640" height="8" fill="#B7A48C" />
      {Array.from({ length: floors }).map((_, index) => (
        <rect
          key={index}
          x={210}
          y={268 - index * 28}
          width={220}
          height={26}
          fill={index === floors - 1 ? "#E4DDD4" : mass}
          stroke="#2A2A28"
          strokeOpacity="0.18"
        />
      ))}
      {Array.from({ length: floors }).map((_, level) =>
        Array.from({ length: 5 }).map((__, bay) => (
          <rect
            key={`${level}-${bay}`}
            x={226 + bay * 38}
            y={274 - level * 28}
            width={16}
            height={12}
            fill={item.phase === "after" ? "#9EC4C6" : "#6E655C"}
            opacity={item.phase === "before" ? 0.25 : 0.8}
          />
        )),
      )}
      {crane ? (
        <g stroke="#252525" strokeWidth="3" fill="none" opacity="0.7">
          <path d="M430 292 V70" />
          <path d="M430 86 H560" />
          <path d="M500 86 V150" />
        </g>
      ) : null}
      <rect x="24" y="24" width="150" height="28" fill="#252525" />
      <text x="36" y="43" fill="#F5F4F0" fontSize="13" fontFamily="inherit">
        {item.phase === "before" ? "قبل" : item.phase === "after" ? "بعد" : "کارگاه"}
      </text>
    </svg>
  );
}

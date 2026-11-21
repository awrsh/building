"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState } from "react";
import type { BuildingSceneProps } from "./building-scene";

const Scene = dynamic(() => import("./building-scene"), { ssr: false });

class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
          نمایش سه‌بعدی در این محیط اجرا نشد.
        </div>
      );
    }
    return this.props.children;
  }
}

function Placeholder() {
  return (
    <div className="grid h-full min-h-48 place-items-center text-sm text-muted">در حال آماده‌سازی مدل سه‌بعدی…</div>
  );
}

export function BuildingCanvas(props: BuildingSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !mounted) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.02 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={ref} className="h-full w-full">
      {mounted ? (
        <SceneBoundary>
          <Scene {...props} active={active} />
        </SceneBoundary>
      ) : (
        <Placeholder />
      )}
    </div>
  );
}

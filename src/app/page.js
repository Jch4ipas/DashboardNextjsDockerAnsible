"use client";

import { loadData } from "@/services/loadJSON";
import { buildBoxes } from "@/components/core/buildBoxes";
import { useState, useEffect, useMemo } from "react";
import "./globals.css";

/**
 * Public rotating dashboard.
 *
 * All containers flagged `isGoingToDisplay` are mounted at once and kept
 * alive; only the active one is visible (opacity/z-index toggle). This
 * pre-loads every Grafana iframe in the background at startup, so a heavy
 * dashboard is already rendered by the time the rotation reaches it —
 * instead of starting its ~20s load only once it becomes visible.
 */
export default function Home() {
  const [boxSerializable, setBoxSerializable] = useState([]);
  const [activeBoxSet, setActiveBoxSet] = useState(0);

  const handleLoad = async () => {
    const { data } = await loadData();
    setBoxSerializable(data);
  };

  useEffect(() => {
    handleLoad();
  }, []);

  // Live reload when the backoffice pushes a config change.
  useEffect(() => {
    const evt = new EventSource("/api/events");
    evt.onmessage = (event) => {
      if (event.data === "update") handleLoad();
    };
    return () => evt.close();
  }, []);

  // Polling fallback for the kiosk (Raspberry Pi / FullPageOS): re-fetch the
  // config on an interval so changes always show up, even if the SSE stream
  // silently drops behind the proxy or never reaches this pod. loadData uses
  // cache:"no-store", so this really hits the server. No visible flicker —
  // unchanged config re-renders in place (iframes keep their identity).
  useEffect(() => {
    const id = setInterval(handleLoad, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // A kiosk browser never navigates on its own, so it keeps running the old
  // bundle after a redeploy. Reload the whole page periodically to pick up new
  // versions. Tune/remove this interval to taste (a reload briefly reloads the
  // Grafana iframes).
  useEffect(() => {
    const id = setInterval(() => window.location.reload(),  45 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Displayable containers, with their boxes built once. Memoized so the
  // iframes keep their identity across renders — this is what prevents the
  // heavy Grafana dashboards from reloading (and keeps them pre-loaded).
  const displayContainers = useMemo(
    () =>
      boxSerializable
        .filter((container) => container.isGoingToDisplay === true)
        .map((container) => ({ ...container, builtBoxes: buildBoxes(container.boxes) })),
    [boxSerializable],
  );

  // Keep the active index valid if the set shrinks.
  useEffect(() => {
    if (activeBoxSet >= displayContainers.length && displayContainers.length > 0) {
      setActiveBoxSet(0);
    }
  }, [displayContainers.length, activeBoxSet]);

  // Rotate to the next container after the current one's display duration.
  const activeDuration = displayContainers[activeBoxSet]?.durationDisplay || 30;
  useEffect(() => {
    if (displayContainers.length <= 1) return;
    const timeoutId = setTimeout(() => {
      setActiveBoxSet((prev) => (prev + 1) % displayContainers.length);
    }, activeDuration * 1000);
    return () => clearTimeout(timeoutId);
  }, [activeBoxSet, activeDuration, displayContainers.length]);

  return (
    <div className="relative h-screen w-full home-page overflow-hidden">
      {displayContainers.map((container, index) => {
        const isActive = index === activeBoxSet;
        return (
          <div
            key={container.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className="grid grid-cols-6 grid-rows-4 gap-2 w-full h-full p-2">
              {container.builtBoxes.map((box) => (
                <div
                  key={box.id}
                  className="border border-gray-600 rounded-3xl justify-center items-center font-bold shadow-md p-2"
                  style={{
                    gridColumn: `${box.x} / span ${box.width}`,
                    gridRow: `${box.y} / span ${box.height}`,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                    {box.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

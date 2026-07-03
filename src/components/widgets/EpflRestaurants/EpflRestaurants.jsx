"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FoodTypeIcon from "./FoodTypeIcon";

/**
 * EPFL restaurant menus widget for the dashboard.
 *
 * Fetches the day's menus for every campus restaurant (via the
 * /api/restaurants proxy) and rotates through them one at a time as a
 * carousel: the new restaurant slides in from the right while the previous
 * one slides out to the left. A restaurant whose menu is taller than the box
 * auto-scrolls vertically so everything is visible without a mouse.
 *
 * The widget carries its own dark background so it stays readable both on the
 * black public dashboard AND on the white backoffice grid.
 *
 * Props (all optional, set from the admin "props" panel):
 *   - lang:       "fr" | "en"                              (default "fr")
 *   - interval:   seconds between two restaurants          (default 12)
 *   - restaurant: only show restaurants whose name matches (substring, ci)
 */
const STRINGS = {
  fr: {
    loading: "Chargement…",
    empty: "Aucun menu aujourd'hui",
    error: "Menus indisponibles",
    notFound: "Restaurant introuvable",
    available: "Disponibles :",
  },
  en: {
    loading: "Loading…",
    empty: "No menu today",
    error: "Menus unavailable",
    notFound: "Restaurant not found",
    available: "Available:",
  },
};

/** NutriScore letter → background colour. */
const NUTRI_COLORS = {
  A: "#038141", B: "#85BB2F", C: "#FECB02", D: "#EE8100", E: "#E63E11",
};

/** Self-contained dark panel so the widget is legible on any background. */
function Frame({ children }) {
  return (
    <div className="w-full h-full bg-neutral-900 text-gray-100 rounded-xl overflow-hidden flex flex-col p-3">
      {children}
    </div>
  );
}

function Centered({ children }) {
  return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center">{children}</div>;
}

/**
 * One restaurant: header + menu list that auto-scrolls when it overflows.
 * Self-contained so the parent carousel can just mount/unmount it.
 */
function RestaurantCard({ restaurant, lang }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || typeof content.animate !== "function") return;
    animRef.current?.cancel();

    const raf = requestAnimationFrame(() => {
      const overflow = content.scrollHeight - viewport.clientHeight;
      if (overflow <= 4) return;
      const duration = 3500 + overflow * 45; // slower for taller menus
      animRef.current = content.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(0)", offset: 0.12 },
          { transform: `translateY(-${overflow}px)`, offset: 0.5 },
          { transform: `translateY(-${overflow}px)`, offset: 0.62 },
          { transform: "translateY(0)", offset: 1 },
        ],
        { duration, iterations: Infinity, easing: "ease-in-out" },
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      animRef.current?.cancel();
    };
  }, [restaurant.id, lang]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-l-4 border-[#FF0000] pl-2 mb-1 shrink-0">
        <h3 className="font-bold text-lg leading-tight truncate">{restaurant.name}</h3>
        {restaurant.address && <p className="text-xs text-gray-400 truncate">{restaurant.address}</p>}
      </div>

      <div ref={viewportRef} className="flex-1 min-h-0 overflow-hidden">
        <div ref={contentRef} className="flex flex-col gap-1.5 pr-1">
          {restaurant.menus.map((m) => (
            <div key={m.menuId} className="border-b border-white/10 pb-1.5 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-gray-400 truncate">
                  {m.menuName}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.nutriScore && (
                    <span
                      className="w-4 h-4 rounded-full text-[0.6rem] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: NUTRI_COLORS[m.nutriScore?.toUpperCase()] || "#666" }}
                      title={`NutriScore ${m.nutriScore}`}
                    >
                      {m.nutriScore.toUpperCase()}
                    </span>
                  )}
                  {m.price && (
                    <span className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
                      {m.price} {m.currency}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium leading-snug flex items-start gap-1.5">
                <FoodTypeIcon category={m.category} className="w-4 h-4 mt-0.5" />
                <span>{m.dish}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EpflRestaurants({ lang = "fr", interval = 12, restaurant }) {
  const [all, setAll] = useState([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  // Carousel state: which restaurant is shown, which is leaving, and whether
  // to animate. `animate` is false on the first appearance and for a single
  // restaurant, so nothing swipes on mount or when the data arrives.
  const [view, setView] = useState({ current: null, previous: null, animate: false });

  const t = STRINGS[lang] || STRINGS.fr;
  const rotateMs = (Number(interval) || 12) * 1000;

  // Load menus on mount and refresh every 30 minutes.
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`/api/restaurants?lang=${encodeURIComponent(lang)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !Array.isArray(data.restaurants)) {
          setStatus("error");
          return;
        }
        setAll(data.restaurants);
        setStatus("ok");
      } catch {
        if (active) setStatus("error");
      }
    };

    load();
    const refresh = setInterval(load, 30 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(refresh);
    };
  }, [lang]);

  // Restaurant selection via the `restaurant` prop: an array of exact names
  // (a single string is also accepted). Empty = all. The box rotates through
  // the chosen restaurants, in selection order. Names are compared exactly
  // (normalized) so a name containing a comma — e.g. "Industrie 21, Sion" —
  // works and short names don't accidentally match longer ones.
  const filtered = useMemo(() => {
    const list = Array.isArray(restaurant) ? restaurant : restaurant ? [restaurant] : [];
    const wanted = list.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    if (wanted.length === 0) return all;

    const rank = (r) => wanted.indexOf(String(r.name).trim().toLowerCase());
    return all.filter((r) => rank(r) !== -1).sort((a, b) => rank(a) - rank(b));
  }, [all, restaurant]);

  useEffect(() => {
    setIndex(0);
  }, [restaurant, filtered.length]);

  // Rotate through restaurants (only when there is more than one).
  useEffect(() => {
    if (filtered.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % filtered.length), rotateMs);
    return () => clearInterval(id);
  }, [filtered.length, rotateMs]);

  // Drive the carousel. Animate only on a real restaurant change — not on the
  // first render, not on a data refresh of the same restaurant.
  useEffect(() => {
    const target =
      status === "ok" && filtered.length > 0
        ? filtered[Math.min(index, filtered.length - 1)]
        : null;

    setView((prev) => {
      if (!target) return { current: null, previous: null, animate: false };
      if (!prev.current || prev.current.id === target.id) {
        return { current: target, previous: null, animate: false };
      }
      return { current: target, previous: prev.current, animate: true };
    });
  }, [filtered, index, status]);

  // Drop the outgoing card once its slide-out has finished.
  useEffect(() => {
    if (!view.previous) return;
    const id = setTimeout(() => setView((v) => ({ ...v, previous: null, animate: false })), 520);
    return () => clearTimeout(id);
  }, [view.previous]);

  if (status === "loading") return <Frame><Centered>{t.loading}</Centered></Frame>;
  if (status === "error") return <Frame><Centered>{t.error}</Centered></Frame>;
  if (all.length === 0) return <Frame><Centered>{t.empty}</Centered></Frame>;

  // A restaurant was requested but nothing matched — help the user pick a name.
  if (filtered.length === 0) {
    return (
      <Frame>
        <p className="text-sm text-gray-300">{t.notFound} : &quot;{restaurant}&quot;</p>
        <p className="text-xs text-gray-500 mt-2 mb-1">{t.available}</p>
        <ul className="text-xs text-gray-400 overflow-y-auto flex-1 space-y-0.5">
          {all.map((r) => (
            <li key={r.id}>• {r.name}</li>
          ))}
        </ul>
      </Frame>
    );
  }

  return (
    <Frame>
      {/* Carousel stage — cards are absolutely stacked so they can cross-slide */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {view.previous && (
          <div key={view.previous.id} className="absolute inset-0 carousel-exit-left">
            <RestaurantCard restaurant={view.previous} lang={lang} />
          </div>
        )}
        {view.current && (
          <div
            key={view.current.id}
            className={`absolute inset-0 ${view.animate ? "carousel-enter-right" : ""}`}
          >
            <RestaurantCard restaurant={view.current} lang={lang} />
          </div>
        )}
      </div>

      {/* Fixed rotation indicator (does not move with the cards) */}
      {filtered.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1 pt-2 shrink-0">
          {filtered.map((it, i) => (
            <span
              key={it.id ?? i}
              className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </Frame>
  );
}

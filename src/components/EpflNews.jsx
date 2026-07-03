"use client";

import { useEffect, useState } from "react";

/**
 * EPFL news widget for the dashboard.
 *
 * Fetches the latest news from the EPFL actu API (via the /api/epfl-news
 * proxy) and rotates through them as a carousel: the new item slides in from
 * the right while the previous one slides out to the left. Each card is a
 * full-bleed cover image with category, title, subtitle and date.
 *
 * Props (all optional, set from the admin "props" panel):
 *   - lang:     "fr" | "en" | "de"  (default "fr")
 *   - count:    number of news to cycle through   (default 6)
 *   - channel:  EPFL actu channel id to filter on  (default: all EPFL news)
 *   - interval: seconds between two news           (default 10)
 */
const STRINGS = {
  fr: { loading: "Chargement…", empty: "Aucune actualité" },
  en: { loading: "Loading…", empty: "No news" },
  de: { loading: "Laden…", empty: "Keine Nachrichten" },
};

function formatDate(iso, lang) {
  try {
    const locale = lang === "en" ? "en-GB" : lang === "de" ? "de-CH" : "fr-CH";
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** One news item as a full-bleed cover card. */
function NewsCard({ news, lang }) {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-full h-full overflow-hidden text-white"
    >
      {news.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={news.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-neutral-800" />
      )}

      {/* Legibility gradient + EPFL red accent */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute top-0 left-0 h-full w-1.5 bg-[#FF0000]" />

      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1">
        {(news.category || news.channel) && (
          <span className="text-[0.7rem] uppercase tracking-wide font-semibold text-[#FF5555]">
            {news.category || news.channel}
          </span>
        )}
        <h3 className="font-bold leading-tight text-lg line-clamp-2">{news.title}</h3>
        {news.subtitle && <p className="text-sm text-gray-200 line-clamp-2">{news.subtitle}</p>}
        <span className="text-[0.7rem] text-gray-300 mt-1">{formatDate(news.date, lang)}</span>
      </div>
    </a>
  );
}

export default function EpflNews({ lang = "fr", count = 6, channel, interval = 10 }) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Carousel state — animate only on a real change (not on mount / single item).
  const [view, setView] = useState({ current: null, previous: null, animate: false });

  const t = STRINGS[lang] || STRINGS.fr;
  const limit = Number(count) || 6;
  const rotateMs = (Number(interval) || 10) * 1000;

  // Load news on mount and refresh every 15 minutes.
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const params = new URLSearchParams({ lang, limit: String(limit) });
        if (channel) params.set("channel", String(channel));
        const res = await fetch(`/api/epfl-news?${params.toString()}`);
        const data = await res.json();
        if (!active) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setIndex(0);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const refresh = setInterval(load, 15 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(refresh);
    };
  }, [lang, limit, channel]);

  // Rotate through the loaded news.
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), rotateMs);
    return () => clearInterval(id);
  }, [items.length, rotateMs]);

  // Drive the carousel: animate only on a real news change.
  useEffect(() => {
    const target = items.length > 0 ? items[Math.min(index, items.length - 1)] : null;
    setView((prev) => {
      if (!target) return { current: null, previous: null, animate: false };
      const same = prev.current && (prev.current.id ?? prev.current.title) === (target.id ?? target.title);
      if (!prev.current || same) {
        return { current: target, previous: null, animate: false };
      }
      return { current: target, previous: prev.current, animate: true };
    });
  }, [items, index]);

  // Drop the outgoing card once its slide-out has finished.
  useEffect(() => {
    if (!view.previous) return;
    const id = setTimeout(() => setView((v) => ({ ...v, previous: null, animate: false })), 520);
    return () => clearTimeout(id);
  }, [view.previous]);

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{t.loading}</div>;
  }
  if (items.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{t.empty}</div>;
  }

  const keyOf = (n) => n.id ?? n.title;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {view.previous && (
        <div key={keyOf(view.previous)} className="absolute inset-0 carousel-exit-left">
          <NewsCard news={view.previous} lang={lang} />
        </div>
      )}
      {view.current && (
        <div
          key={keyOf(view.current)}
          className={`absolute inset-0 ${view.animate ? "carousel-enter-right" : ""}`}
        >
          <NewsCard news={view.current} lang={lang} />
        </div>
      )}

      {/* Fixed rotation indicator (does not move with the cards) */}
      {items.length > 1 && (
        <div className="absolute bottom-2 right-3 z-10 flex gap-1">
          {items.map((it, i) => (
            <span
              key={keyOf(it) ?? i}
              className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

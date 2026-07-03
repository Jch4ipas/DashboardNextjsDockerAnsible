"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Swiss rail disruptions widget (SBB/CFF), focused on canton Vaud.
 *
 * Data: SBB open data via the /api/train-disruptions proxy. The dataset has no
 * canton field, so Vaud is matched heuristically on station/place names in the
 * title + description. Carries its own dark background so it's readable on both
 * the black public dashboard and the white backoffice grid.
 *
 * Props (all optional, set from the admin "props" panel):
 *   - region: "all" (whole Switzerland) or a comma list of place-name keywords
 *             to filter on. Default: canton Vaud.
 *   - label:  header title override.
 *   - lang:   "fr" | "en"   (default "fr")
 */
const STRINGS = {
  fr: { title: "Perturbations CFF", none: "Aucune perturbation", loading: "Chargement…", error: "Infos trafic indisponibles", ch: "Suisse" },
  en: { title: "SBB disruptions", none: "No disruptions", loading: "Loading…", error: "Traffic info unavailable", ch: "Switzerland" },
};

// Main railway places of canton Vaud (+ the " VD" disambiguation suffix).
const VAUD_KEYWORDS = [
  "lausanne", "renens", "prilly", "malley", "bussigny", "denges", "morges", "allaman",
  "rolle", "gland", "nyon", "coppet", "founex", "mies", "tannay", "vevey", "montreux",
  "villeneuve", "aigle", "bex", "yverdon", "grandson", "concise", "onnens", "chavornay",
  "orbe", "vallorbe", "le brassus", "le pont", "bière", "apples", "l'isle", "cossonay",
  "penthalaz", "echallens", "bercher", "moudon", "lucens", "payerne", "avenches",
  "palézieux", "chexbres", "puidoux", "cully", "lutry", "epesses", "st-saphorin",
  "la tour-de-peilz", "clarens", "sainte-croix", "ste-croix", "baulmes", " vd",
  "vaud", "rer vaud", "léman express",
];

function fmt(iso, lang) {
  try {
    return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "fr-CH", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0 mt-0.5 text-amber-400"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function TrainDisruptions({ region, label, lang = "fr" }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const animRef = useRef(null);

  const t = STRINGS[lang] || STRINGS.fr;

  // Load disruptions on mount and refresh every 5 minutes.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/train-disruptions");
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !Array.isArray(data.items)) {
          setStatus("error");
          return;
        }
        setItems(data.items);
        setStatus("ok");
      } catch {
        if (active) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const keywords = useMemo(() => {
    if (!region) return VAUD_KEYWORDS;
    if (String(region).toLowerCase() === "all") return null; // no filter
    return String(region).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }, [region]);

  const filtered = useMemo(() => {
    if (!keywords) return items;
    return items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    });
  }, [items, keywords]);

  const regionLabel = !region ? "Vaud" : String(region).toLowerCase() === "all" ? t.ch : region;

  // Auto-scroll the list vertically when it overflows (loop top → bottom → top).
  useEffect(() => {
    if (status !== "ok") return;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || typeof content.animate !== "function") return;
    animRef.current?.cancel();

    const raf = requestAnimationFrame(() => {
      const overflow = content.scrollHeight - viewport.clientHeight;
      if (overflow <= 4) return;
      const duration = 4000 + overflow * 45;
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
  }, [filtered.length, status]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden flex flex-col p-3 text-gray-100 bg-neutral-900">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-2 shrink-0 border-l-4 border-[#FF0000] pl-2 mb-2">
        <h3 className="font-bold text-base leading-tight truncate">{label || `${t.title} · ${regionLabel}`}</h3>
        {status === "ok" && filtered.length > 0 && (
          <span className="text-xs text-amber-400 font-semibold shrink-0">{filtered.length}</span>
        )}
      </div>

      {status === "loading" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t.loading}</div>
      )}
      {status === "error" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t.error}</div>
      )}
      {status === "ok" && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="text-sm">{t.none}</span>
        </div>
      )}

      {status === "ok" && filtered.length > 0 && (
        <div ref={viewportRef} className="flex-1 min-h-0 overflow-hidden">
          <div ref={contentRef} className="flex flex-col gap-2 pr-1">
            {filtered.map((d, i) => (
              <div key={d.link || i} className="border-b border-white/10 pb-2 last:border-0">
                <div className="flex items-start gap-2">
                  <AlertIcon />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{d.title}</p>
                    <p className="text-[0.7rem] text-gray-400">
                      {fmt(d.start, lang)} → {fmt(d.end, lang)}
                    </p>
                    {d.description && (
                      <p className="text-xs text-gray-300 leading-snug line-clamp-2 mt-0.5">{d.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

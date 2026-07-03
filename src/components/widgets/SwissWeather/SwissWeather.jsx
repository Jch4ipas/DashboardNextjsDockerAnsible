"use client";

import { useEffect, useState } from "react";
import WeatherIcon, { weatherLabel } from "./WeatherIcon";

/**
 * Swiss weather widget for the dashboard.
 *
 * Shows the current conditions and the day's hourly forecast for a location,
 * using the official MeteoSwiss ICON model (via the /api/weather proxy).
 * Carries its own dark background so it's readable on both the black public
 * dashboard and the white backoffice grid.
 *
 * Props (all optional, set from the admin "props" panel):
 *   - latitude / longitude: location             (default 46.519 / 6.566 (EPFL))
 *   - label:  place name shown in the header     (default "EPFL – Lausanne")
 *   - model:  "ch1" | "ch2"                      (default "ch1")
 *   - lang:   "fr" | "en"                        (default "fr")
 */
const STRINGS = {
  fr: { loading: "Chargement…", error: "Météo indisponible", wind: "Vent" },
  en: { loading: "Loading…", error: "Weather unavailable", wind: "Wind" },
};

function round(v) {
  return v == null ? "–" : Math.round(v);
}

function hhmm(iso, lang) {
  try {
    return new Date(iso).toLocaleTimeString(lang === "en" ? "en-GB" : "fr-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function Frame({ children }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden flex flex-col p-3 text-gray-100 bg-gradient-to-br from-slate-800 to-slate-900">
      {children}
    </div>
  );
}

export default function SwissWeather({
  latitude = 46.519,
  longitude = 6.566,
  label = "EPFL – Lausanne",
  model = "ch1",
  lang = "fr",
}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  const t = STRINGS[lang] || STRINGS.fr;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          model: String(model),
        });
        const res = await fetch(`/api/weather?${params.toString()}`);
        const j = await res.json();
        if (!active) return;
        if (!res.ok || !j.current) {
          setStatus("error");
          return;
        }
        setData(j);
        setStatus("ok");
      } catch {
        if (active) setStatus("error");
      }
    };

    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [latitude, longitude, model]);

  if (status === "loading") {
    return <Frame><div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t.loading}</div></Frame>;
  }
  if (status === "error") {
    return <Frame><div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t.error}</div></Frame>;
  }

  const { current, daily, hourly, units } = data;

  // Upcoming hours from now, every 2h, up to 6 slots (fallback: last 6 of day).
  const now = new Date();
  const upcoming = hourly.filter((h) => new Date(h.time) >= now);
  const source = (upcoming.length ? upcoming : hourly).filter((_, i) => i % 2 === 0).slice(0, 6);

  return (
    <Frame>
      {/* Header: location + source */}
      <div className="flex items-baseline justify-between gap-2 shrink-0">
        <h3 className="font-bold text-base leading-tight truncate border-l-4 border-[#FF0000] pl-2">
          {label}
        </h3>
        <span className="text-[0.6rem] text-gray-400 whitespace-nowrap">MétéoSuisse · {data.model}</span>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-3 my-2 shrink-0">
        <WeatherIcon code={current.code} isDay={current.isDay} className="w-14 h-14" />
        <div className="min-w-0">
          <div className="text-4xl font-bold leading-none">
            {round(current.temp)}<span className="text-2xl align-top">{units.temp}</span>
          </div>
          <div className="text-sm text-gray-300 truncate">{weatherLabel(current.code, lang)}</div>
        </div>
        <div className="ml-auto text-right text-xs text-gray-300 space-y-0.5 shrink-0">
          <div>
            <span className="text-red-300">↑ {round(daily.tMax)}°</span>{" "}
            <span className="text-sky-300">↓ {round(daily.tMin)}°</span>
          </div>
          <div>{t.wind} {round(current.wind)} {units.wind}</div>
          {daily.sunrise && daily.sunset && (
            <div className="text-gray-400">☀ {hhmm(daily.sunrise, lang)} – {hhmm(daily.sunset, lang)}</div>
          )}
        </div>
      </div>

      {/* Hourly strip for the day */}
      <div className="flex-1 min-h-0 flex items-end gap-1 overflow-x-auto">
        {source.map((h) => (
          <div key={h.time} className="flex flex-col items-center gap-0.5 flex-1 min-w-[2.5rem]">
            <span className="text-[0.65rem] text-gray-400">{hhmm(h.time, lang)}</span>
            <WeatherIcon code={h.code} isDay className="w-6 h-6" />
            <span className="text-sm font-medium">{round(h.temp)}°</span>
            {h.pop > 0 && <span className="text-[0.6rem] text-sky-300">{h.pop}%</span>}
          </div>
        ))}
      </div>
    </Frame>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * Backoffice multi-select for an EpflRestaurants box: tick one or several
 * restaurants and the box rotates through exactly those. The list of names is
 * fetched live from the restaurants API. Ticking nothing means "all".
 *
 * The selection is stored in the `restaurant` prop as an ARRAY of exact names.
 * Using an array (instead of a comma-joined string) is essential because some
 * restaurant names contain a comma (e.g. "Industrie 21, Sion").
 *
 * @param {{ value: string[]|string, onChange: (list: string[]) => void }} props
 */
export default function RestaurantSelect({ value, onChange }) {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/restaurants?lang=fr")
      .then((r) => (r.ok ? r.json() : { restaurants: [] }))
      .then((d) => {
        if (active) setNames((d.restaurants || []).map((r) => r.name).filter(Boolean));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Accept an array (current) or a legacy string; never split on commas.
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const norm = (x) => String(x).trim().toLowerCase();
  const isChecked = (name) => selected.some((s) => norm(s) === norm(name));

  const toggle = (name) => {
    const next = isChecked(name)
      ? selected.filter((s) => norm(s) !== norm(name))
      : [...selected, name];
    onChange(next);
  };

  return (
    <div>
      <div className="border border-epfl-perle rounded-lg max-h-48 overflow-y-auto p-1 bg-base-100">
        {loading && <p className="text-xs text-base-content/50 px-2 py-1">Chargement…</p>}
        {!loading && names.length === 0 && (
          <p className="text-xs text-base-content/50 px-2 py-1">Aucun restaurant</p>
        )}
        {names.map((name) => (
          <label
            key={name}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200 cursor-pointer"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-primary"
              checked={isChecked(name)}
              onChange={() => toggle(name)}
            />
            <span className="text-sm truncate">{name}</span>
          </label>
        ))}
      </div>
      <p className="text-[0.7rem] text-base-content/50 mt-1">
        {selected.length === 0
          ? "Aucun coché = tous les restaurants"
          : `${selected.length} restaurant(s) sélectionné(s)`}
      </p>
    </div>
  );
}

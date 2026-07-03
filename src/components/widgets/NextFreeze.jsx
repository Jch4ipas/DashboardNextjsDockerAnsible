"use client";
import { useState, useEffect } from "react";

/**
 * Returns the number of whole calendar days from today until an ISO date.
 *
 * @param {string} isoDate
 * @returns {number}
 */
function daysUntil(isoDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(isoDate);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetDay - today) / (1000 * 60 * 60 * 24));
}

/**
 * Formats an ISO date string for display in Swiss French locale.
 *
 * @param {string} isoDate
 * @returns {string}
 */
function fmt(isoDate) {
  return new Date(isoDate).toLocaleDateString("fr-CH");
}

export default function NextFreeze() {
  const [current, setCurrent] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/freeze")
      .then((res) => res.json())
      .then((data) => {
        setCurrent(data.current);
        setNext(data.next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const days = next && !current ? daysUntil(next.from) : null;

  return (
    <div
      className="flex flex-col justify-center items-start w-full h-full p-2 text-gray-300"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "1rem",
        gap: "0.5rem",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      {loading && (
        <p className="text-sm text-gray-400">Chargement...</p>
      )}

      {!loading && current && (
        <div className="w-full">
          <p className="text-lg font-bold m-0">En Freeze</p>
          <p className="text-sm m-0">
            jusqu'au <strong>{fmt(current.until)}</strong>
          </p>
          <p className="text-xs m-0 text-gray-400">{current.name}</p>
        </div>
      )}

      {!loading && next && (
        <div className="w-full">
          {current ? (
            <p className="text-sm">
              Prochain freeze :
              <br />
              <strong className="inline-block mt-2">{fmt(next.from)}</strong>{" "}
              au <strong>{fmt(next.until)}</strong>
            </p>
          ) : (
            <>
              <p className="text-base mb-2">
                Prochain freeze dans{" "}
                <strong className="text-lg">{days}</strong>{" "}
                jour{days > 1 ? "s" : ""}
              </p>
              <p className="text-sm m-0">
                <strong>{fmt(next.from)}</strong> au{" "}
                <strong>{fmt(next.until)}</strong>
              </p>
            </>
          )}
          <p className="italic text-gray-400 text-xs">{next.name}</p>
        </div>
      )}

      {!loading && !current && !next && (
        <p className="text-sm text-center w-full">Aucun freeze prévu prochainement.</p>
      )}
    </div>
  );
}

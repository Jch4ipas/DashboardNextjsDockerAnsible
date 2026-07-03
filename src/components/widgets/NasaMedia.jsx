"use client";

import { useEffect, useState } from "react";

export default function NasaMedia() {
  const [mediaData, setMediaData] = useState(null);
  const CACHE_KEY = "nasa_apod_cache";
  const TTL = 1000 * 60 * 60 * 3; // 3heure

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const isExpired = Date.now() > parsed.expiry;

      if (!isExpired) {
        setMediaData(parsed.data);
        return;
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    async function fetchData() {
      try {
        const response = await fetch("/api/apod");
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        setMediaData(data);

        // Mise en cache avec expiration
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data,
            expiry: Date.now() + TTL,
          })
        );
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    fetchData();
  }, []);

  if (!mediaData) return <p>Chargement...</p>;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      {mediaData.media_type === "video" ? (
        <div className="w-full h-full">
          <iframe
            src={mediaData.url}
            title="NASA Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full object-contain"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <a 
          href={mediaData.hdurl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={mediaData.url} 
            alt={mediaData.title} 
            className="max-w-full max-h-full object-contain"
            />
        </a>
      )}
    </div>
  );
}

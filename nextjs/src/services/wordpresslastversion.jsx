'use client';

import { useEffect, useState } from 'react';

export default function LatestWordPressVersion() {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('https://api.wordpress.org/core/version-check/1.7/');
        const data = await res.json();
        const latest = data.offers?.[0]?.current;
        setVersion(latest);
      } catch (err) {
        console.error('Erreur lors de la récupération de la version WordPress:', err);
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-xl font-bold p-20 min-h-screen">
      <h2 className="text-xl font-bold mb-2">
        Wordpress Version :
      </h2>
      {version ? (
        <p style={{ fontSize: '2rem', padding: '1rem' }}>{version}</p>
      ) : (
        <p className="text-gray-500">Chargement…</p>
      )}
    </div>
  );
}
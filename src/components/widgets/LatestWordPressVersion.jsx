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
    <div className="flex flex-col items-center justify-center text-xl font-bold w-full h-full p-4 text-center">
      <h2 className="text-lg mb-2">WordPress Version :</h2>
      {version ? (
        <p className="text-2xl">{version}</p>
      ) : (
        <p className="text-gray-500">Chargement…</p>
      )}
    </div>
  );
}
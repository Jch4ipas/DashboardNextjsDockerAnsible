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
    <div style={{
      padding: '5rem',
    }}>
      <h2 style={{ fontSize: '1.50rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Wordpress Version :
      </h2>
      {version ? (
        <p style={{ fontSize: '2rem' }}>{version}</p>
      ) : (
        <p style={{ color: '#666' }}>Chargement…</p>
      )}
    </div>
  );
}
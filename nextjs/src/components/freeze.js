"use client";
import { useState, useEffect } from "react";

function datediff(first, second) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

function normalize(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isInFreeze(today, period) {
  const start = normalize(new Date(period.start));
  const end = normalize(new Date(period.end));
  const now = normalize(today);
  return now >= start && now <= end;
}

function getNextFreezes(today, freezes) {
  const now = normalize(today);
  return freezes
    .filter(period => normalize(new Date(period.start)) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export default function NextFreeze() {
  const [currentFreeze, setCurrentFreeze] = useState(null);
  const [nextFreeze, setNextFreeze] = useState(null);
  const [nextNextFreeze, setNextNextFreeze] = useState(null);
  const [daysUntilNextFreeze, setDaysUntilNextFreeze] = useState(null);

  useEffect(() => {
    const today = new Date();

    fetch('/freezeDates.json')
      .then(res => res.json())
      .then(data => {
        const current = data.find(period => isInFreeze(today, period)) || null;
        const upcomingFreezes = getNextFreezes(today, data); // fix ici

        const next = upcomingFreezes[0] || null;
        const nextNext = upcomingFreezes[1] || null;

        setCurrentFreeze(current);
        setNextFreeze(next);
        setNextNextFreeze(nextNext);

        if (next) {
          const startDate = normalize(new Date(next.start));
          const days = datediff(normalize(today), startDate);
          setDaysUntilNextFreeze(days);
        } else {
          setDaysUntilNextFreeze(null);
        }
      })
      .catch(err => console.error('Erreur chargement freezeDates.json:', err));
  }, []);

  return (
  <div
    style={{
      display: 'flex',
      flexDirection:
        currentFreeze && (nextFreeze || nextNextFreeze) ? 'row' : 'column',
      justifyContent:
        currentFreeze && (nextFreeze || nextNextFreeze)
          ? 'space-between'
          : 'center',
      alignItems:
        currentFreeze && (nextFreeze || nextNextFreeze)
          ? 'center'
          : 'flex-start',
      padding: '1rem',
      gap: '2rem',
      fontFamily: 'Arial, sans-serif',
      color: '#c3c3c3',
      textAlign: 'left',
      minHeight: '200px',
    }}
  >
    {currentFreeze && (
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
          <span style={{ color: '#FFFFFF' }}>En Freeze</span>
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>
          jusqu’au <strong>{new Date(currentFreeze.end).toLocaleDateString('fr-CH')}</strong>
        </p>
        <p style={{ color: '#FFFFFF', fontSize: '1rem', margin: 0 }}>
          {currentFreeze.description}
        </p>
      </div>
    )}

    {(nextFreeze || nextNextFreeze) && (
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {nextFreeze && (
          <>
            {currentFreeze ? (
              <p style={{ fontSize: '1rem' }}>
                Prochain freeze :<br />
                <strong style={{ display: 'inline-block' , marginTop: "1.5rem" }}>{new Date(nextFreeze.start).toLocaleDateString('fr-CH')}</strong> au{' '}
                <strong>{new Date(nextFreeze.end).toLocaleDateString('fr-CH')}</strong>
              </p>
            ) : (
              <>
                <p style={{ fontSize: '1.4rem', marginBottom: '2rem' }}>
                  Prochain freeze dans{' '}
                  <strong style={{ fontSize: '1.6rem', color: '#FFFFFF' }}>
                    {daysUntilNextFreeze}
                  </strong>{' '}
                  jour{daysUntilNextFreeze > 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: '1rem', margin: 0 }}>
                  <strong>{new Date(nextFreeze.start).toLocaleDateString('fr-CH')}</strong> au{' '}
                  <strong>{new Date(nextFreeze.end).toLocaleDateString('fr-CH')}</strong>
                </p>
              </>
            )}
            {nextFreeze.description && (
              <p style={{fontStyle: 'italic', color: '#aaaaaa' }}>
                {nextFreeze.description}
              </p>
            )}
          </>
        )}

        {nextNextFreeze && (
          <div>
            <p style={{ fontSize: '1rem', margin: 0 }}>
              <span style={{ color: '#FFFFFF', fontWeight: 'bold' , marginBottom: '0.3rem', marginTop: '0.3rem', display: 'inline-block'  }}>
                {nextFreeze ? 'Et' : 'Prochain freeze'}
              </span><br />
              <strong>{new Date(nextNextFreeze.start).toLocaleDateString('fr-CH')}</strong> au{' '}
              <strong>{new Date(nextNextFreeze.end).toLocaleDateString('fr-CH')}</strong><br />
              <span>{nextNextFreeze.description}</span>
            </p>
          </div>
        )}
      </div>
    )}

    {!currentFreeze && !nextFreeze && !nextNextFreeze && (
      <p style={{ fontSize: '1rem', textAlign: 'center', width: '100%' }}>
        Aucun freeze prévu prochainement.
      </p>
    )}
  </div>
  );
}

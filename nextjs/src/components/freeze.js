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

function getNextFreeze(today, freezes) {
  const now = normalize(today);
  return (
    freezes
      .filter(period => normalize(new Date(period.start)) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0] || null
  );
}


export default function NextFreeze() {
  const [currentFreeze, setCurrentFreeze] = useState(null);
  const [nextFreeze, setNextFreeze] = useState(null);
  const [daysUntilNextFreeze, setDaysUntilNextFreeze] = useState(null);

  useEffect(() => {
    const today = new Date();

    fetch('/freezeDates.json')
      .then(res => res.json())
      .then(data => {
        const current = data.find(period => isInFreeze(today, period)) || null;
        const next = getNextFreeze(today, data);
        setCurrentFreeze(current);
        setNextFreeze(next);

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
    <div>
      {currentFreeze ? (
        <p style={{ color: '#c3c3c3', fontSize: '2rem', fontWeight: 'bold' }}>
          <strong style={{ color: '#FFFFFF' }}>En Freeze</strong><br></br>jusqu'au {new Date(currentFreeze.end).toLocaleDateString('fr-CH')}
        </p>
      ) : nextFreeze ? (
        <p style={{ color: '#c3c3c3', fontSize: '2rem' }}>
          Freeze dans <strong style={{ fontSize: '2.5rem', color: '#FFFFFF' }}>{daysUntilNextFreeze}</strong> jour
          <br></br>du <strong>{new Date(nextFreeze.start).toLocaleDateString('fr-CH')}</strong> au <strong>{new Date(nextFreeze.end).toLocaleDateString('fr-CH')}</strong>
        </p>
      ) : (
        <p>Aucun freeze prévu prochainement.</p>
      )}
    </div>
  );
}
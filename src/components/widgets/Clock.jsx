"use client";
import { useState, useEffect } from "react";

export default function Clock() {
  const [dateTime, setDateTime] = useState(new Date());
  const [date, setDate] = useState(new Date().toLocaleDateString('fr-CH'));
  const [hour, setHour] = useState(new Date().toLocaleTimeString('fr-CH'));

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
      setDate(new Date().toLocaleDateString('fr-CH'))
      setHour(new Date().toLocaleTimeString('fr-CH'))
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-xl font-bold">
      <span>{date}</span>
      <span>{hour}</span>
    </div>
  );
}
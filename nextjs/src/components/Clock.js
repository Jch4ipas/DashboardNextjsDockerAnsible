"use client";
import { useState, useEffect } from "react";

export default function Clock() {
  const [dateTime, setDateTime] = useState(new Date());
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [hour, setHour] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
      setDate(new Date().toLocaleDateString())
      setHour(new Date().toLocaleTimeString())
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
"use client";
import { useState, useEffect } from "react";

export default function Clock() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-xl font-bold">
      <span>{dateTime.toLocaleDateString()}</span>
      <span>{dateTime.toLocaleTimeString()}</span>
    </div>
  );
}

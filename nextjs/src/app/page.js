"use client";

import { useState, useEffect } from "react";
import NasaMedia from "@/services/infonasa"
import Clock from "@/components/Clock";
import LatestWordPressVersion from "@/services/wordpresslastversion";
import NextFreeze from "@/components/freeze";

export default function Home() {

  const [activeBoxSet, setActiveBoxSet] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveBoxSet((prev) => (prev + 1) % allBoxSets.length);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);


  const boxes1 = [
    { id: 1, width: 2, height: 4, content: <iframe src="https://actu.epfl.ch/" className="w-full h-full"></iframe>},
    { id: 2, width: 2, height: 2, content: <iframe src="https://support.epfl.ch/now/nav/ui/classic/params/target/epfl_status_panel.do"></iframe>  },
    { id: 3, width: 1, height: 1, content: <LatestWordPressVersion></LatestWordPressVersion>},
    { id: 4, width: 1, height: 1, content: <Clock></Clock> },
    { id: 5, width: 2, height: 2, content: <NasaMedia></NasaMedia> },
    { id: 6, width: 2, height: 2, content: <h1>Hello</h1>},
    { id: 7, width: 2, height: 1, content: <NextFreeze></NextFreeze>},
  ];

  const boxes2 = [
    { id: 1, width: 5, height: 1, content: <p className="flex text-xl font-bold items-center justify-center">Hello World</p>  },
    { id: 2, width: 1, height: 1, content: <Clock></Clock>},
    { id: 3, width: 6, height: 3, content: <h1>WPN</h1>},
  ];

  const allBoxSets = [boxes1];
  const currentBoxes = allBoxSets[activeBoxSet];

  return (
    <div className="h-screen w-full">
      <div className="grid grid-cols-6 grid-rows-4 gap-2 w-full h-full p-2">
        {currentBoxes.map((box) => (
          <div
            key={box.id}
            className="border border-gray-600 rounded-3xl flex justify-center items-center text-white font-bold shadow-md p-2"
            style={{
              gridColumn: `span ${box.width}`,
              gridRow: `span ${box.height}`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
              {box.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

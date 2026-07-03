import Clock from "@/components/Clock";
import NasaMedia from "@/services/infonasa";
import LatestWordPressVersion from "@/services/wordpresslastversion";
import Salleinfo from "@/services/Salleinfo";
import NextFreeze from "@/components/freeze";
import GrafanaPanel from "@/components/GrafanaPanel";
import EpflNews from "@/components/EpflNews";
import EpflRestaurants from "@/components/EpflRestaurants";
import SwissWeather from "@/components/SwissWeather";

export const registry = {
  Clock,
  NasaMedia,
  LatestWordPressVersion,
  Salleinfo,
  NextFreeze,
  GrafanaPanel,
  EpflNews,
  EpflRestaurants,
  SwissWeather,
  "": () => <></>,
  iframe: (props) => <iframe {...props} />,
};

export const reverseRegistry = Object.fromEntries(
  Object.entries(registry).map(([key, value]) => [value, key])
);
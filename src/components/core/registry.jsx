import Clock from "@/components/widgets/Clock";
import NasaMedia from "@/components/widgets/NasaMedia";
import LatestWordPressVersion from "@/components/widgets/LatestWordPressVersion";
import Salleinfo from "@/components/widgets/Salleinfo";
import NextFreeze from "@/components/widgets/NextFreeze";
import GrafanaPanel from "@/components/widgets/GrafanaPanel";
import EpflNews from "@/components/widgets/EpflNews";
import EpflRestaurants from "@/components/widgets/EpflRestaurants/EpflRestaurants";
import SwissWeather from "@/components/widgets/SwissWeather/SwissWeather";
import TrainDisruptions from "@/components/widgets/TrainDisruptions";

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
  TrainDisruptions,
  "": () => <></>,
  iframe: (props) => <iframe {...props} />,
};

export const reverseRegistry = Object.fromEntries(
  Object.entries(registry).map(([key, value]) => [value, key])
);
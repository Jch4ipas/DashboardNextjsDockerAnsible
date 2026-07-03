/**
 * Server-side proxy for a Swiss point weather forecast.
 *
 * Source: the official MeteoSwiss ICON-CH1/CH2 model, served as clean JSON by
 * Open-Meteo (the raw MeteoSwiss OGD forecast is GRIB2 only, impractical for a
 * lightweight widget). Free, no API key. We proxy it to cache the response and
 * trim the payload.
 *
 * Query params: latitude, longitude, model (ch1|ch2). Defaults to EPFL.
 */
const BASE = "https://api.open-meteo.com/v1/forecast";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("latitude") || "46.519";
  const lon = searchParams.get("longitude") || "6.566";
  const model = searchParams.get("model") === "ch2" ? "meteoswiss_icon_ch2" : "meteoswiss_icon_ch1";

  const url = new URL(BASE);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset");
  url.searchParams.set("models", model);
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  try {
    // ICON-CH1 refreshes every 3h — 30 min cache is plenty.
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return Response.json({ error: "Weather API error" }, { status: 502 });
    }
    const j = await res.json();

    const h = j.hourly || {};
    const hourly = (h.time || []).map((time, i) => ({
      time,
      temp: h.temperature_2m?.[i] ?? null,
      pop: h.precipitation_probability?.[i] ?? null,
      code: h.weather_code?.[i] ?? null,
    }));
    const d = j.daily || {};

    return Response.json({
      current: {
        time: j.current?.time || null,
        temp: j.current?.temperature_2m ?? null,
        code: j.current?.weather_code ?? null,
        wind: j.current?.wind_speed_10m ?? null,
        isDay: j.current?.is_day === 1,
      },
      hourly,
      daily: {
        code: d.weather_code?.[0] ?? null,
        tMax: d.temperature_2m_max?.[0] ?? null,
        tMin: d.temperature_2m_min?.[0] ?? null,
        sunrise: d.sunrise?.[0] ?? null,
        sunset: d.sunset?.[0] ?? null,
      },
      units: {
        temp: j.current_units?.temperature_2m || "°C",
        wind: j.current_units?.wind_speed_10m || "km/h",
      },
      model: model === "meteoswiss_icon_ch2" ? "ICON-CH2" : "ICON-CH1",
    });
  } catch {
    return Response.json({ error: "Weather API unreachable" }, { status: 502 });
  }
}

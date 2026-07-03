/**
 * Server-side proxy for Swiss rail disruptions.
 *
 * Source: SBB/CFF open data (data.sbb.ch, dataset "rail-traffic-information",
 * Opendatasoft Records API v2.1). Free, no API key, JSON. We keep only the
 * currently active/upcoming disruptions, dedupe status updates for the same
 * line, and trim the payload. Region filtering (e.g. Vaud) is done in the
 * widget, on place names — the dataset has no canton field.
 */
const BASE =
  "https://data.sbb.ch/api/explore/v2.1/catalog/datasets/rail-traffic-information/records";

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  // Active or upcoming disruptions, soonest first.
  const url =
    `${BASE}?where=${encodeURIComponent("enddatetime>=now()")}` +
    `&order_by=startdatetime&limit=50`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
    if (!res.ok) {
      return Response.json({ error: "SBB API error" }, { status: 502 });
    }
    const j = await res.json();

    // Dedupe by affected line (text after the first ":"), keeping the latest
    // published record — collapses "Interrupted"→"Limited"→"Resumed" updates
    // for the same segment into its current status.
    const byLine = new Map();
    for (const r of j.results || []) {
      const title = r.title || "";
      const key = (title.split(":").slice(1).join(":").trim() || title).toLowerCase();
      const prev = byLine.get(key);
      if (!prev || new Date(r.published) > new Date(prev.published)) {
        byLine.set(key, r);
      }
    }

    const items = [...byLine.values()]
      .sort((a, b) => new Date(a.startdatetime) - new Date(b.startdatetime))
      .map((r) => ({
        title: clean(r.title),
        description: clean(r.description),
        start: r.startdatetime,
        end: r.enddatetime,
        link: r.link,
        published: r.published,
      }));

    return Response.json({ items });
  } catch {
    return Response.json({ error: "SBB API unreachable" }, { status: 502 });
  }
}

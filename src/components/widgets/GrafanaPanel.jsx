"use client";

export default function GrafanaPanel({ instanceId, dashboardUid, src }) {
  if (instanceId && dashboardUid) {
    return (
      <iframe
        src={`/d/${dashboardUid}?kiosk&_gi=${encodeURIComponent(instanceId)}`}
        className="w-full h-full border-0"
        allowFullScreen
      />
    );
  }

  if (src) {
    let path, search;
    try {
      const url = new URL(src);
      path = url.pathname;
      search = url.search;
    } catch {
      const [p, q] = src.split("?");
      path = p;
      search = q ? `?${q}` : "";
    }
    if (!search.includes("kiosk")) search = search ? `${search}&kiosk` : "?kiosk";
    return <iframe src={`${path}${search}`} className="w-full h-full border-0" allowFullScreen />;
  }

  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center p-4">
      Aucun dashboard configuré.<br />Utilisez &quot;Choisir un dashboard&quot; dans l&apos;admin.
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Self-contained Grafana dashboard picker.
 *
 * Layout: two columns inside a fixed-height panel.
 *   Left  — instance list with red active accent; "+" inline add-form.
 *   Right — dashboards auto-loaded on instance selection.
 *
 * @param {(instanceId: string, dashboard: object) => void} onSelect
 */
export default function GrafanaPicker({ onSelect }) {
  const t = useTranslations("grafanaPicker");

  const [instances, setInstances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashError, setDashError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Id of the instance awaiting delete confirmation, or null
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => { fetchInstances(); }, []);

  useEffect(() => {
    if (!selected) return;
    fetchDashboards(selected.id);
  }, [selected]);

  async function fetchInstances() {
    const res = await fetch("/api/grafana-instances");
    if (!res.ok) return;
    const data = await res.json();
    setInstances(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
  }

  async function fetchDashboards(instanceId) {
    setLoading(true);
    setDashError("");
    setDashboards([]);
    const res = await fetch(`/api/grafana-instances/${instanceId}/dashboards`);
    if (res.ok) {
      setDashboards(await res.json());
    } else {
      const body = await res.json().catch(() => ({}));
      setDashError(body.error || t("loadError"));
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!name.trim() || !url.trim() || !token.trim()) {
      setAddError(t("requiredFields"));
      return;
    }
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/grafana-instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), url: url.trim(), token: token.trim() }),
    });
    if (res.ok) {
      const inst = await res.json();
      setName(""); setUrl(""); setToken("");
      setShowForm(false);
      await fetchInstances();
      setSelected(inst);
    } else {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error || t("error"));
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    await fetch(`/api/grafana-instances/${id}`, { method: "DELETE" });
    if (selected?.id === id) { setSelected(null); setDashboards([]); }
    setPendingDelete(null);
    await fetchInstances();
  }

  return (
    <div className="flex gap-4 h-80">
      {/* Left column — instance list */}
      <div className="w-48 flex flex-col gap-1 overflow-y-auto shrink-0">
        {instances.map((inst) => (
          <div key={inst.id} className="flex items-stretch gap-1">
            {pendingDelete === inst.id ? (
              <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded-lg bg-error/10 border border-error/30">
                <span className="text-xs text-error flex-1 truncate font-medium">
                  {t("confirmDelete")}
                </span>
                <button
                  className="btn btn-error btn-xs"
                  onClick={() => handleDelete(inst.id)}
                >
                  {t("yes")}
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPendingDelete(null)}
                >
                  {t("no")}
                </button>
              </div>
            ) : (
              <>
                <button
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all truncate
                    ${selected?.id === inst.id
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "hover:bg-base-200 text-base-content border-l-4 border-transparent"}`}
                  onClick={() => setSelected(inst)}
                >
                  {inst.name}
                </button>
                <button
                  className="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100"
                  aria-label={t("deleteInstance")}
                  onClick={(e) => { e.stopPropagation(); setPendingDelete(inst.id); }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}

        {/* Add instance */}
        <button
          className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-primary border border-dashed border-primary/40 hover:bg-primary/5 transition-colors"
          onClick={() => setShowForm((v) => !v)}
        >
          <span className="font-bold text-base leading-none">+</span>
          {t("addInstance")}
        </button>

        {showForm && (
          <div className="flex flex-col gap-2 mt-1 p-3 bg-base-200 rounded-xl border border-base-300">
            <input
              className="input input-bordered input-xs w-full focus:border-primary"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input input-bordered input-xs w-full focus:border-primary"
              placeholder={t("urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              className="input input-bordered input-xs w-full focus:border-primary"
              type="password"
              placeholder={t("tokenPlaceholder")}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            {addError && <p className="text-error text-xs">{addError}</p>}
            <button
              className="btn btn-primary btn-xs w-full"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? t("adding") : t("confirm")}
            </button>
          </div>
        )}
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-base-300 shrink-0" />

      {/* Right column — dashboard list */}
      <div className="flex-1 overflow-y-auto">
        {!selected && (
          <p className="text-sm text-base-content/40 mt-3 px-1">{t("selectInstance")}</p>
        )}
        {selected && loading && (
          <div className="flex items-center gap-2 mt-3 px-1 text-sm text-base-content/50">
            <span className="loading loading-spinner loading-xs" />
            {t("loading")}
          </div>
        )}
        {selected && dashError && (
          <p className="text-error text-sm mt-3 px-1">{dashError}</p>
        )}
        {dashboards.map((d) => (
          <button
            key={d.uid}
            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-colors truncate text-base-content"
            onClick={() => onSelect(selected.id, d)}
          >
            {d.title}
          </button>
        ))}
        {selected && !loading && !dashError && dashboards.length === 0 && (
          <p className="text-sm text-base-content/40 mt-3 px-1">{t("noDashboards")}</p>
        )}
      </div>
    </div>
  );
}

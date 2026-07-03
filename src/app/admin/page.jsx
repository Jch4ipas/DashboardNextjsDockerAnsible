"use client";

import { saveData } from "@/services/saveJSON";
import { loadData } from "@/services/loadJSON";
import { buildBoxes } from "@/components/core/buildBoxes";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { registry } from "@/components/core/registry";
import Modal from "@/components/ui/Modal";
import GrafanaPicker from "@/components/admin/GrafanaPicker";
import RestaurantSelect from "@/components/admin/RestaurantSelect";

/** Shared EPFL input styling — flat field with a primary focus border. */
const inputClass = "input input-bordered input-sm w-full focus:border-primary";

/** The four numeric box-geometry fields, rendered from a single map. */
const BOX_DIMENSIONS = [
    ["Width", "width"],
    ["Height", "height"],
    ["X", "x"],
    ["Y", "y"],
];

/** Labelled form row — keeps left-panel forms DRY. */
function Field({ label, children }) {
    return (
        <div className="form-control w-full">
            <label className="label py-1">
                <span className="label-text text-xs font-medium text-epfl-ardoise uppercase tracking-wide">
                    {label}
                </span>
            </label>
            {children}
        </div>
    );
}

export default function BackOffice() {
    const t = useTranslations("admin");
    const [boxe, setBoxe] = useState([]);
    const [boxSerializable, setBoxSerializable] = useState([]);
    const [activeBox, setActiveBox] = useState(1);
    const [selectedBox, setSelectedBox] = useState([]);
    const [currentContainer, setCurrentContainer] = useState([]);
    const [currentContainerWithEverything, setCurrentContainerWithEverything] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(0);
    const [newPropKey, setNewPropKey] = useState("");
    const [showPropModal, setShowPropModal] = useState(false);
    const [showNotEnoughSpaceForNewBoxModal, setShowNotEnoughSpaceForNewBoxModal] = useState(false);
    const [newPropValue, setNewPropValue] = useState("");
    const [draggedBoxId, setDraggedBoxId] = useState(null);
    const [hoveredBoxId, setHoveredBoxId] = useState(null);
    const [showDashboardPicker, setShowDashboardPicker] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [externalChange, setExternalChange] = useState(false);
    const gridRef = useRef(null);
    const savedToastTimer = useRef(null);
    // Config version (ETag) from the last load/save, for optimistic concurrency.
    // Kept in a ref so the SSE listener always compares against the latest value.
    const versionRef = useRef(null);

    // Clear the auto-dismiss timer if the component unmounts mid-toast.
    useEffect(() => () => clearTimeout(savedToastTimer.current), []);

    useEffect(() => { handleLoad(); }, []);

    // Warn (don't clobber) when someone else saves the config while editing.
    // The existing SSE channel fires "update" on every save; we then re-check
    // the version and only flag a banner if it differs from ours.
    useEffect(() => {
        const evt = new EventSource("/api/events");
        evt.onmessage = async (event) => {
            if (event.data !== "update") return;
            try {
                const res = await fetch("/api/jsonConfig", { cache: "no-store" });
                const { version: latest } = await res.json();
                if (latest && latest !== versionRef.current) setExternalChange(true);
            } catch { /* ignore transient fetch errors */ }
        };
        return () => evt.close();
    }, []);

    useEffect(() => {
        if (boxSerializable.length > selectedContainer) {
            setCurrentContainerWithEverything(boxSerializable[selectedContainer]);
            setCurrentContainer(boxSerializable[selectedContainer].boxes);
        }
    }, [boxSerializable, selectedContainer]);

    useEffect(() => {
        setSelectedBox(currentContainer.find(box => box.id === activeBox));
    }, [activeBox]);

    useEffect(() => {
        setBoxe(buildBoxes(currentContainer));
    }, [currentContainer]);

    useEffect(() => {
        if (boxSerializable.length > 0 && !boxSerializable.some((_, index) => index === selectedContainer)) {
            const lastIndex = currentContainer.length > 0
                ? Math.min(...boxSerializable.map((_, index) => index))
                : 0;
            setSelectedContainer(lastIndex);
        }
        setBoxe(buildBoxes(currentContainer));
    }, [boxSerializable]);

    useEffect(() => {
        if (currentContainer.length > 0 && activeBox) {
            const found = currentContainer.find(box => box.id === activeBox);
            setSelectedBox(found || null);
        }
    }, [currentContainer, activeBox]);

    const handleModifyCurrentContainerWithEverything = async (value, key) => {
        const theCurrentContainerWithEverything = { ...currentContainerWithEverything, [key]: value };
        setCurrentContainerWithEverything({ ...currentContainerWithEverything, [key]: value });
        setBoxSerializable(prev =>
            prev.map((container, index) =>
                index === selectedContainer ? theCurrentContainerWithEverything : container
            )
        );
    };

    const handleSave = async (array) => {
        const res = await saveData(array, versionRef.current);
        if (res.ok) {
            versionRef.current = res.version;
            setExternalChange(false);
            setShowSavedToast(true);
            clearTimeout(savedToastTimer.current);
            savedToastTimer.current = setTimeout(() => setShowSavedToast(false), 2000);
        } else if (res.conflict) {
            setShowConflictModal(true);
        }
    };

    const handleLoad = async () => {
        const { data, version } = await loadData();
        versionRef.current = version;
        setExternalChange(false);
        setBoxSerializable(data);
        setBoxe(buildBoxes(data));
    };

    const handleUpdateContainer = async (thecurrentcontainer) => {
        const updatedContainerWithEverything = { ...currentContainerWithEverything, boxes: thecurrentcontainer };
        setBoxSerializable(prev =>
            prev.map((container, index) =>
                index === selectedContainer ? updatedContainerWithEverything : container
            )
        );
    };

    const handleNewBox = () => {
        const lastId = currentContainer.length > 0
            ? Math.max(...currentContainer.map(box => box.id))
            : 0;
        const position = findNextAvailablePosition(currentContainer, 1, 1, currentContainerWithEverything.gridWidth, currentContainerWithEverything.gridHeight);
        if (!position) {
            setShowNotEnoughSpaceForNewBoxModal(true);
        } else {
            const newBox = { id: lastId + 1, width: 1, height: 1, x: position.x, y: position.y, type: "" };
            const updatedContainer = [...currentContainer, newBox];
            handleUpdateContainer(updatedContainer);
            setBoxe(buildBoxes(updatedContainer));
            setActiveBox(lastId);
        }
    };

    const handleDeleteBox = async () => {
        const index = currentContainer.findIndex((box) => box.id === activeBox);
        const updatedContainer = currentContainer.filter((box) => box.id !== activeBox);
        await handleUpdateContainer(updatedContainer);
        setBoxe(buildBoxes(updatedContainer));
        if (updatedContainer.length > 0) {
            const newIndex = index > 0 ? index - 1 : 0;
            const newBoxId = updatedContainer[newIndex].id;
            setActiveBox(newBoxId);
            setTimeout(() => {
                document.getElementById(`box-${newBoxId}`)?.focus();
            }, 0);
        }
    };

    const handleUpdateBox = () => {
        const updatedContainer = currentContainer.map(box => box.id === activeBox ? selectedBox : box);
        handleUpdateContainer(updatedContainer);
        setBoxe(buildBoxes(updatedContainer));
    };

    const handleNewContainer = () => {
        const lastId = boxSerializable.length > 0
            ? Math.max(...boxSerializable.map(container => container.id))
            : 0;
        setBoxSerializable([...boxSerializable, {
            id: lastId + 1, name: "New Container", isGoingToDisplay: false,
            durationDisplay: 30, gridHeight: 4, gridWidth: 6, boxes: [],
        }]);
        setSelectedContainer(boxSerializable.length);
    };

    const handleDeleteContainer = () => {
        setBoxSerializable(boxSerializable.filter((_, index) => index !== selectedContainer));
    };

    const handleNewProp = () => {
        if (!newPropKey) return;
        const newProps = { ...(selectedBox.props || {}), [newPropKey]: newPropValue };
        const updatedBox = { ...selectedBox, props: newProps };
        setSelectedBox(updatedBox);
        handleUpdateContainer(currentContainer.map(box => box.id === activeBox ? updatedBox : box));
    };

    const handleSelectDashboard = (instanceId, dashboard) => {
        const updatedBox = {
            ...selectedBox,
            props: { ...(selectedBox.props || {}), instanceId, dashboardUid: dashboard.uid },
        };
        setSelectedBox(updatedBox);
        handleUpdateContainer(currentContainer.map(box => box.id === activeBox ? updatedBox : box));
        setShowDashboardPicker(false);
    };

    const handleSelectRestaurant = (list) => {
        const nextProps = { ...(selectedBox.props || {}) };
        if (Array.isArray(list) && list.length > 0) nextProps.restaurant = list;
        else delete nextProps.restaurant;
        const updatedBox = { ...selectedBox, props: nextProps };
        setSelectedBox(updatedBox);
        handleUpdateContainer(currentContainer.map(box => box.id === activeBox ? updatedBox : box));
    };

    const handleDeleteProps = (key) => {
        const updatedProps = Object.entries(selectedBox.props).filter(([k]) => k !== key);
        const updatedBox = { ...selectedBox, props: Object.fromEntries(updatedProps) };
        setSelectedBox(updatedBox);
        handleUpdateContainer(currentContainer.map(box => box.id === activeBox ? updatedBox : box));
    };

    const findNextAvailablePosition = (boxes, newWidth = 1, newHeight = 1, gridColumns, gridRows) => {
        const grid = Array.from({ length: gridRows }, () => Array(gridColumns).fill(false));
        for (const box of boxes) {
            if (box.x == null || box.y == null) continue;
            for (let dy = 0; dy < box.height; dy++) {
                for (let dx = 0; dx < box.width; dx++) {
                    grid[(box.y - 1) + dy][(box.x - 1) + dx] = true;
                }
            }
        }
        for (let y = 0; y < gridRows; y++) {
            for (let x = 0; x < gridColumns; x++) {
                let canPlace = true;
                for (let dy = 0; dy < newHeight; dy++) {
                    for (let dx = 0; dx < newWidth; dx++) {
                        if (y + dy >= gridRows || x + dx >= gridColumns || grid[y + dy][x + dx]) {
                            canPlace = false;
                            break;
                        }
                    }
                }
                if (canPlace) return { x: x + 1, y: y + 1 };
            }
        }
        return null;
    };

    const handleStretchedBox = (boxId, isX, isAdding) => {
        if (boxId === null) return;
        const updatedContainer = currentContainer.map(box => {
            if (box.id !== boxId) return box;
            if (isX) return { ...box, width: isAdding ? box.width + 1 : box.width === 1 ? box.width : box.width - 1 };
            return { ...box, height: isAdding ? box.height + 1 : box.height === 1 ? box.height : box.height - 1 };
        });
        handleUpdateContainer(updatedContainer);
    };

    const handleDeleteBoxBackspaceKeyDown = (event, idBox) => {
        if (event.key === "Backspace") {
            event.preventDefault();
            if (idBox === activeBox) handleDeleteBox();
        }
    };

    const handleDragStart = (id) => { setDraggedBoxId(id); };

    const isCellOccupied = (x, y, width, height, idToIgnore = null) =>
        currentContainer.some((b) => {
            if (b.id === idToIgnore) return false;
            const bx1 = Number(b.x), by1 = Number(b.y), bw = Number(b.width), bh = Number(b.height);
            return !(x + width - 1 < bx1 || x > bx1 + bw - 1 || y + height - 1 < by1 || y > by1 + bh - 1);
        });

    const moveBoxTo = (id, x, y) => {
        const updated = currentContainer.map((b) => b.id === id ? { ...b, x, y } : b);
        handleUpdateContainer(updated);
        setBoxe(buildBoxes(updated));
    };

    const handleDrop = (e, targetBoxId) => {
        e.preventDefault();
        if (!draggedBoxId) return;
        if (targetBoxId) {
            const draggedBox = currentContainer.find((b) => b.id === draggedBoxId);
            const targetBox = currentContainer.find((b) => b.id === targetBoxId);
            if (!draggedBox || !targetBox) return;
            const updatedContainer = currentContainer.map((box) => {
                if (box.id === draggedBoxId) return { ...box, x: targetBox.x, y: targetBox.y };
                if (box.id === targetBoxId) return { ...box, x: draggedBox.x, y: draggedBox.y };
                return box;
            });
            handleUpdateContainer(updatedContainer);
            setDraggedBoxId(null);
            return;
        }
        if (!gridRef.current) return;
        const gridRect = gridRef.current.getBoundingClientRect();
        const nbCols = currentContainerWithEverything?.gridWidth || 1;
        const nbRows = currentContainerWithEverything?.gridHeight || 1;
        const cellWidth = gridRect.width / nbCols;
        const cellHeight = gridRect.height / nbRows;
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        let x = Math.max(1, Math.min(nbCols, Math.floor((clientX - gridRect.left) / cellWidth) + 1));
        let y = Math.max(1, Math.min(nbRows, Math.floor((clientY - gridRect.top) / cellHeight) + 1));
        const draggedBox = currentContainer.find((b) => b.id === draggedBoxId);
        if (!draggedBox) { setDraggedBoxId(null); return; }
        if (!isCellOccupied(x, y, Number(draggedBox.width), Number(draggedBox.height), draggedBoxId)) {
            moveBoxTo(draggedBoxId, x, y);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-base-200">
            {/* External-change banner — someone else saved while editing */}
            {externalChange && (
                <div className="flex items-center gap-3 px-4 py-2 bg-warning/15 border-b border-warning text-warning-content text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
                    </svg>
                    <span className="flex-1 text-base-content">{t("externalChange")}</span>
                    <button className="btn btn-sm btn-warning" onClick={handleLoad}>
                        {t("reload")}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setExternalChange(false)} aria-label={t("dismiss")}>
                        ✕
                    </button>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="h-14 flex items-center gap-2 px-4 bg-base-100 border-b border-epfl-perle shadow-sm">
                {/* New container */}
                <button
                    className="btn btn-primary btn-sm gap-1"
                    onClick={handleNewContainer}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {t("newContainer")}
                </button>

                {/* Container selector */}
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-sm btn-ghost border border-epfl-perle gap-1 min-w-36 justify-between">
                        <span className="truncate max-w-32">
                            {currentContainerWithEverything?.name || t("containers")}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg bg-base-100 rounded-xl border border-epfl-perle w-52 z-50">
                        {boxSerializable.map((container, index) => (
                            <li key={container.id}>
                                <button
                                    className={`w-full text-left rounded-lg px-3 py-2 text-sm ${selectedContainer === index ? "bg-primary/10 text-primary font-medium" : "hover:bg-base-200"}`}
                                    onClick={() => setSelectedContainer(index)}
                                >
                                    {container.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Delete container */}
                <button
                    className="btn btn-sm btn-ghost text-error"
                    aria-label={t("delete")}
                    onClick={handleDeleteContainer}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                </button>

                <div className="flex-1" />

                {/* Save */}
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSave(boxSerializable)}
                >
                    {t("save")}
                </button>
            </div>

            {/* ── Main area ── */}
            <main className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Left panel */}
                <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
                    {/* Container settings card */}
                    <div className="bg-base-100 rounded-xl border border-epfl-perle p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1 pb-3 border-b border-epfl-perle/40">
                            <div className="w-1 h-5 rounded-full bg-primary shrink-0" />
                            <input
                                className="flex-1 text-base font-semibold bg-transparent border-none focus:outline-none text-base-content placeholder:text-base-content/30"
                                type="text"
                                value={currentContainerWithEverything?.name || ""}
                                placeholder="Container name"
                                onChange={(e) => handleModifyCurrentContainerWithEverything(e.target.value, "name")}
                            />
                        </div>

                        {currentContainerWithEverything?.id !== undefined && (
                            <p className="text-xs text-epfl-perle -mt-2">ID: {currentContainerWithEverything.id}</p>
                        )}

                        {/* isGoingToDisplay toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-epfl-ardoise uppercase tracking-wide">
                                {t("isGoingToDisplay")}
                            </span>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={currentContainerWithEverything?.isGoingToDisplay || false}
                                onChange={(e) => handleModifyCurrentContainerWithEverything(e.target.checked, "isGoingToDisplay")}
                            />
                        </div>

                        <Field label={t("durationDisplay")}>
                            <input
                                className={inputClass}
                                type="number"
                                value={currentContainerWithEverything?.durationDisplay || ""}
                                onChange={(e) => handleModifyCurrentContainerWithEverything(e.target.value, "durationDisplay")}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-2">
                            <Field label={t("gridWidth")}>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={currentContainerWithEverything?.gridWidth || ""}
                                    onChange={(e) => handleModifyCurrentContainerWithEverything(parseInt(e.target.value), "gridWidth")}
                                />
                            </Field>
                            <Field label={t("gridHeight")}>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={currentContainerWithEverything?.gridHeight || ""}
                                    onChange={(e) => handleModifyCurrentContainerWithEverything(parseInt(e.target.value), "gridHeight")}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Box editor card */}
                    <div className="bg-base-100 rounded-xl border border-epfl-perle p-4 flex flex-col gap-3 flex-1">
                        {currentContainer.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <p className="text-sm text-base-content/50">{t("noBoxes")}</p>
                                <button onClick={handleNewBox} className="btn btn-primary btn-sm">
                                    {t("addBox")}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Box toolbar */}
                                <div className="flex items-center gap-1 pb-3 border-b border-epfl-perle/40">
                                    <div className="w-1 h-5 rounded-full bg-accent shrink-0" />
                                    {/* Box selector dropdown */}
                                    <div className="dropdown flex-1">
                                        <label tabIndex={0} className="btn btn-xs btn-ghost border border-epfl-perle gap-1 w-full justify-between">
                                            <span className="text-xs">Box {activeBox}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </label>
                                        <ul tabIndex={0} className="dropdown-content menu p-1 shadow bg-base-100 rounded-xl border border-epfl-perle w-36 max-h-48 overflow-y-auto z-50">
                                            {currentContainer.map((box) => (
                                                <li key={box.id}>
                                                    <button
                                                        className={`w-full text-left rounded-lg px-3 py-1 text-xs ${activeBox === box.id ? "bg-accent/10 text-accent font-medium" : "hover:bg-base-200"}`}
                                                        onClick={() => setActiveBox(box.id)}
                                                    >
                                                        Box {box.id}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button className="btn btn-ghost btn-xs text-epfl-canard" onClick={handleUpdateBox} title={t("apply")}>✓</button>
                                    <button className="btn btn-ghost btn-xs text-primary" onClick={handleNewBox} title={t("add")}>+</button>
                                    <button className="btn btn-ghost btn-xs text-error" onClick={handleDeleteBox} title={t("delete")}>✕</button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {BOX_DIMENSIONS.map(([label, key]) => (
                                            <Field key={key} label={label}>
                                                <input
                                                    value={selectedBox?.[key] || ""}
                                                    onChange={(e) => setSelectedBox({ ...selectedBox, [key]: e.target.value })}
                                                    type="number"
                                                    className={inputClass}
                                                />
                                            </Field>
                                        ))}
                                    </div>

                                    <Field label={t("content")}>
                                        <select
                                            className="select select-bordered select-sm w-full focus:border-primary"
                                            value={selectedBox?.type || ""}
                                            onChange={(e) => setSelectedBox({ ...selectedBox, type: e.target.value })}
                                        >
                                            <option value="">{t("choose")}</option>
                                            {Object.keys(registry).map((key) => (
                                                <option key={key} value={key}>
                                                    {key === "" ? t("emptyTag") : key}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    {selectedBox?.type === "GrafanaPanel" && (
                                        <button
                                            className="btn btn-secondary btn-sm w-full"
                                            onClick={() => setShowDashboardPicker(true)}
                                        >
                                            {t("chooseGrafanaDashboard")}
                                        </button>
                                    )}

                                    {selectedBox?.type === "EpflRestaurants" && (
                                        <Field label={t("chooseRestaurant")}>
                                            <RestaurantSelect
                                                value={selectedBox?.props?.restaurant || ""}
                                                onChange={handleSelectRestaurant}
                                            />
                                        </Field>
                                    )}

                                    {/* Props */}
                                    <div className="divider my-1 text-xs text-epfl-perle">{t("props")}</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-epfl-ardoise">{t("newProps")}</span>
                                        <button
                                            onClick={() => setShowPropModal(true)}
                                            className="btn btn-ghost btn-xs text-primary"
                                            title={t("add")}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {selectedBox?.props && (
                                        <div className="flex flex-col gap-2">
                                            {Object.entries(selectedBox.props).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-2 bg-[#F8F8F8] rounded-lg border border-epfl-perle/40 px-2 py-1">
                                                    <span className="text-xs font-medium text-base-content/60 shrink-0">{key}</span>
                                                    <input
                                                        value={value}
                                                        onChange={(e) => setSelectedBox({ ...selectedBox, props: { ...selectedBox.props, [key]: e.target.value } })}
                                                        className="input input-xs border-0 bg-transparent flex-1 min-w-0 focus:outline-none"
                                                        placeholder="value"
                                                    />
                                                    <button
                                                        className="btn btn-ghost btn-xs text-error shrink-0"
                                                        onClick={() => handleDeleteProps(key)}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right panel — grid */}
                <div className="flex-1 bg-base-100 rounded-xl border border-epfl-perle p-4">
                    <div
                        ref={gridRef}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e)}
                        className="grid gap-2 w-full h-full"
                        style={{
                            gridTemplateColumns: `repeat(${currentContainerWithEverything.gridWidth || 1}, 1fr)`,
                            gridTemplateRows: `repeat(${currentContainerWithEverything.gridHeight || 1}, 1fr)`,
                        }}
                    >
                        {boxe.map((box) => {
                            const isActive = box.id === activeBox;
                            const isHovered = hoveredBoxId === box.id;
                            return (
                                <div
                                    key={box.id}
                                    draggable
                                    tabIndex={0}
                                    id={`box-${box.id}`}
                                    onFocus={() => setActiveBox(box.id)}
                                    onDragStart={() => handleDragStart(box.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, box.id)}
                                    onMouseEnter={() => setHoveredBoxId(box.id)}
                                    onMouseLeave={() => setHoveredBoxId(null)}
                                    className={`relative rounded-2xl flex justify-center items-center font-bold cursor-pointer transition-all duration-150 p-2 border-2 outline-none focus:outline-none focus-visible:outline-none
                                        ${isActive
                                            ? "border-primary bg-primary/5 ring-2 ring-[#FF0000]/20 scale-[1.02]"
                                            : "border-epfl-perle hover:border-epfl-turquoise/60 hover:bg-epfl-turquoise/5"
                                        }`}
                                    style={{
                                        gridColumn: `${Number(box.x)} / span ${Number(box.width)}`,
                                        gridRow: `${Number(box.y)} / span ${Number(box.height)}`,
                                    }}
                                    onClick={() => {
                                        setActiveBox(box.id);
                                        document.getElementById(`box-${box.id}`)?.focus();
                                    }}
                                    onKeyDown={(e) => handleDeleteBoxBackspaceKeyDown(e, box.id)}
                                >
                                    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                                        {box.content}
                                    </div>

                                    {isHovered && (
                                        <>
                                            {/* Width resize buttons — right edge, acier blue */}
                                            <div className="absolute top-1/2 -translate-y-1/2 right-1 flex flex-col gap-1 z-10">
                                                <button
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow font-bold"
                                                    style={{ backgroundColor: "#4F8FCC" }}
                                                    onClick={(e) => { e.stopPropagation(); handleStretchedBox(box.id, true, true); }}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow font-bold"
                                                    style={{ backgroundColor: "#4F8FCC" }}
                                                    onClick={(e) => { e.stopPropagation(); handleStretchedBox(box.id, true, false); }}
                                                >
                                                    −
                                                </button>
                                            </div>

                                            {/* Height resize buttons — bottom edge, turquoise */}
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-row gap-1 z-10">
                                                <button
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow font-bold"
                                                    style={{ backgroundColor: "#00A79F" }}
                                                    onClick={(e) => { e.stopPropagation(); handleStretchedBox(box.id, false, true); }}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow font-bold"
                                                    style={{ backgroundColor: "#00A79F" }}
                                                    onClick={(e) => { e.stopPropagation(); handleStretchedBox(box.id, false, false); }}
                                                >
                                                    −
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* ── Modals ── */}
            <Modal
                open={showPropModal}
                title={t("addPropTitle")}
                onClose={() => { setShowPropModal(false); setNewPropKey(""); setNewPropValue(""); }}
            >
                <div className="flex flex-col gap-3">
                    <Field label={t("propName")}>
                        <input
                            className={inputClass}
                            value={newPropKey}
                            onChange={(e) => setNewPropKey(e.target.value)}
                            placeholder={t("propKeyPlaceholder")}
                        />
                    </Field>
                    <Field label={t("propValue")}>
                        <input
                            className={inputClass}
                            value={newPropValue}
                            onChange={(e) => setNewPropValue(e.target.value)}
                            placeholder={t("propValuePlaceholder")}
                        />
                    </Field>
                    <button
                        className="btn btn-primary btn-sm mt-1"
                        onClick={() => { handleNewProp(); setShowPropModal(false); setNewPropKey(""); setNewPropValue(""); }}
                    >
                        {t("add")}
                    </button>
                </div>
            </Modal>

            <Modal
                open={showNotEnoughSpaceForNewBoxModal}
                title={t("notEnoughSpace")}
                onClose={() => setShowNotEnoughSpaceForNewBoxModal(false)}
            >
                <p className="text-sm text-base-content/70">{t("notEnoughSpace")}</p>
            </Modal>

            <Modal
                open={showDashboardPicker}
                title={t("chooseGrafanaDashboard")}
                onClose={() => setShowDashboardPicker(false)}
            >
                <GrafanaPicker onSelect={handleSelectDashboard} />
            </Modal>

            {/* Save rejected: the config changed since it was loaded */}
            <Modal
                open={showConflictModal}
                title={t("conflictTitle")}
                onClose={() => setShowConflictModal(false)}
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-base-content/70">{t("conflictBody")}</p>
                    <button
                        className="btn btn-primary btn-sm self-end"
                        onClick={() => { setShowConflictModal(false); handleLoad(); }}
                    >
                        {t("reload")}
                    </button>
                </div>
            </Modal>

            {/* Transient "saved" confirmation — top-center, auto-dismisses */}
            {showSavedToast && (
                <div className="toast toast-top toast-center z-[100]">
                    <div className="alert alert-success shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t("saved")}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

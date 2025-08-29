// src/components/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

import {
  FiSearch,
  FiCopy,
  FiTrash2,
  FiRefreshCcw,
  FiPlus,
  FiMaximize2,
  FiX,
  FiDownload,
} from "react-icons/fi";
import { IoTimeOutline } from "react-icons/io5";

import "./Dashboard.css";

const REFILL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

function toDateMaybe(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function formatDateShort(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Auth state
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);

  // User doc state
  const [plan, setPlan] = useState(null);
  const [credits, setCredits] = useState(null);
  const [creditDepletedAt, setCreditDepletedAt] = useState(null);

  // Refill countdown
  const [countdownMs, setCountdownMs] = useState(0);
  const tickRef = useRef(null);

  // Scripts state (realtime)
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const [subKey, setSubKey] = useState(0); // manual refresh

  // Filters
  const [search, setSearch] = useState("");

  // Modal (full view)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewScript, setViewScript] = useState(null);

  // ===== AUTH: determine user once, then mark ready =====
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });
    return () => off();
  }, []);

  // Redirect only after auth is known
  useEffect(() => {
    if (authReady && !user) navigate("/signup", { replace: true });
  }, [authReady, user, navigate]);

  // ===== USER DOC subscription (plan/credits) =====
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const off = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      const p =
        data.subscriptionPlan && ["Basic", "Pro", "Premium"].includes(data.subscriptionPlan)
          ? data.subscriptionPlan
          : null;
      setPlan(p);
      setCredits(typeof data.credits === "number" ? data.credits : null);
      setCreditDepletedAt(toDateMaybe(data.creditDepletedAt));
    });
    return () => off();
  }, [user?.uid]);

  // ===== REFILL COUNTDOWN =====
  useEffect(() => {
    if (!(credits === 0 && creditDepletedAt instanceof Date)) {
      setCountdownMs(0);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    const nextRefill = new Date(creditDepletedAt.getTime() + REFILL_WINDOW_MS);
    const tick = () => setCountdownMs(Math.max(0, nextRefill.getTime() - Date.now()));
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [credits, creditDepletedAt]);

  // ===== SCRIPTS subscription (realtime) =====
  useEffect(() => {
    if (!user) return;
    setScriptsLoading(true);
    const ref = collection(db, "users", user.uid, "scripts");
    const q = query(ref, orderBy("createdAt", "desc"));
    const off = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setScripts(rows);
        setScriptsLoading(false);
      },
      () => setScriptsLoading(false)
    );
    return () => off();
  }, [user?.uid, subKey]);

  // Derived
  const filteredScripts = useMemo(() => {
    if (!search.trim()) return scripts;
    const q = search.toLowerCase();
    return scripts.filter((s) => {
      const text = (s.text || "").toLowerCase();
      const meta = [s.niche, s.subCategory, s.followerCount, s.tone, s.moreSpecific]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q) || meta.includes(q);
    });
  }, [scripts, search]);

  const totalCount = scripts.length;
  const showingCount = filteredScripts.length;

  // Actions
  const toast = (msg) => {
    const el = document.createElement("div");
    el.className = "dash-toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, 1200);
  };
  const handleCopy = (txt) =>
    navigator.clipboard.writeText(String(txt || "")).then(() => toast("Copied ✔"));
  const handleDelete = async (id) => {
    if (!user) return;
    if (!window.confirm("Delete this script permanently?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "scripts", id));
      if (viewOpen && viewScript?.id === id) {
        setViewOpen(false);
        setViewScript(null);
      }
    } catch (e) {
      alert("Failed to delete. Please try again.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };
  const downloadText = (filename, content) => {
    const blob = new Blob([String(content || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "script.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const refreshScripts = () => setSubKey((k) => k + 1);

  // Modal helpers
  const openView = (script) => {
    setViewScript(script);
    setViewOpen(true);
  };
  const closeView = () => {
    setViewOpen(false);
    setViewScript(null);
  };

  const planHue = plan === "Premium" ? "cyan" : plan === "Pro" ? "violet" : "slate";
  const showCountdown = credits === 0 && countdownMs > 0;

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash__header">
        <div className="dash__hello">
          <h1 className="dash__title">
            {user ? `Hey, ${user.displayName || user.email || "there"} 👋` : "Dashboard"}
          </h1>
          <p className="dash__subtitle">Manage your plan and see every script you generated.</p>
        </div>

        <div className="dash__headActions">
          <button className="btn btn--ghost" onClick={refreshScripts} disabled={scriptsLoading}>
            <FiRefreshCcw />
            <span>Refresh</span>
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/target")}>
            <FiPlus />
            <span>New script</span>
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="dash__kpis">
        <article className={`kpi kpi--${planHue}`} role="status" aria-live="polite">
          <div className="kpi__label">Subscription</div>
          <div className="kpi__value">{plan || "—"}</div>
          <button className="kpi__cta" onClick={() => navigate("/plans")}>Manage</button>
        </article>

        <article className="kpi kpi--credits" role="status" aria-live="polite">
          <div className="kpi__label">Credits</div>
          <div className="kpi__value">{credits ?? "…"}</div>
          <div className="kpi__sub">
            {showCountdown ? (
              <span className={`refill-chip ${countdownMs < 3600_000 ? "refill-chip--soon" : ""}`}>
                <IoTimeOutline />
                <span>Refills in {formatCountdown(countdownMs)}</span>
              </span>
            ) : (
              <span className="kpi__muted">Auto-refills when balance hits 0</span>
            )}
          </div>
        </article>

        <article className="kpi kpi--quick">
          <div className="kpi__label">Quick actions</div>
          <div className="kpi__quickRow">
            <button className="pill" onClick={() => navigate("/target")}>Generate</button>
            <button className="pill" onClick={() => navigate("/plans")}>Upgrade</button>
          </div>
        </article>
      </section>

      {/* Search + Count */}
      <section className="dash__searchRow">
        <div className="search">
          <FiSearch className="search__icon" />
          <input
            className="search__input"
            type="text"
            placeholder="Search your scripts (content or tags)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dash__count" aria-live="polite">
          <span className="count-pill">{showingCount}</span>
          <span className="count-text">of {totalCount} scripts</span>
        </div>
      </section>

      {/* Scripts */}
      <section className="dash__scripts">
        {scriptsLoading ? (
          <div className="dash__loading">Loading…</div>
        ) : filteredScripts.length === 0 ? (
          <div className="dash__empty">
            <p>No scripts yet.</p>
            <button className="btn btn--primary" onClick={() => navigate("/target")}>
              <FiPlus />
              <span>Generate your first</span>
            </button>
          </div>
        ) : (
          <div className="grid">
            {filteredScripts.map((s) => {
              const created = toDateMaybe(s.createdAt) || null;
              return (
                <article key={s.id} className="card">
                  <header className="card__head">
                    <div className="card__date">{created ? formatDateShort(created) : "—"}</div>
                    <div className="card__tags">
                      {s.niche && <span className="tag">{s.niche}</span>}
                      {s.subCategory && <span className="tag tag--muted">{s.subCategory}</span>}
                      {s.tone && <span className="tag tag--tone">{s.tone}</span>}
                    </div>
                  </header>

                  <button className="card__body" onClick={() => openView(s)} title="View full">
                    <div className="card__preview">
                      <ReactMarkdown>{String(s.text || "").slice(0, 1200)}</ReactMarkdown>
                    </div>
                    <div className="card__fade" aria-hidden="true" />
                  </button>

                  <footer className="card__foot">
                    <button className="tool" onClick={() => handleCopy(s.text)} title="Copy">
                      <FiCopy />
                      <span>Copy</span>
                    </button>
                    <button className="tool" onClick={() => openView(s)} title="View full">
                      <FiMaximize2 />
                      <span>View</span>
                    </button>
                    <button className="tool tool--danger" onClick={() => handleDelete(s.id)} title="Delete">
                      <FiTrash2 />
                      <span>Delete</span>
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Full-view modal */}
      {viewOpen && viewScript && (
        <div
          className="dash-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dash-modal-title"
          onMouseDown={(e) => {
            if (e.target.classList.contains("dash-modal")) closeView();
          }}
        >
          <div className="dash-modal__dialog">
            <header className="dash-modal__head">
              <h2 id="dash-modal-title" className="dash-modal__title">Full script</h2>

              <div className="dash-modal__meta">
                {viewScript.niche && <span className="tag">{viewScript.niche}</span>}
                {viewScript.subCategory && <span className="tag tag--muted">{viewScript.subCategory}</span>}
                {viewScript.tone && <span className="tag tag--tone">{viewScript.tone}</span>}
                {viewScript.createdAt && (
                  <span className="tag tag--date">
                    {formatDateShort(toDateMaybe(viewScript.createdAt))}
                  </span>
                )}
              </div>

              <button className="icon-btn" onClick={closeView} aria-label="Close">
                <FiX />
              </button>
            </header>

            <div className="dash-modal__body">
              <ReactMarkdown>{String(viewScript.text || "")}</ReactMarkdown>
            </div>

            <footer className="dash-modal__foot">
              <button className="btn btn--ghost" onClick={() => handleCopy(viewScript.text)}>
                <FiCopy />
                <span>Copy</span>
              </button>
              <button
                className="btn btn--ghost"
                onClick={() =>
                  downloadText(`script-${viewScript.id || "export"}.txt`, viewScript.text || "")
                }
              >
                <FiDownload />
                <span>Download</span>
              </button>

              <div className="spacer" />

              <button className="btn btn--primary" onClick={closeView}>
                <FiX />
                <span>Close</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

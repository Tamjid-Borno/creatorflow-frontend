// src/components/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  collection,
  query,
  orderBy,
  limit as qLimit,
  startAfter,
  getDocs,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

import { FiSearch, FiCopy, FiTrash2, FiRefreshCcw, FiPlus } from "react-icons/fi";
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

  // auth + user doc
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [credits, setCredits] = useState(null);
  const [creditDepletedAt, setCreditDepletedAt] = useState(null);

  // refill ticker
  const [countdownMs, setCountdownMs] = useState(0);
  const tickRef = useRef(null);

  // scripts pagination
  const PAGE_SIZE = 12;
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDocSnap, setLastDocSnap] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // local filters
  const [search, setSearch] = useState("");

  // ===== AUTH + USER DOC =====
  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        navigate("/signup", { replace: true });
        return;
      }
      setUser(u);

      // live user doc
      const userRef = doc(db, "users", u.uid);
      const offSnap = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        setPlan(
          data.subscriptionPlan && ["Basic", "Pro", "Premium"].includes(data.subscriptionPlan)
            ? data.subscriptionPlan
            : null
        );
        setCredits(typeof data.credits === "number" ? data.credits : null);
        setCreditDepletedAt(toDateMaybe(data.creditDepletedAt));
      });
      return offSnap;
    });
    return () => offAuth();
  }, [navigate]);

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

  // ===== LOAD SCRIPTS (PAGINATED) =====
  const loadInitial = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, "users", user.uid, "scripts");
      const q = query(ref, orderBy("createdAt", "desc"), qLimit(PAGE_SIZE));
      const snap = await getDocs(q);

      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      setScripts(rows);
      setHasMore(snap.size === PAGE_SIZE);
      setLastDocSnap(snap.docs[snap.docs.length - 1] || null);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!user || !hasMore || !lastDocSnap) return;
    setLoading(true);
    try {
      const ref = collection(db, "users", user.uid, "scripts");
      const q = query(ref, orderBy("createdAt", "desc"), startAfter(lastDocSnap), qLimit(PAGE_SIZE));
      const snap = await getDocs(q);
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      setScripts((prev) => [...prev, ...rows]);
      setHasMore(snap.size === PAGE_SIZE);
      setLastDocSnap(snap.docs[snap.docs.length - 1] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch on first user load
    if (user) loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const filteredScripts = useMemo(() => {
    if (!search.trim()) return scripts;
    const q = search.toLowerCase();
    return scripts.filter((s) => {
      const text = (s.text || "").toLowerCase();
      const meta =
        [s.niche, s.subCategory, s.followerCount, s.tone, s.moreSpecific].filter(Boolean).join(" ").toLowerCase();
      return text.includes(q) || meta.includes(q);
    });
  }, [scripts, search]);

  // ===== ACTIONS =====
  const handleCopy = (txt) => {
    navigator.clipboard
      .writeText(String(txt || ""))
      .then(() => {
        // small toast
        const el = document.createElement("div");
        el.className = "dash-toast";
        el.textContent = "Copied ✔";
        document.body.appendChild(el);
        setTimeout(() => el.classList.add("show"));
        setTimeout(() => {
          el.classList.remove("show");
          setTimeout(() => el.remove(), 250);
        }, 1200);
      })
      .catch(() => {});
  };

  const handleDelete = async (id) => {
    if (!user) return;
    const ok = window.confirm("Delete this script permanently?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "scripts", id));
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert("Failed to delete. Please try again.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const planHue =
    plan === "Premium" ? "cyan"
    : plan === "Pro" ? "violet"
    : "slate";

  const showCountdown = credits === 0 && countdownMs > 0;

  return (
    <div className="dash">
      {/* Top heading */}
      <header className="dash__header">
        <div className="dash__hello">
          <h1 className="dash__title">
            {user ? `Hey, ${user.displayName || user.email || "there"} 👋` : "Dashboard"}
          </h1>
          <p className="dash__subtitle">Manage your plan and see every script you generated.</p>
        </div>

        <div className="dash__headActions">
          <button className="btn btn--ghost" onClick={loadInitial} disabled={loading} title="Refresh">
            <FiRefreshCcw />
            <span>Refresh</span>
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/target")}>
            <FiPlus />
            <span>New script</span>
          </button>
        </div>
      </header>

      {/* KPI / Summary cards */}
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
              <span className="kpi__muted">Only auto-refills when balance hits 0</span>
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

      {/* Search */}
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
      </section>

      {/* Scripts list */}
      <section className="dash__scripts">
        {loading && scripts.length === 0 ? (
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

                  <div className="card__body">
                    {/* clamp preview to keep grid tidy */}
                    <div className="card__preview">
                      <ReactMarkdown>{String(s.text || "").slice(0, 800)}</ReactMarkdown>
                    </div>
                  </div>

                  <footer className="card__foot">
                    <button className="tool" onClick={() => handleCopy(s.text)} title="Copy">
                      <FiCopy />
                      <span>Copy</span>
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

        {/* Pagination */}
        {hasMore && filteredScripts.length === scripts.length && scripts.length > 0 && (
          <div className="dash__more">
            <button className="btn btn--ghost" onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

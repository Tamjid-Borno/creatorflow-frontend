// src/components/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiRefreshCcw,
  FiPlus,
  FiCopy,
  FiDownload,
  FiX,
  FiTag,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  updateDoc,
  increment,
} from "firebase/firestore";

import "./Dashboard.css";

const PAGE_SIZE = 12;
const REFILL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

// Plans that actually auto-refill when credits hit 0.
const AUTO_REFILL_PLANS = new Set(["Pro", "Premium"]);

function formatDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // auth / user basics
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [credits, setCredits] = useState(null);
  const [depletedAt, setDepletedAt] = useState(null);
  const [countdownMs, setCountdownMs] = useState(0);

  // scripts
  const [scripts, setScripts] = useState([]);
  const [totalScripts, setTotalScripts] = useState(0);
  const lastDocRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // search & UI
  const [queryText, setQueryText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [toast, setToast] = useState("");

  // Derived: does current plan auto-refill?
  const hasAutoRefill = useMemo(() => AUTO_REFILL_PLANS.has(plan), [plan]);

  // ───────────────────────────────────────────
  // Auth + User doc
  // ───────────────────────────────────────────
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (!u) return;

      const uref = doc(db, "users", u.uid);
      const snap = await getDoc(uref);
      if (snap.exists()) {
        const d = snap.data() || {};
        setPlan(
          d.subscriptionPlan &&
            ["Basic", "Pro", "Premium"].includes(d.subscriptionPlan)
            ? d.subscriptionPlan
            : "Pro"
        );
        setCredits(typeof d.credits === "number" ? d.credits : 0);
        // Only keep/observe depletedAt if it exists; refilling is gated below by hasAutoRefill.
        setDepletedAt(d.creditDepletedAt || null);
      } else {
        setPlan("Pro");
        setCredits(0);
        setDepletedAt(null);
      }
    });
    return off;
  }, []);

  // Refill countdown (only for plans that auto-refill)
  useEffect(() => {
    if (!(hasAutoRefill && credits === 0 && depletedAt)) {
      setCountdownMs(0);
      return;
    }
    const baseTime =
      (depletedAt?.toDate ? depletedAt.toDate() : depletedAt)?.getTime?.() ??
      new Date(depletedAt).getTime();
    const nextRefillAt = new Date(baseTime + REFILL_WINDOW_MS);

    const tick = () => {
      setCountdownMs(Math.max(0, nextRefillAt.getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [credits, depletedAt, hasAutoRefill]);

  // ───────────────────────────────────────────
  // Scripts (live first page) + count
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const base = collection(db, "users", user.uid, "scripts");

    // total count (server aggregate)
    getCountFromServer(query(base))
      .then((snap) => setTotalScripts(snap.data().count || 0))
      .catch(() => setTotalScripts(0));

    // live first page
    const q1 = query(base, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(
      q1,
      (snap) => {
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        setScripts(docs);
        lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [user]);

  // load more
  const handleLoadMore = async () => {
    if (!user || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const base = collection(db, "users", user.uid, "scripts");
      const q2 = query(
        base,
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q2);
      const more = [];
      snap.forEach((d) => more.push({ id: d.id, ...d.data() }));
      setScripts((prev) => [...prev, ...more]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
    } finally {
      setLoadingMore(false);
    }
  };

  // simple client search across text + tags
  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => {
      const hay =
        `${s.text || ""} ${s.niche || ""} ${s.subCategory || ""} ${
          s.followerCount || ""
        } ${s.tone || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [scripts, queryText]);

  const openScript = (s) => {
    setActive(s);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  // copy + tiny toast
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setToast("Copied!");
      setTimeout(() => setToast(""), 1400);
    } catch {
      setToast("Copy failed");
      setTimeout(() => setToast(""), 1400);
    }
  };

  const downloadTxt = (s) => {
    const blob = new Blob([s.text || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${s.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // OPTIONAL: Ad-reward CTA handler (placeholder).
  // Wire this to your ad SDK success callback and enforce daily caps on backend.
  async function handleEarnCredits() {
    if (!user) return;
    try {
      const uref = doc(db, "users", user.uid);
      await updateDoc(uref, {
        credits: increment(20),
        // Clearing any old depletedAt prevents stray countdowns.
        creditDepletedAt: null,
      });
      setCredits((c) => (typeof c === "number" ? c + 20 : 20));
      setDepletedAt(null);
      setToast("+20 credits added");
      setTimeout(() => setToast(""), 1400);
    } catch (e) {
      setToast("Couldn’t add credits");
      setTimeout(() => setToast(""), 1400);
    }
  }

  if (!user) {
    return (
      <div className="dash">
        <header className="dash__header">
          <div>
            <h1 className="dash__title">
              Dashboard <span role="img" aria-label="sparkles">✨</span>
            </h1>
            <p className="dash__subtitle">Please sign in to view your scripts.</p>
          </div>
          <div className="dash__headActions">
            <button className="btn btn--primary" onClick={() => navigate("/signup")}>
              Sign up
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash__header">
        <div>
          <h1 className="dash__title">
            Hey, {user.displayName || user.email}{" "}
            <span role="img" aria-label="sparkles">✨</span>
          </h1>
          <p className="dash__subtitle">
            Manage your plan and see every script you generated.
          </p>
        </div>
        <div className="dash__headActions">
          <button className="btn btn--ghost" onClick={() => window.location.reload()}>
            <FiRefreshCcw /> Refresh
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/target")}>
            <FiPlus /> New script
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="dash__kpis">
        <article className="kpi kpi--slate">
          <div className="kpi__label">Subscription</div>
          <div className="kpi__value">{plan || "—"}</div>
          <div className="kpi__sub">
            <button className="kpi__cta" onClick={() => navigate("/plans")}>
              Manage
            </button>
          </div>
        </article>

        <article className="kpi kpi--credits">
          <div className="kpi__label">Credits</div>
          <div className="kpi__value">{credits ?? "—"}</div>

          {/* When 0 credits */}
          {credits === 0 && (
            <div className="kpi__sub">
              {hasAutoRefill && depletedAt ? (
                <span
                  className={`refill-chip ${
                    countdownMs < 3600_000 ? "refill-chip--soon" : ""
                  }`}
                >
                  Refills in {formatCountdown(countdownMs)}
                </span>
              ) : (
                <>
                  <span className="kpi__muted">
                    {plan === "Basic" ? "No auto-refill on Basic." : "Refill not scheduled."}
                  </span>
                  {/* OPTIONAL: ad-reward CTA */}
                  <div className="kpi__quickRow" style={{ marginTop: 8 }}>
                    <button className="pill" onClick={handleEarnCredits}>
                      Earn +20
                    </button>
                    <button className="pill" onClick={() => navigate("/plans")}>
                      Upgrade
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* When > 0 credits */}
          {credits > 0 && (
            <div className="kpi__sub">
              {hasAutoRefill ? "Auto-refills when balance hits 0" : "No auto-refill on Basic"}
            </div>
          )}
        </article>

        <article className="kpi kpi--quick">
          <div className="kpi__label">Quick actions</div>
          <div className="kpi__quickRow">
            <button className="pill" onClick={() => navigate("/target")}>Generate</button>
            <button className="pill" onClick={() => navigate("/plans")}>Upgrade</button>
          </div>
        </article>
      </section>

      {/* Search row with count */}
      <section className="dash__searchRow">
        <div className="search">
          <FiSearch className="search__icon" />
          <input
            className="search__input"
            placeholder="Search your scripts (content or tags)…"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
        </div>

        <div className="dash__count">
          <span className="count-pill">{filtered.length}</span>
          <span className="count-text">of {totalScripts} scripts</span>
        </div>
      </section>

      {/* Grid */}
      {loading ? (
        <div className="dash__loading">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="dash__empty">No scripts yet. Generate your first one!</div>
      ) : (
        <section className="grid">
          {filtered.map((s) => (
            <article className="card" key={s.id}>
              <header className="card__head">
                <span className="card__date">
                  <FiCalendar /> {formatDate(s.createdAt)}
                </span>
                <div className="card__tags">
                  {s.niche && (
                    <span className="tag">
                      <FiTag /> {s.niche}
                    </span>
                  )}
                  {s.subCategory && (
                    <span className="tag tag--muted">
                      <FiTag /> {s.subCategory}
                    </span>
                  )}
                  {s.tone && (
                    <span className="tag tag--tone">
                      <FiUser /> {s.tone}
                    </span>
                  )}
                </div>
              </header>

              <button className="card__body" onClick={() => openScript(s)}>
                <div className="card__preview">
                  {s.text || ""}
                  <div className="card__fade" />
                </div>
              </button>

              <footer className="card__foot">
                <button className="tool" onClick={() => copyText(s.text || "")}>
                  <FiCopy /> Copy
                </button>
                <button className="tool" onClick={() => downloadTxt(s)}>
                  <FiDownload /> Download
                </button>
              </footer>
            </article>
          ))}
        </section>
      )}

      {/* Load more */}
      {!loading && lastDocRef.current && (
        <div className="dash__more">
          <button className="btn btn--ghost" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* Full-view modal */}
      {modalOpen && active && (
        <div className="dash-modal" role="dialog" aria-modal="true" aria-label="Script">
          <div className="dash-modal__dialog">
            <header className="dash-modal__head">
              <h3 className="dash-modal__title">Script</h3>
              <div className="dash-modal__meta">
                <span className="tag tag--date">
                  <FiCalendar /> {formatDate(active.createdAt)}
                </span>
                {active.niche && (
                  <span className="tag">
                    <FiTag /> {active.niche}
                  </span>
                )}
                {active.subCategory && (
                  <span className="tag tag--muted">
                    <FiTag /> {active.subCategory}
                  </span>
                )}
                {active.tone && (
                  <span className="tag tag--tone">
                    <FiUser /> {active.tone}
                  </span>
                )}
              </div>
              <button className="icon-btn" onClick={closeModal} aria-label="Close">
                <FiX />
              </button>
            </header>

            <div className="dash-modal__body">
              <pre>{active.text || ""}</pre>
            </div>

            <footer className="dash-modal__foot">
              <div className="spacer" />
              <button className="btn btn--ghost" onClick={() => copyText(active.text || "")}>
                <FiCopy /> Copy
              </button>
              <button className="btn btn--primary" onClick={() => downloadTxt(active)}>
                <FiDownload /> Download
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* tiny toast */}
      <div className={`dash-toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

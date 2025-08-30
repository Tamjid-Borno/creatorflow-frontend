// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './Navbar.css';
import { IonIcon } from '@ionic/react';
import {
  personOutline,
  menuOutline,
  closeOutline,
  logOutOutline,
  timeOutline, // ⏱ icon for countdown
  gridOutline, // dashboard icon
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../../src/logo.png';

const PLAN_CREDITS = { Basic: 50, Pro: 200, Premium: 1000 };
const REFILL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const AUTO_REFILL_PLANS = new Set(['Pro', 'Premium']);

function toDateMaybe(v) {
  if (!v) return null;
  if (typeof v?.toDate === 'function') return v.toDate();
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Firestore source of truth
  const [plan, setPlan] = useState(null);
  const [credits, setCredits] = useState(null);

  // refill countdown
  const [depletedAt, setDepletedAt] = useState(null);
  const [countdownMs, setCountdownMs] = useState(0);
  const tickRef = useRef(null);

  const hasAutoRefill = useMemo(() => AUTO_REFILL_PLANS.has(plan), [plan]);
  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────
  // Auth state + load plan/credits/depletedAt from Firestore
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);

      if (!currentUser) {
        setPlan(null);
        setCredits(null);
        setDepletedAt(null);
        setCountdownMs(0);
        return;
      }

      try {
        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() || {};
          const p =
            data.subscriptionPlan && ['Basic', 'Pro', 'Premium'].includes(data.subscriptionPlan)
              ? data.subscriptionPlan
              : null;

          setPlan(p);
          setCredits(
            typeof data.credits === 'number'
              ? data.credits
              : p
              ? PLAN_CREDITS[p]
              : null
          );
          setDepletedAt(toDateMaybe(data.creditDepletedAt));
        } else {
          setPlan(null);
          setCredits(null);
          setDepletedAt(null);
        }
      } catch {
        setPlan(null);
        setCredits(null);
        setDepletedAt(null);
      }
    });
    return unsub;
  }, []);

  // ───────────────────────────────────────────────────────────
  // Refill countdown ticker (only when plan supports auto-refill)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const shouldRun = hasAutoRefill && credits === 0 && depletedAt instanceof Date;
    if (!shouldRun) {
      setCountdownMs(0);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    const nextRefillAt = new Date(depletedAt.getTime() + REFILL_WINDOW_MS);
    const compute = () => setCountdownMs(Math.max(0, nextRefillAt.getTime() - Date.now()));
    compute();
    tickRef.current = setInterval(compute, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [credits, depletedAt, hasAutoRefill]);

  // navbar scroll styling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile drawer on resize (prevents stale open)
  useEffect(() => {
    const onResize = () => setMenuOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu  = useCallback(() => setMenuOpen(false), []);
  const go = (path, opts) => { closeMenu(); navigate(path, opts); };

  const handleLogoutClick = async () => {
    try {
      // clear any legacy hints (defensive)
      try {
        localStorage.removeItem('cf_selected_plan');
        localStorage.removeItem('cf_selected_plan_confirmed');
        localStorage.removeItem('cf_pending_plan');
        localStorage.removeItem('cf_plan_owner_uid');
      } catch {}
      await signOut(auth);
      closeMenu();
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // Small helper to get a round avatar with initials
  const InitialAvatar = ({ nameOrEmail }) => {
    const ch = (nameOrEmail || '').trim()[0]?.toUpperCase() || 'U';
    return <div className="avatar-circle" aria-hidden="true">{ch}</div>;
  };

  /** Plan chip
   *  context: "bar" (top navbar) | "drawer" (mobile drawer)
   */
  const PlanChip = ({ inline = false, context = 'bar' }) => {
    const hasPlanOrCredits = plan || typeof credits === 'number';
    if (!hasPlanOrCredits) return null;

    const planClass = plan ? `plan-${String(plan).toLowerCase()}` : 'plan-pro';
    const crTxt =
      typeof credits === 'number'
        ? `${credits} cr`
        : plan
        ? `${PLAN_CREDITS[plan]} cr`
        : '';

    const showCountdown = hasAutoRefill && credits === 0 && countdownMs > 0;
    const cdText = formatCountdown(countdownMs);

    if (context === 'drawer') {
      // Drawer: stack plan & refill neatly (no awkward line wrap)
      return (
        <div className="plan-stack">
          <span
            className={`plan-chip ${planClass} plan-full ${inline ? 'plan-inline' : ''}`}
            title={`${plan ? `${plan} plan` : 'Plan'} · ${crTxt}`}
            onClick={() => go('/plans', { state: { revisiting: true } })}
          >
            <span className="plan-dot" aria-hidden />
            <strong className="plan-name">{plan || 'Plan'}</strong>
            <span className="sep">•</span>
            <span className="cr">{crTxt}</span>
          </span>

          {showCountdown && (
            <span
              className={`refill-badge refill-full ${countdownMs < 3600_000 ? 'refill-soon' : ''}`}
              title="Auto-refill in 24h from depletion"
            >
              <IonIcon icon={timeOutline} aria-hidden="true" />
              <span className="refill-text" style={{ whiteSpace: 'nowrap' }}>
                Refills in {cdText}
              </span>
            </span>
          )}
        </div>
      );
    }

    // Top bar version
    return (
      <span
        className={`plan-chip ${planClass} ${inline ? 'plan-inline' : ''}`}
        title={`${plan ? `${plan} plan` : 'Plan'} · ${crTxt}`}
        onClick={() => go('/plans', { state: { revisiting: true } })}
      >
        <span className="plan-dot" aria-hidden />
        <strong className="plan-name">{plan || 'Plan'}</strong>
        <span className="sep">•</span>
        <span className="cr">{crTxt}</span>

        {showCountdown && (
          <span
            className={`refill-badge ${countdownMs < 3600_000 ? 'refill-soon' : ''}`}
            title="Auto-refill in 24h from depletion"
          >
            <IonIcon icon={timeOutline} aria-hidden="true" />
            <span className="refill-text" style={{ whiteSpace: 'nowrap' }}>
              Refills in {cdText}
            </span>
          </span>
        )}
      </span>
    );
  };

  // Primary nav links (desktop)
  const PrimaryLinks = () => (
    <nav className="primary-links" aria-label="Primary">
      <button className="nav-link" onClick={() => go('/plans')}>Get credits</button>
      <button className="nav-link" onClick={() => go('/about')}>About</button>
      <button className="nav-link" onClick={() => go('/terms')}>Terms &amp; Conditions</button>
      <button className="nav-link" onClick={() => go('/privacy')}>Privacy Policy</button>
      <button className="nav-link" onClick={() => go('/contact')}>Contact</button>
    </nav>
  );

  return (
    <>
      {menuOpen && <div className="nav-backdrop" onClick={closeMenu} aria-hidden="true" />}

      <nav className={`custom-navbar ${scrolled ? 'is-scrolled' : ''}`} role="navigation" aria-label="Main">
        {/* Left: Logo + Mobile brand text */}
        <button className="navbar-logo" onClick={() => go('/')} aria-label="CreatorFlow home">
          <img src={logo} alt="CreatorFlow logo" className="logo-img" draggable="false" />
          <span className="navbar-brand-text">CreatorFlow</span>
        </button>

        {/* Center (desktop only) */}
        <PrimaryLinks />

        {/* Right cluster (desktop) */}
        <div className="auth-desktop">
          <PlanChip inline context="bar" />

          {user ? (
            <>
              {/* Explicit Dashboard button for discoverability */}
              <button
                className="btn btn-primary"
                onClick={() => go('/dashboard')}
                title="Open Dashboard"
                aria-label="Open Dashboard"
              >
                <IonIcon icon={gridOutline} aria-hidden="true" />
                <span>My Dashboard</span>
              </button>

              {/* Username also routes to Dashboard */}
              <button
                className="nav-link user-displayname"
                onClick={() => go('/dashboard')}
                title="Open Dashboard"
              >
                <IonIcon icon={personOutline} aria-hidden="true" />
                <span className="user-text">{user.displayName || user.email}</span>
              </button>

              <button className="btn btn-danger" onClick={handleLogoutClick}>
                <IonIcon icon={logOutOutline} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => go('/signup')}>
              <IonIcon icon={personOutline} aria-hidden="true" />
              <span>Sign Up</span>
            </button>
          )}
        </div>

        {/* Hamburger (ALWAYS last child so it sits on the far right on mobile) */}
        <button
          className="hamburger"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={menuOpen ? 'true' : 'false'}
          aria-controls="mobile-drawer"
        >
          <IonIcon icon={menuOpen ? closeOutline : menuOutline} />
        </button>

        {/* Mobile drawer */}
        <aside
          id="mobile-drawer"
          className={`mobile-drawer ${menuOpen ? 'open' : ''}`}
          aria-hidden={menuOpen ? 'false' : 'true'}
        >
          {/* Drawer header — centered & pretty */}
          <div className="drawer-card drawer-header">
            <InitialAvatar nameOrEmail={user?.displayName || user?.email} />
            <div className="drawer-identity">
              <div className="drawer-name">{user ? (user.displayName || user.email) : 'Guest'}</div>
              {user && <div className="drawer-sub">Signed in</div>}
              {!user && <div className="drawer-sub">Welcome to CreatorFlow</div>}
            </div>

            {/* Big obvious Dashboard button (discoverable) */}
            {user ? (
              <button
                className="btn btn-primary btn-block drawer-cta"
                onClick={() => go('/dashboard')}
                aria-label="Go to Dashboard"
                title="Go to Dashboard"
              >
                <IonIcon icon={gridOutline} aria-hidden="true" />
                <span>My Dashboard</span>
              </button>
            ) : (
              <button
                className="btn btn-primary btn-block drawer-cta"
                onClick={() => go('/signup')}
              >
                <IonIcon icon={personOutline} aria-hidden="true" />
                <span>Create account</span>
              </button>
            )}
          </div>

          {/* Plan / credits card */}
          <div className="drawer-card">
            <div className="drawer-plan-row">
              <PlanChip context="drawer" />
            </div>
            <div className="drawer-sep" aria-hidden="true" />
            <div className="drawer-actions">
              <button className="nav-link nav-link--block" onClick={() => go('/plans')}>Get credits</button>
              <button className="nav-link nav-link--block" onClick={() => go('/plans')}>Manage plan</button>
            </div>
          </div>

          {/* Links card */}
          <div className="drawer-card">
            <div className="drawer-links">
              <button className="nav-link nav-link--block" onClick={() => go('/about')}>About</button>
              <button className="nav-link nav-link--block" onClick={() => go('/terms')}>Terms &amp; Conditions</button>
              <button className="nav-link nav-link--block" onClick={() => go('/privacy')}>Privacy Policy</button>
              <button className="nav-link nav-link--block" onClick={() => go('/contact')}>Contact</button>
            </div>
          </div>

          {/* Logout card */}
          <div className="drawer-card drawer-bottom-pad">
            {user ? (
              <button className="btn btn-danger btn-block" onClick={handleLogoutClick}>
                <IonIcon icon={logOutOutline} aria-hidden="true" />
                <span>Logout</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => go('/signup')}>
                <IonIcon icon={personOutline} aria-hidden="true" />
                <span>Sign Up</span>
              </button>
            )}
          </div>
        </aside>
      </nav>
    </>
  );
};

export default Navbar;

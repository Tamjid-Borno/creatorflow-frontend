import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Navbar.css';
import { IonIcon } from '@ionic/react';
import {
  personOutline,
  menuOutline,
  closeOutline,
  logOutOutline,
  timeOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../../src/logo.png';

const PLAN_CREDITS = { Basic: 50, Pro: 200, Premium: 1000 };
const REFILL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

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

  const navigate = useNavigate();

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

  useEffect(() => {
    if (!(credits === 0 && depletedAt instanceof Date)) {
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
  }, [credits, depletedAt]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const PlanChip = ({ inline = false }) => {
    const hasPlanOrCredits = plan || typeof credits === 'number';
    if (!hasPlanOrCredits) return null;

    const planClass = plan ? `plan-${String(plan).toLowerCase()}` : 'plan-pro';
    const crTxt =
      typeof credits === 'number'
        ? `${credits} cr`
        : plan
        ? `${PLAN_CREDITS[plan]} cr`
        : '';

    const showCountdown = credits === 0 && countdownMs > 0;
    const cdText = formatCountdown(countdownMs);

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
          <span className={`refill-badge ${countdownMs < 3600_000 ? 'refill-soon' : ''}`} title="Auto-refill in 24h from depletion">
            <IonIcon icon={timeOutline} aria-hidden="true" />
            <span className="refill-text">Refills in {cdText}</span>
          </span>
        )}
      </span>
    );
  };

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
        {/* Left */}
        <button className="navbar-logo" onClick={() => go('/')} aria-label="CreatorFlow home">
          <img src={logo} alt="CreatorFlow logo" className="logo-img" draggable="false" />
          <span className="navbar-brand-text">CreatorFlow</span>
        </button>

        {/* Center (auto-shrinks / hides at ≤1200px) */}
        <PrimaryLinks />

        {/* Right */}
        <div className="auth-desktop">
          <PlanChip inline />

          {user ? (
            <>
              <button
                className="nav-link user-displayname"
                onClick={() => go('/plans', { state: { revisiting: true } })}
                title={user.displayName || user.email}
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

          {/* Hamburger (visible on tablet/mobile) */}
          <button
            className="hamburger"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen ? 'true' : 'false'}
            aria-controls="mobile-drawer"
          >
            <IonIcon icon={menuOpen ? closeOutline : menuOutline} />
          </button>
        </div>

        {/* Mobile drawer */}
        <aside
          id="mobile-drawer"
          className={`mobile-drawer ${menuOpen ? 'open' : ''}`}
          aria-hidden={menuOpen ? 'false' : 'true'}
        >
          <div className="drawer-section">
            <button className="nav-link" onClick={() => go('/plans')}>Get credits</button>
            <button className="nav-link" onClick={() => go('/about')}>About</button>
            <button className="nav-link" onClick={() => go('/terms')}>Terms &amp; Conditions</button>
            <button className="nav-link" onClick={() => go('/privacy')}>Privacy Policy</button>
            <button className="nav-link" onClick={() => go('/contact')}>Contact</button>
          </div>

          <div className="drawer-section">
            <PlanChip />
          </div>

          <div className="drawer-section">
            {user ? (
              <>
                <button
                  className="nav-link user-displayname"
                  onClick={() => go('/plans', { state: { revisiting: true } })}
                >
                  <IonIcon icon={personOutline} aria-hidden="true" />
                  <span className="user-text">{user.displayName || user.email}</span>
                </button>

                <button className="btn btn-danger btn-block" onClick={handleLogoutClick}>
                  <IonIcon icon={logOutOutline} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
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

import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../contexts/DeviceContext";

import { auth, db } from "../firebase";
import { onAuthStateChanged, deleteUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const MIN_CREDITS_TO_GENERATE = 10;
const GRACE_MS = 10 * 60 * 1000;
const MAX_STRIKES = 3;
const STRIKE_COOLDOWN_MS = 60 * 1000;
const PAID_PLAN_NAMES = ["Basic", "Pro", "Premium"];
const EXTENDED_GRACE_MS = 26 * 60 * 60 * 1000;

// Lazy-load the two visual variants
const LandingDesktop = lazy(() => import("./landing/Landing.desktop.jsx"));
const LandingMobile  = lazy(() => import("./landing/Landing.mobile.jsx"));

export default function LandingPage() {
  const { isMobile } = useDevice();

  const [animate, setAnimate] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [credits, setCredits] = useState(null);
  const rightBoxRef = useRef(null);
  const navigate = useNavigate();

  // Only needed for desktop image animation
  useEffect(() => {
    if (!rightBoxRef.current || isMobile) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAnimate(entry.isIntersecting),
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(rightBoxRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  const refreshAndLoadUserDoc = useCallback(async (currentUser) => {
    if (!currentUser) { setCredits(null); return; }
    try {
      setIsRefreshing(true);
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/refresh-credits/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, email: currentUser.email }),
      }).catch(() => {});
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setCredits(typeof data.credits === "number" ? data.credits : 0);
      } else {
        setCredits(0);
      }
    } finally { setIsRefreshing(false); }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) { setCredits(null); setIsCheckingPlan(false); return; }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        let snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email || "",
            createdAt: serverTimestamp(),
            firstSeen: Date.now(),
            subscriptionSelected: false,
            plan: null,
            credits: 0,
            health: { strikes: 0, lastStrikeAt: 0, quarantined: false, pendingHardDelete: false },
          }, { merge: true });
          snap = await getDoc(userRef);
        }

        const data = snap.data() || {};
        const now = Date.now();
        const firstSeen = data.firstSeen || now;
        const health = data.health || {};
        const strikes = Number(health.strikes || 0);
        const lastStrikeAt = Number(health.lastStrikeAt || 0);
        const creditsNum = Number(data.credits || 0);
        const hasActivePlanHint = PAID_PLAN_NAMES.includes(String(data.subscriptionPlan || "").trim());

        const legit = data.subscriptionSelected === true || creditsNum > 0 || hasActivePlanHint;

        if (legit) {
          if (hasActivePlanHint && creditsNum === 0 && data.subscriptionSelected !== true) {
            if (now - firstSeen < EXTENDED_GRACE_MS) {
              await refreshAndLoadUserDoc(currentUser);
              setIsCheckingPlan(false);
              return;
            }
          } else {
            if (strikes > 0 || health.quarantined || health.pendingHardDelete) {
              await updateDoc(userRef, {
                "health.strikes": 0,
                "health.quarantined": false,
                "health.pendingHardDelete": false
              });
            }
            await refreshAndLoadUserDoc(currentUser);
            setIsCheckingPlan(false);
            return;
          }
        }

        if (now - firstSeen < GRACE_MS) {
          await refreshAndLoadUserDoc(currentUser);
          setIsCheckingPlan(false);
          return;
        }

        if (now - lastStrikeAt > STRIKE_COOLDOWN_MS) {
          await updateDoc(userRef, {
            "health.strikes": strikes + 1,
            "health.lastStrikeAt": now
          });
        }

        const snap2 = await getDoc(userRef);
        const strikesNow = Number(snap2.data()?.health?.strikes || strikes + 1);

        if (strikesNow >= MAX_STRIKES) {
          try { await deleteUser(currentUser); }
          catch {
            await updateDoc(userRef, {
              "health.pendingHardDelete": true,
              "health.quarantined": true
            });
            await signOut(auth).catch(() => {});
          } finally {
            navigate("/", { replace: true });
          }
          return;
        }

        await signOut(auth).catch(() => {});
        navigate("/", { replace: true });

      } catch {
        navigate("/", { replace: true });
      } finally {
        setIsCheckingPlan(false);
      }
    });

    return unsubscribe;
  }, [navigate, refreshAndLoadUserDoc]);

  const handleCTA = useCallback(async () => {
    if (!user) { navigate("/signup"); return; }
    await refreshAndLoadUserDoc(user);
    const usable = (credits ?? 0) >= MIN_CREDITS_TO_GENERATE;
    if (usable) navigate("/target");
    else alert("❌ Not enough credits. Please upgrade your plan or try again after auto-refill.");
  }, [navigate, user, credits, refreshAndLoadUserDoc]);

  const isBusy = isCheckingPlan || isRefreshing;

  return (
    <Suspense fallback={null}>
      {isMobile ? (
        <LandingMobile isBusy={isBusy} user={user} handleCTA={handleCTA} />
      ) : (
        <LandingDesktop
          animate={animate}
          isBusy={isBusy}
          user={user}
          handleCTA={handleCTA}
          rightBoxRef={rightBoxRef}
        />
      )}
    </Suspense>
  );
}

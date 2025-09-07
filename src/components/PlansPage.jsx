// PlansPage.jsx
import React, { useEffect, useState } from "react";
import "./PlansPage.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * PlansPage — hosted checkout + pending/confirmed flow
 * - Pro/Premium: mark PENDING only, then redirect to Paddle Hosted Checkout
 * - Basic: call backend /api/select-basic/ (does not re-grant if already claimed)
 * - UI:
 *    • "Current" when CONFIRMED matches the plan (scoped to current UID)
 *    • "Pending…" when PENDING matches the plan (and not yet confirmed)
 * - NEW: If user is already on Pro/Premium and tries to switch to another plan,
 *        ask for confirmation to cancel/modify current subscription before proceeding.
 */

const planFeatures = {
  Basic: [
    { text: "50 AI credits included (granted once)", good: true },
    { text: "Scripts usable for professional purpose", good: true },
    { text: "No auto-reload after 50 credits (manual top-up)", good: false },
  ],
  Pro: [
    { text: "200 AI credits included", good: true },
    { text: "Scripts usable for professional purpose", good: true },
    { text: "Auto-reload after 24h only if credits are 0", good: true },
  ],
  Premium: [
    { text: "1000 AI credits included", good: true },
    { text: "Scripts usable for professional purpose", good: true },
    { text: "Auto-reload after 24h only if credits are 0", good: true },
  ],
};

const PRICES = {
  Basic: { amount: "0.00", period: "/mo" },
  Pro: { amount: "6.46", period: "/mo" },
  Premium: { amount: "16.69", period: "/mo" },
};

// 🔐 Local storage keys (scoped by OWNER_KEY)
const CONFIRMED_KEY = "cf_selected_plan_confirmed";
const PENDING_KEY = "cf_pending_plan";
const OWNER_KEY = "cf_plan_owner_uid";

// Paddle Hosted Checkout (sandbox)
const HOSTED_CHECKOUT_BASE = {
  Pro: "https://sandbox-pay.paddle.io/hsc_01k3am45ankfq6mhm863arf8xd_ajv0sccxzwwxa24sef0t3erzdyp7aspz",
  Premium: "https://sandbox-pay.paddle.io/hsc_01k3ambtqja2hmb1hvg48bz1x8_qetr5gsn168d0xrv36qke8xcnfanmy8e",
};

// API base (Render backend)
const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

// Unicode-safe base64
function safeBtoa(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

const VALID_PLANS = ["Basic", "Pro", "Premium"];
const isValidPlan = (p) => VALID_PLANS.includes(p);

// Read a localStorage value only if it belongs to this UID
function readScoped(key, uid) {
  try {
    if (!uid) return null;
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner !== uid) return null;
    const v = localStorage.getItem(key) || null;
    return isValidPlan(v) ? v : null;
  } catch {
    return null;
  }
}

function buildCheckoutUrl(plan) {
  const base = HOSTED_CHECKOUT_BASE[plan];
  if (!base) return null;

  const user = auth.currentUser;
  const email = user?.email || "";
  const uid = user?.uid || "";

  const passthroughObj = { uid, email, plan, source: "hosted-checkout" };
  const passthroughB64 = safeBtoa(JSON.stringify(passthroughObj));

  const url = new URL(base);
  if (email) url.searchParams.set("customer_email", email);
  url.searchParams.set("passthrough", passthroughB64);

  const origin = window.location.origin;
  url.searchParams.set("success_url", `${origin}/checkout/success`);
  url.searchParams.set("cancel_url", `${origin}/plans`);

  return url.toString();
}

export default function PlansPage() {
  const navigate = useNavigate();

  // Track current UID so we can scope localStorage correctly
  const [ownerUid, setOwnerUid] = useState(auth.currentUser?.uid || null);

  // These will be loaded *after* we know ownerUid
  const [confirmedPlan, setConfirmedPlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);

  // Keep owner UID synced with auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const uid = u?.uid || null;
      setOwnerUid(uid);
    });
    return unsub;
  }, []);

  // When ownerUid changes (login/logout), re-read scoped storage
  useEffect(() => {
    setConfirmedPlan(readScoped(CONFIRMED_KEY, ownerUid));
    setPendingPlan(readScoped(PENDING_KEY, ownerUid));
  }, [ownerUid]);

  // Update if another tab updates these keys (and when owner key changes)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CONFIRMED_KEY || e.key === PENDING_KEY || e.key === OWNER_KEY) {
        setConfirmedPlan(readScoped(CONFIRMED_KEY, ownerUid));
        setPendingPlan(readScoped(PENDING_KEY, ownerUid));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [ownerUid]);

  // If both are set and equal (e.g., payment just confirmed), drop pending
  useEffect(() => {
    if (pendingPlan && confirmedPlan && pendingPlan === confirmedPlan) {
      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      setPendingPlan(null);
    }
  }, [pendingPlan, confirmedPlan]);

  const handleSelect = async (plan) => {
    if (!isValidPlan(plan)) return;

    // 🔔 NEW: If already on Pro/Premium and switching to a different plan,
    // ask for confirmation before proceeding (upgrade/downgrade or to Basic).
    const isPaid = (p) => p === "Pro" || p === "Premium";
    if (isPaid(confirmedPlan) && plan !== confirmedPlan) {
      const ok = window.confirm(
        `You're currently on ${confirmedPlan}. To switch to ${plan}, ` +
        `you may need to cancel or modify your existing subscription. Continue?`
      );
      if (!ok) return;
      // (Logic remains the same after user confirms.)
    }

    // BASIC (free) — requires login to claim safely
    if (plan === "Basic") {
      const user = auth.currentUser;
      if (!user) {
        navigate("/signup", { state: { plan: "Basic" } });
        return;
      }

      // Call backend to set Basic; backend must guard against re-granting
      try {
        await fetch(`${API_BASE}/api/select-basic/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
        });
      } catch (e) {
        console.warn("select-basic failed:", e);
      }

      // Write scoped "confirmed"
      try {
        localStorage.setItem(OWNER_KEY, user.uid);
        localStorage.setItem(CONFIRMED_KEY, "Basic");
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      setConfirmedPlan("Basic");
      setPendingPlan(null);

      navigate("/");
      return;
    }

    // PAID plans (Pro/Premium)
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in first.");
      navigate("/signup", { state: { plan } });
      return;
    }

    // Mark pending for THIS uid
    try {
      localStorage.setItem(OWNER_KEY, user.uid);
      localStorage.setItem(PENDING_KEY, plan);
    } catch {}
    setPendingPlan(plan);

    const url = buildCheckoutUrl(plan);
    if (!url) {
      alert("Checkout link not configured for this plan.");
      return;
    }
    window.location.href = url;
  };

  const isCurrent = (p) => confirmedPlan === p;
  const isPending = (p) => pendingPlan === p && confirmedPlan !== p;

  return (
    <div className="cf-plans">
      {/* Back to home */}
      <button
        className="cf-plans__back"
        onClick={() => navigate("/")}
        aria-label="Back to home"
        title="Back to home"
      >
        ← Back
      </button>

      <div className="cf-plans__stars" aria-hidden="true" />

      <h1 className="cf-plans__title">Choose your plan</h1>
      <p className="cf-plans__subtitle">
        Start free. Upgrade anytime. On paid plans, credits auto-reload after 24h only if your balance hits 0.
      </p>

      <div className="cf-plans__grid">
        {VALID_PLANS.map((p) => {
          const price = PRICES[p];
          return (
            <article
              key={p}
              className={`cf-plan ${p === "Pro" ? "cf-plan--pro" : ""} cf-plan--${p.toLowerCase()}`}
              aria-label={`${p} plan`}
            >
              {p === "Pro" && <div className="cf-plan__flag">Most popular</div>}

              <div className="cf-plan__nameRow">
                <h2 className="cf-plan__name">{p}</h2>
                {isCurrent(p) && <span className="cf-plan__chip">Current</span>}
                {isPending(p) && <span className="cf-plan__chip cf-plan__chip--pending">Pending…</span>}
              </div>

              <div className="cf-plan__price">
                <span className="cf-plan__currency">$</span>
                <span className="cf-plan__amount">{price.amount}</span>
                {price.period && <span className="cf-plan__per">{price.period}</span>}
              </div>

              <ul className="cf-plan__features">
                {planFeatures[p].map((f, i) => (
                  <li key={i} className={f.good ? "good" : "bad"}>
                    <span className="dot" />
                    {f.text}
                  </li>
                ))}
              </ul>

              <button
                className={`cf-plan__cta ${p !== "Basic" ? "cf-plan__cta--grad" : ""}`}
                disabled={isCurrent(p)}
                onClick={() => handleSelect(p)}
              >
                {isCurrent(p) ? "Selected" : p === "Basic" ? "Get started" : "Choose plan"}
              </button>
            </article>
          );
        })}
      </div>

      {pendingPlan && !confirmedPlan && (
        <p className="cf-plans__note">
          Redirected to checkout. Once your payment is confirmed, your plan will update automatically.
        </p>
      )}
    </div>
  );
}

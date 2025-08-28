// PlansPage.jsx
import React, { useEffect, useState } from "react";
import "./PlansPage.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // ✅ no direct Firestore writes

/**
 * PlansPage — hosted checkout + pending/confirmed flow
 * - Pro/Premium: mark PENDING only, then redirect to Paddle Hosted Checkout
 * - Basic: call backend /api/select-basic/ (does not re-grant if already claimed)
 * - UI:
 *    • "Current" when CONFIRMED matches the plan
 *    • "Pending…" when PENDING matches the plan (and not yet confirmed)
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

const CONFIRMED_KEY = "cf_selected_plan_confirmed";
const PENDING_KEY = "cf_pending_plan";

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

  const [confirmedPlan, setConfirmedPlan] = useState(() => {
    try {
      return localStorage.getItem(CONFIRMED_KEY) || null;
    } catch {
      return null;
    }
  });

  const [pendingPlan, setPendingPlan] = useState(() => {
    try {
      return localStorage.getItem(PENDING_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CONFIRMED_KEY || e.key === PENDING_KEY) {
        setConfirmedPlan(localStorage.getItem(CONFIRMED_KEY) || null);
        setPendingPlan(localStorage.getItem(PENDING_KEY) || null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (pendingPlan && confirmedPlan && pendingPlan === confirmedPlan) {
      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      setPendingPlan(null);
    }
  }, [pendingPlan, confirmedPlan]);

  const handleSelect = async (plan) => {
    if (plan === "Basic") {
      const user = auth.currentUser;
      if (!user) {
        navigate("/signup", { state: { plan: "Basic" } });
        return;
      }

      // ✅ Call backend to safely set Basic (no re-grant if already claimed)
      try {
        await fetch(`${API_BASE}/api/select-basic/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
        });
      } catch (e) {
        console.warn("select-basic failed:", e);
      }

      try {
        localStorage.setItem(CONFIRMED_KEY, "Basic");
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      setConfirmedPlan("Basic");
      setPendingPlan(null);

      navigate("/");
      return;
    }

    // Paid plans
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in first.");
      navigate("/signup", { state: { plan } });
      return;
    }

    try {
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

  const isCurrent = (plan) => confirmedPlan === plan;
  const isPending = (plan) => pendingPlan === plan && confirmedPlan !== plan;

  return (
    <div className="cf-plans">
      {/* Back to home — ONLY ADDITION */}
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
        {["Basic", "Pro", "Premium"].map((plan) => {
          const price = PRICES[plan];
          return (
            <article
              key={plan}
              className={`cf-plan ${plan === "Pro" ? "cf-plan--pro" : ""} cf-plan--${plan.toLowerCase()}`}
              aria-label={`${plan} plan`}
            >
              {plan === "Pro" && <div className="cf-plan__flag">Most popular</div>}

              <div className="cf-plan__nameRow">
                <h2 className="cf-plan__name">{plan}</h2>
                {isCurrent(plan) && <span className="cf-plan__chip">Current</span>}
                {isPending(plan) && <span className="cf-plan__chip cf-plan__chip--pending">Pending…</span>}
              </div>

              <div className="cf-plan__price">
                <span className="cf-plan__currency">$</span>
                <span className="cf-plan__amount">{price.amount}</span>
                {price.period && <span className="cf-plan__per">{price.period}</span>}
              </div>

              <ul className="cf-plan__features">
                {planFeatures[plan].map((f, i) => (
                  <li key={i} className={f.good ? "good" : "bad"}>
                    <span className="dot" />
                    {f.text}
                  </li>
                ))}
              </ul>

              <button
                className={`cf-plan__cta ${plan !== "Basic" ? "cf-plan__cta--grad" : ""}`}
                disabled={isCurrent(plan)}
                onClick={() => handleSelect(plan)}
              >
                {isCurrent(plan) ? "Selected" : plan === "Basic" ? "Get started" : "Choose plan"}
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

// src/components/SuccessPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Local storage keys (keep consistent with PlansPage)
const CONFIRMED_KEY = "cf_selected_plan_confirmed";
const PENDING_KEY   = "cf_pending_plan";
const OWNER_KEY     = "cf_plan_owner_uid";

// Backend base URL (CRA env var)
// REACT_APP_API_BASE_URL=https://your-backend.example.com
const API_BASE = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

const VALID_PLANS = ["Basic", "Pro", "Premium"];
const isValidPlan = (p) => VALID_PLANS.includes(p);

function normalizePlan(p) {
  const s = String(p || "").trim();
  if (!s) return null;
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return isValidPlan(cap) ? cap : null;
}

function safeAtob(str) {
  try {
    // handle URL-safe base64 (+/- swapped)
    const norm = str.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(norm)));
  } catch {
    try { return atob(str); } catch { return ""; }
  }
}

export default function SuccessPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [status, setStatus] = useState("processing"); // processing | done | skipped

  const qp = useMemo(() => new URLSearchParams(search), [search]);
  const customerEmail   = qp.get("customer_email") || "";
  const passthroughRaw  = qp.get("passthrough") || "";
  const transactionId   = qp.get("transaction_id") || qp.get("ptxn") || "";
  const paddleCustomerId= qp.get("paddle_customer_id") || "";

  // Decode passthrough -> { uid, plan, email?, source? }
  const passthrough = useMemo(() => {
    if (!passthroughRaw) return {};
    const try1 = safeAtob(passthroughRaw);
    try {
      return JSON.parse(try1);
    } catch {
      try {
        return JSON.parse(passthroughRaw);
      } catch {
        return {};
      }
    }
  }, [passthroughRaw]);

  useEffect(() => {
    const plan = normalizePlan(passthrough.plan);
    const uid  = String(passthrough.uid || "").trim();
    const emailFromPt = String(passthrough.email || "").trim();
    const email = customerEmail || emailFromPt || "";

    // If no valid plan, nothing to do
    if (!plan) { setStatus("skipped"); return; }

    // 1) Confirm locally (scoped to the checkout owner UID)
    try {
      if (uid) localStorage.setItem(OWNER_KEY, uid);
      localStorage.setItem(CONFIRMED_KEY, plan);
      localStorage.removeItem(PENDING_KEY);

      // Nudge other tabs to refresh their view
      try { window.dispatchEvent(new StorageEvent("storage", { key: OWNER_KEY })); } catch {}
      try { window.dispatchEvent(new StorageEvent("storage", { key: CONFIRMED_KEY })); } catch {}
      try { window.dispatchEvent(new StorageEvent("storage", { key: PENDING_KEY })); } catch {}
    } catch {}

    // 2) Notify backend to update Firestore (source of truth)
    (async () => {
      try {
        if (!API_BASE) {
          console.warn("REACT_APP_API_BASE_URL is not set; skipping backend finalize.");
        } else {
          await fetch(`${API_BASE}/api/finalize-checkout/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid,
              email,
              plan,
              transaction_id: transactionId || "",
              paddle_customer_id: paddleCustomerId || ""
            }),
          });
        }
      } catch (err) {
        // Non-fatal; local UI already updated
        console.warn("finalize-checkout failed:", err);
      } finally {
        setStatus("done");
      }
    })();
  }, [passthrough, customerEmail, transactionId, paddleCustomerId]);

  const goHome  = () => navigate("/");
  const goPlans = () => navigate("/plans", { replace: true });

  const planPretty = normalizePlan(passthrough.plan) || "";

  return (
    <main style={{minHeight: "70vh", display: "grid", placeItems: "center", padding: 24}}>
      <div style={{
        width: "min(720px, 92vw)",
        border: "1px solid #ffffff22",
        borderRadius: 16,
        padding: "28px 22px",
        background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
        boxShadow: "0 12px 30px rgba(0,0,0,.35)",
        color: "#fff",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(24px, 3.6vw, 36px)",
          lineHeight: 1.05,
          background: "linear-gradient(90deg, #fff, #dcd3ff 30%, #a55cff)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent"
        }}>
          {status === "done" ? "Payment successful 🎉" : "Checkout completed"}
        </h1>

        <p style={{opacity: .85, marginTop: 8}}>
          Thanks! Your {planPretty || "subscription"} is being finalized.
          You can safely close this page or head back to the app.
        </p>

        <div style={{
          display: "grid",
          gap: 10,
          marginTop: 18,
          padding: "14px 16px",
          border: "1px dashed #ffffff30",
          borderRadius: 12,
          background: "rgba(255,255,255,.04)"
        }}>
          {planPretty && (
            <div><strong>Plan: </strong><span>{planPretty}</span></div>
          )}
          {customerEmail && (
            <div><strong>Email: </strong><span>{customerEmail}</span></div>
          )}
          {transactionId && (
            <div><strong>Transaction ID: </strong><code>{transactionId}</code></div>
          )}
          {paddleCustomerId && (
            <div><strong>Paddle Customer: </strong><code>{paddleCustomerId}</code></div>
          )}
          {!planPretty && (
            <div style={{opacity:.85}}>
              <em>No plan found in URL. Ensure your hosted checkout appends
              <code> customer_email</code> and a base64 <code>passthrough</code>.</em>
            </div>
          )}
        </div>

        <div style={{display:"flex", gap:12, marginTop: 22, flexWrap:"wrap"}}>
          <button onClick={goHome}  style={btn()}>Go to Home</button>
          <button onClick={goPlans} style={btn(true)}>Manage Plans</button>
        </div>

        {status === "processing" && (
          <p style={{marginTop: 14, opacity:.75}}>
            Finalizing… This page already saved your plan locally. Your credits update when the webhook finishes.
          </p>
        )}
      </div>
    </main>
  );
}

function btn(outline=false){
  return {
    borderRadius: 12,
    padding: "10px 16px",
    border: outline ? "1.5px solid #ffffff55" : "1.5px solid transparent",
    background: outline ? "transparent"
                       : "linear-gradient(90deg, #6f4dff, #c14bff)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    letterSpacing: .2,
    boxShadow: outline ? "none" : "0 10px 22px rgba(120, 80, 255, .30)"
  };
}

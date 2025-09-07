// src/components/DoorwayPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { FaCopy } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { IoArrowBackCircle } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import "./DoorwayPage.css";
import logo from "../logo.png";

function DoorwayPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [creditDepletedAt, setCreditDepletedAt] = useState(null);
  const [generatedText, setGeneratedText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const interactiveRef = useRef(null);
  const preRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { niche, subCategory, followerCount, tone, moreSpecific } =
    location.state || {};

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────
  const cleanScript = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/\r\n?/g, "\n")
      .replace(/^\s*hok\s*:/gim, "Hook:")
      .replace(/^\s*hook\s*:/gim, "Hook:")
      .replace(/^\s*body\s*:/gim, "Body:")
      .replace(/^\s*cta\s*:/gim, "CTA:")
      .replace(/\s*Hook:/gi, "\n\n**Hook:**")
      .replace(/\s*Body:/gi, "\n\n**Body:**")
      .replace(/\s*CTA:/gi, "\n\n**CTA:**")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/(?:\s*\bundefined\b\s*)+$/i, "")
      .trim();
  };

  const parseScriptSections = (md) => {
    if (!md) return null;
    const rx =
      /\*\*(Hook|Body|CTA):\*\*([\s\S]*?)(?=\n{2,}\*\*(?:Hook|Body|CTA):\*\*|\s*$)/gi;
    const out = [];
    let m;
    while ((m = rx.exec(md)) !== null)
      out.push({ key: m[1], content: (m[2] || "").trim() });
    return out.length ? out : null;
  };

  // ───────────────────────────────────────────────────────────
  // Auth + initial user doc
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;

      try {
        await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/refresh-credits/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser.uid, email: currentUser.email }),
        });
      } catch {
        /* ignore refresh errors here */
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCredits(data.credits ?? 0);
        setCreditDepletedAt(data.creditDepletedAt ?? null);
      } else {
        setCredits(0);
        setCreditDepletedAt(null);
      }
    });
    return () => unsub();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Subtle interactive glow (disabled for reduced motion)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const node = interactiveRef.current;
    if (!node) return;
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      node.style.display = "none";
      return;
    }
    let curX = 0,
      curY = 0,
      tgX = 0,
      tgY = 0,
      raf;
    const move = () => {
      curX += (tgX - curX) / 18;
      curY += (tgY - curY) / 18;
      node.style.transform = `translate(${Math.round(curX)}px, ${Math.round(
        curY
      )}px)`;
      raf = requestAnimationFrame(move);
    };
    const onPointerMove = (e) => {
      tgX = e.clientX;
      tgY = e.clientY;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    move();
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ───────────────────────────────────────────────────────────
  // Save a finished script (for Dashboard) — minimal, safe
  // ───────────────────────────────────────────────────────────
  const persistScript = async (fullText) => {
    if (!user) return;
    if (!fullText || !fullText.trim()) return;

    try {
      await addDoc(collection(db, "users", user.uid, "scripts"), {
        text: fullText,
        niche: niche || null,
        subCategory: subCategory || null,
        followerCount: followerCount || null,
        tone: tone || null,
        moreSpecific: (moreSpecific || "").trim() || null,
        createdAt: serverTimestamp(),
        length: fullText.length || 0,
      });
    } catch (err) {
      // Non-fatal; UI already shows the script. Log for debugging.
      console.warn("Saving script failed:", err);
    }
  };

  // ───────────────────────────────────────────────────────────
  // Generate
  // ───────────────────────────────────────────────────────────
  const fetchChatGPT = async () => {
    if (!user) return;

    // If user refreshed this page without a prompt, send them back—prevents errors.
    if (!niche || !subCategory || !followerCount || !tone) {
      navigate("/target", { replace: true });
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/refresh-credits/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
    } catch {
      /* ignore */
    }

    const userRef = doc(db, "users", user.uid);
    const freshSnap = await getDoc(userRef);
    const d = freshSnap.exists() ? freshSnap.data() : {};
    const effectiveCredits = d.credits ?? 0;
    const effectiveCreditDepletedAt = d.creditDepletedAt ?? null;

    setCredits(effectiveCredits);
    setCreditDepletedAt(effectiveCreditDepletedAt);

    if (effectiveCredits < 10) {
      alert("❌ Not enough credits. Please upgrade your plan or wait for reset.");
      return;
    }

    setGeneratedText("");
    setIsThinking(true);

    try {
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/generate-review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            niche,
            subCategory,
            followerCount,
            tone,
            moreSpecific: moreSpecific?.trim() || "",
            // ✅ Necessary addition for Premium stepwise detection
            uid: user.uid,
            email: user.email,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        console.error("Backend error:", err);
        setGeneratedText("Error: " + resp.statusText);
        setIsThinking(false);
        return;
      }

      const data = await resp.json();
      const fullText = cleanScript(
        data.response || "Error: No response from backend."
      );

      // Typewriter effect (requestAnimationFrame)
      let i = 0;
      const step = () => {
        const ch = fullText[i];
        if (ch !== undefined) setGeneratedText((prev) => prev + ch);
        i += 1;
        if (i < fullText.length) requestAnimationFrame(step);
        else {
          setGeneratedText((prev) => cleanScript(prev));
          setIsThinking(false);
          // ✅ Save for dashboard (non-blocking)
          persistScript(fullText);
        }
      };
      requestAnimationFrame(step);

      // Credit update
      const newCredits = Math.max(0, effectiveCredits - 10);
      const update = { credits: newCredits };
      if (!effectiveCreditDepletedAt && newCredits === 0) {
        update.creditDepletedAt = serverTimestamp();
      }
      await updateDoc(userRef, update);
      setCredits(newCredits);
      if (!effectiveCreditDepletedAt && newCredits === 0) {
        setCreditDepletedAt("just-stamped");
      }
    } catch (e) {
      setGeneratedText("Error: " + e.message);
      setIsThinking(false);
    }
  };

  // First auto-generate after credits load
  useEffect(() => {
    if (credits !== null && isFirstRender) {
      fetchChatGPT();
      setIsFirstRender(false);
    }
  }, [credits, isFirstRender]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copy
  const handleCopyClick = () => {
    const el = preRef.current;
    const text = el?.innerText || el?.textContent || "";
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err));
  };

  // Build sections only after generation completes (avoid flicker mid-type)
  const sections = useMemo(
    () => (!isThinking ? parseScriptSections(generatedText) : null),
    [generatedText, isThinking]
  );

  // Auth gate
  if (!user) {
    return (
      <div className="unauth-wrapper">
        <div>🚫 Access Denied 🚫</div>
        <div>You must be logged in to view this page.</div>
        <button onClick={() => navigate("/signup")} className="unauth-btn">
          Go to Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="doorway-wrapper">
      <div className="gradient-bg">
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        <div className="gradients-container">
          <div className="g1" />
          <div className="g2" />
          <div className="g3" />
          <div className="g4" />
          <div className="g5" />
          <div className="interactive" ref={interactiveRef} />
        </div>
      </div>

      <div className="content-wrapper">
        <div className="heading-container">
          <img
            src={logo}
            alt="Logo"
            className="heading-logo"
            loading="lazy"
            decoding="async"
          />
        <h1>CreatorFlow</h1>
        </div>

        <div className="foreground-card">
          <h2>Your script:</h2>

          <div className="inside-card markdown-output">
            {isThinking && (
              <p className="thinking-indicator">
                Thinking<span className="dots">...</span>
              </p>
            )}

            {(!sections || isThinking) ? (
              <ReactMarkdown>{generatedText || ""}</ReactMarkdown>
            ) : (
              <div className="script-grid">
                {sections.map((s) => (
                  <section
                    key={s.key}
                    className={`script-box script-${s.key.toLowerCase()}`}
                    aria-label={s.key}
                  >
                    <div className="script-box__label">{s.key}</div>
                    <div className="script-box__content">
                      <ReactMarkdown>{s.content}</ReactMarkdown>
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Hidden copy source preserves full text */}
            <pre ref={preRef} style={{ display: "none" }}>
              {generatedText}
            </pre>
          </div>

          <div className="buttons-wrapper">
            <div className="buttons">
              <button
                className="generate-btn"
                onClick={fetchChatGPT}
                disabled={credits === null || credits < 10 || isThinking}
              >
                {isThinking ? "Generating..." : "Generate again"}
              </button>

              <button className="prompt-btn" onClick={() => navigate("/target")}>
                New prompt
              </button>

              <div className="back-btn-wrapper">
                <button
                  className="back-btn"
                  onClick={() => navigate("/target")}
                  aria-label="Back"
                >
                  <IoArrowBackCircle size={24} />
                </button>
                <span className="tooltip">Back</span>
              </div>

              <div className="credit-box">
                <span className="credit-label">💎</span>
                <span className="credit-value">
                  {credits !== null ? `${credits} credits left` : "Loading..."}
                </span>
              </div>

              <button className="copy-btn" aria-label="Copy" onClick={handleCopyClick}>
                <FaCopy />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoorwayPage;

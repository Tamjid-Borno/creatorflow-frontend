// src/components/DoorwayPage.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaCopy } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import "./DoorwayPage.css";
import logo from "../logo.png";

function DoorwayPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [generatedText, setGeneratedText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const interactiveRef = useRef(null);
  const preRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

  const { niche, subCategory, followerCount, tone, moreSpecific } =
    location.state || {};

  const cleanScript = useCallback((text) => {
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
  }, []);

  const parseScriptSections = useCallback((md) => {
    if (!md) return null;

    const rx =
      /\*\*(Hook|Body|CTA):\*\*([\s\S]*?)(?=\n{2,}\*\*(?:Hook|Body|CTA):\*\*|\s*$)/gi;

    const out = [];
    let match;

    while ((match = rx.exec(md)) !== null) {
      out.push({
        key: match[1],
        content: (match[2] || "").trim(),
      });
    }

    return out.length ? out : null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setCredits(null);
        return;
      }

      try {
        await fetch(`${API_BASE_URL}/api/refresh-credits/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
          }),
        });
      } catch {
        // Ignore refresh errors here
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          const data = snap.data();
          setCredits(data.credits ?? 0);
        } else {
          setCredits(0);
        }
      } catch (error) {
        console.error("Failed to load user credits:", error);
        setCredits(0);
      }
    });

    return () => unsubscribe();
  }, [API_BASE_URL]);

  useEffect(() => {
    const node = interactiveRef.current;
    if (!node) return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      node.style.display = "none";
      return;
    }

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId;

    const animate = () => {
      currentX += (targetX - currentX) / 18;
      currentY += (targetY - currentY) / 18;

      node.style.transform = `translate(${Math.round(currentX)}px, ${Math.round(
        currentY
      )}px)`;

      rafId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    animate();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const persistScript = useCallback(
    async (fullText) => {
      if (!user || !fullText?.trim()) return;

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
      } catch (error) {
        console.warn("Saving script failed:", error);
      }
    },
    [user, niche, subCategory, followerCount, tone, moreSpecific]
  );

  const fetchChatGPT = useCallback(async () => {
    if (!user) return;

    if (!niche || !subCategory || !followerCount || !tone) {
      navigate("/target", { replace: true });
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/refresh-credits/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      });
    } catch {
      // Ignore refresh errors
    }

    const userRef = doc(db, "users", user.uid);

    let effectiveCredits = 0;
    let effectiveCreditDepletedAt = null;

    try {
      const freshSnap = await getDoc(userRef);
      const data = freshSnap.exists() ? freshSnap.data() : {};

      effectiveCredits = data.credits ?? 0;
      effectiveCreditDepletedAt = data.creditDepletedAt ?? null;

      setCredits(effectiveCredits);
    } catch (error) {
      console.error("Failed to refresh user credits:", error);
      setGeneratedText("Error: Failed to load your credits.");
      setIsThinking(false);
      return;
    }

    if (effectiveCredits < 10) {
      alert("❌ Not enough credits. Please upgrade your plan or wait for reset.");
      setIsThinking(false);
      return;
    }

    setGeneratedText("");
    setIsThinking(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          subCategory,
          followerCount,
          tone,
          moreSpecific: moreSpecific?.trim() || "",
          uid: user.uid,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        setGeneratedText(`Error: ${response.statusText}`);
        setIsThinking(false);
        return;
      }

      const data = await response.json();
      const fullText = cleanScript(
        data.response || "Error: No response from backend."
      );

      let index = 0;

      const typeNextChar = () => {
        const char = fullText[index];

        if (char !== undefined) {
          setGeneratedText((prev) => prev + char);
        }

        index += 1;

        if (index < fullText.length) {
          requestAnimationFrame(typeNextChar);
        } else {
          setGeneratedText((prev) => cleanScript(prev));
          setIsThinking(false);
          persistScript(fullText);
        }
      };

      requestAnimationFrame(typeNextChar);

      const newCredits = Math.max(0, effectiveCredits - 10);
      const updatePayload = { credits: newCredits };

      if (!effectiveCreditDepletedAt && newCredits === 0) {
        updatePayload.creditDepletedAt = serverTimestamp();
      }

      await updateDoc(userRef, updatePayload);
      setCredits(newCredits);
    } catch (error) {
      console.error("Generation failed:", error);
      setGeneratedText(`Error: ${error.message}`);
      setIsThinking(false);
    }
  }, [
    API_BASE_URL,
    cleanScript,
    followerCount,
    moreSpecific,
    navigate,
    niche,
    persistScript,
    subCategory,
    tone,
    user,
  ]);

  useEffect(() => {
    if (credits !== null && isFirstRender) {
      fetchChatGPT();
      setIsFirstRender(false);
    }
  }, [credits, isFirstRender, fetchChatGPT]);

  const handleCopyClick = useCallback(() => {
    const el = preRef.current;
    const text = el?.innerText || el?.textContent || "";

    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((error) => console.error("Failed to copy:", error));
  }, []);

  const sections = useMemo(() => {
    if (isThinking) return null;
    return parseScriptSections(generatedText);
  }, [generatedText, isThinking, parseScriptSections]);

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

            {!sections || isThinking ? (
              <ReactMarkdown>{generatedText || ""}</ReactMarkdown>
            ) : (
              <div className="script-grid">
                {sections.map((section) => (
                  <section
                    key={section.key}
                    className={`script-box script-${section.key.toLowerCase()}`}
                    aria-label={section.key}
                  >
                    <div className="script-box__label">{section.key}</div>
                    <div className="script-box__content">
                      <ReactMarkdown>{section.content}</ReactMarkdown>
                    </div>
                  </section>
                ))}
              </div>
            )}

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

              <button
                className="copy-btn"
                aria-label="Copy"
                onClick={handleCopyClick}
              >
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

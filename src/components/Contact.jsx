// Contact.jsx
import React, { useEffect, useMemo } from "react";

function Stars({ count = 60 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2.2 + 0.6,
        delay: Math.random() * 7,
      })),
    [count]
  );
  return (
    <div className="contact-stars" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="contact-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Contact() {
  useEffect(() => {
    const id = "contact-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <main className="contact-wrap">
      <Stars />
      <div className="contact-aurora" aria-hidden />
      <div className="contact-top-feather" aria-hidden />

      <section className="contact-hero">
        <h1 className="contact-title">Let’s connect</h1>
        <p className="contact-sub">
          We’d love to hear from you — whether it’s feedback, support, or just a friendly hello.
        </p>
      </section>

      <section className="contact-links">
        <a
          href="mailto:tamjidborno2009@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <span className="contact-icon">📧</span>
          <div>
            <strong>Email us</strong>
            <p>tamjidborno2009@gmail.com</p>
          </div>
        </a>

        <a
          href="https://www.instagram.com/just_borno/"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <span className="contact-icon">📸</span>
          <div>
            <strong>Instagram</strong>
            <p>@just_borno</p>
          </div>
        </a>

        <a
          href="https://www.facebook.com/mansib.nubair.2025"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <span className="contact-icon">📘</span>
          <div>
            <strong>Facebook</strong>
            <p>/mansib.nubair.2025</p>
          </div>
        </a>

        <a
          href="https://discord.com/users/borno.mars"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <span className="contact-icon">💬</span>
          <div>
            <strong>Discord</strong>
            <p>borno.mars</p>
          </div>
        </a>
      </section>
    </main>
  );
}

const CSS = `
:root{
  --c-bg: #090112;
  --c-fg: #ebe6ff;
  --c-muted: #bfb6d6;
  --c-accent: #a55cff;
  --c-border: rgba(165,92,255,.28);
  --c-ease: cubic-bezier(.4,0,.2,1);
}

.contact-wrap{ position:relative; color:var(--c-fg); background:none; isolation:isolate; overflow:hidden;
  min-height:80vh; display:flex; flex-direction:column; justify-content:center; padding:80px 20px; }
.contact-top-feather{ position:absolute; inset:0 0 auto 0; height:160px; background:linear-gradient(to bottom, var(--c-bg), transparent); opacity:.95; z-index:0; }
.contact-aurora{ position:absolute; inset:-25%; z-index:0;
  background: conic-gradient(from 230deg at 50% 50%, #5b3aa999, #126b7f88, #a93a9e88, #5b3aa999);
  filter: blur(160px) saturate(.9) brightness(.7); opacity:.18; animation:contact-drift 38s linear infinite; }
@keyframes contact-drift{ 0%{transform:rotate(0)} 50%{transform:rotate(180deg)} 100%{transform:rotate(360deg)} }

.contact-stars{ position:absolute; inset:0; z-index:0; pointer-events:none; }
.contact-star{ position:absolute; display:block; background:#fff; border-radius:999px; filter:drop-shadow(0 0 10px #ffffffcc);
  opacity:.75; animation:contact-twinkle 7s ease-in-out infinite; }
@keyframes contact-twinkle{ 0%,100%{opacity:.5; transform:scale(.9)} 50%{opacity:1; transform:scale(1.1)} }

.contact-hero{ position:relative; z-index:1; text-align:center; margin-bottom:40px; }
.contact-title{ font-size: clamp(30px, 4vw, 56px); line-height:1.05;
  background: linear-gradient(90deg, #fff, #dcd3ff 30%, var(--c-accent)); -webkit-background-clip:text; background-clip:text; color:transparent; margin:0 0 10px; }
.contact-sub{ color:var(--c-muted); font-size: clamp(14px, 1.6vw, 18px); margin:0 auto; max-width:720px; }

.contact-links{ position:relative; z-index:1; display:grid; gap:18px; max-width:720px; margin:0 auto; }
.contact-card{ display:flex; align-items:center; gap:14px; padding:16px 18px;
  border:1px solid var(--c-border); border-radius:16px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
  box-shadow:0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(6px); text-decoration:none; color:var(--c-fg);
  transition: transform .22s var(--c-ease), box-shadow .22s var(--c-ease), border-color .22s var(--c-ease); }
.contact-card:hover{ transform: translateY(-3px); border-color:#c5b5ff; box-shadow:0 16px 36px rgba(0,0,0,.55), 0 0 0 1px rgba(197,181,255,.18) inset; }
.contact-icon{ width:42px; height:42px; border-radius:999px; display:grid; place-items:center; font-size:20px; color:#090112;
  background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff); box-shadow: inset 0 0 10px rgba(255,255,255,.65); }

.contact-card strong{ display:block; font-size:15px; }
.contact-card p{ margin:0; font-size:13px; color:var(--c-muted); }
`;

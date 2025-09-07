import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CosmicTestimonials.jsx — CHROME-JANK FIX
 * - Animations only run while the section is in view (ct-anim-on)
 * - Perf gating: ct-perf-low removes heavy blurs/backdrop-filter
 * - DOM stars disabled on low-end / reduced motion / offscreen
 */

const DEFAULT_TESTIMONIALS = [
  { name: "Sarah Malik", role: "Fitness Creator", rating: 5, text: "I used to spend hours staring at a blank page. Now I crank out a whole month’s worth of hooks in one sitting. Honestly feels like cheating (in the best way)." },
  { name: "James Park", role: "Comedy Skits", rating: 5, text: "It actually gets my sense of humor?? My punchlines don’t sound robotic — my audience keeps asking if I hired a writer lol." },
  { name: "Ayesha Khan", role: "BookTok", rating: 5, text: "I turned a random book review into my most saved Reel. I didn’t even change much, just copy-pasted the script. Wild." },
  { name: "Marco Reyes", role: "Food Vlogger", rating: 4, text: "I post in Spanish and English — usually a nightmare. This made it easy to remix the same script for both. Saved me so much time." },
  { name: "Luna Ito", role: "Beauty", rating: 5, text: "I thought I’d seen every kind of hook. Nope. This thing suggested angles I never would’ve thought of." },
  { name: "Khadija Noor", role: "EduTech", rating: 5, text: "I run a small channel for my students. For the first time, brands actually reached out because my videos looked polished. Game changer." },
  { name: "Maxwell Dean", role: "Travel", rating: 4, text: "Wrote like 50 scripts while I was stuck on a flight. Didn’t touch my laptop for the rest of the trip." },
  { name: "Priya Sharma", role: "DIY & Crafts", rating: 5, text: "My first try went viral. I’m still getting DMs about it. That’s never happened before." },
  { name: "Leo Martins", role: "Tech Reviews", rating: 5, text: "The hooks it gave me doubled my watch time. Double. That’s insane for tech content." },
  { name: "Hannah Zhou", role: "Language", rating: 5, text: "I do bilingual content, and usually I burn out writing both versions. This cut my workload in half." },
  { name: "Nadia Rahman", role: "Lifestyle", rating: 5, text: "I didn’t even know what a ‘tone slider’ was, but now my posts finally sound like… me." },
  { name: "Arman Hossain", role: "Gaming", rating: 4, text: "I used it for a late-night stream highlight — woke up to triple the comments. Not bad." },
  { name: "Bella Rossi", role: "Fashion", rating: 5, text: "For the first time people actually clicked my link. The captions finally work." },
  { name: "Tomás Silva", role: "Music", rating: 4, text: "I turned one of my lyrics into a hook. It hit way harder than my usual intros." },
  { name: "Yara El-Sayed", role: "News Explainer", rating: 5, text: "Explaining politics in 15 seconds is brutal. This tool basically gives me a head start every time." },
  { name: "Mila Novak", role: "Art", rating: 5, text: "I’ve been blocked for weeks. Two minutes in here and I had five ideas I actually liked." },
  { name: "Omar Faruq", role: "Finance", rating: 5, text: "I used to bore people with numbers. Now my videos tell actual stories. Views went up immediately." },
  { name: "Jin Park", role: "ASMR", rating: 4, text: "It suggested phrases that were so smooth, my fans literally commented about it." },
  { name: "Elena Petrova", role: "Wellness", rating: 5, text: "My call-to-actions finally feel natural. People don’t just scroll past anymore." },
  { name: "Rafi Ahmed", role: "Lifestyle", rating: 5, text: "I can switch between English and Bangla without losing my style. My followers love it." },
  { name: "Noah Green", role: "Film", rating: 4, text: "It gave me a tighter story arc. My short film breakdowns feel way less ramble-y now." },
  { name: "Zara Ali", role: "Parenting", rating: 5, text: "I posted a mom-hack video with one of its hooks — easily my best performing post this year." },
  { name: "Diego Ortiz", role: "Sports", rating: 5, text: "I turned a boring stats breakdown into actual hype. Even casual fans watched till the end." },
  { name: "Maya Singh", role: "Career", rating: 4, text: "I banged out a week of posts during one coffee break. That’s never happened before." },
];

const LOGOS = [
  "Fitness Creators","Comedians","BookTok Influencers","Food Vloggers","Beauty Gurus",
  "Educators","Travel Bloggers","DIY & Makers","Tech Reviewers","Lifestyle Creators",
];

// Utils
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const formatCompact = (n) => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
};

function Stars({ count = 60, disabled = false }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2.2 + 0.6,
        delay: Math.random() * 6,
      })),
    [count]
  );

  if (disabled) return <div className="ct-stars" aria-hidden />;

  return (
    <div className="ct-stars" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="ct-star"
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

function Rating({ n = 5 }) {
  return <div className="ct-rating" aria-label={`${n} star rating`}>{"★".repeat(n)}</div>;
}

function Avatar({ name }) {
  const initials = useMemo(
    () => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
    [name]
  );
  return <div className="ct-avatar" aria-hidden>{initials}</div>;
}

/** CountUp that restarts whenever `trigger` changes */
function CountUp({ value = 0, duration = 1200, trigger = 0, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const animate = (t) => {
      const p = clamp((t - start) / duration, 0, 1);
      setDisplay(Math.floor(value * p));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    setDisplay(0);
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, trigger]);

  return <span>{prefix}{formatCompact(display)}{suffix}</span>;
}
function StatNumber({ value, trigger = 0 }) {
  const isNumeric = typeof value === "number" && isFinite(value);
  if (isNumeric) return <CountUp value={value} trigger={trigger} />;
  return <span>{String(value ?? "—")}</span>;
}

export default function CosmicTestimonials({
  title = "Loved by creators across the galaxy",
  subtitle = "Real results from real humans. Scripts that hook, storytell, and convert—without losing your voice.",
  testimonials = DEFAULT_TESTIMONIALS,
  align = "center",
  collapsible = true,
  initialCount = 9,
  stats = { users: 1220, scripts: 52340, rating: 4.4 },
}) {
  // Inject styles once
  useEffect(() => {
    const id = "ct-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS_STRING;
      document.head.appendChild(style);
    }
  }, []);

  // Perf profile: low RAM/CPU, Data Saver, or weaker Chrome setups
  const PERF_LOW = useMemo(() => {
    const dm = navigator.deviceMemory || 8;
    const hc = navigator.hardwareConcurrency || 8;
    const sd = navigator.connection && navigator.connection.saveData;
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent) && !/OPR/i.test(navigator.userAgent);
    return (dm && dm <= 4) || (hc && hc <= 4) || !!sd || (isChrome && dm <= 6);
  }, []);
  useEffect(() => {
    if (PERF_LOW) document.documentElement.classList.add("ct-perf-low");
    return () => document.documentElement.classList.remove("ct-perf-low");
  }, [PERF_LOW]);

  // Section entrance + run animations only while in view
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [animOn, setAnimOn] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // one observer for entrance
    const entranceObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); entranceObs.disconnect(); } }),
      { root: null, rootMargin: "-10% 0px -10% 0px", threshold: 0.1 }
    );
    entranceObs.observe(el);

    // another observer to toggle animations while in view
    const animObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setAnimOn(e.isIntersecting && !prefersReduced)),
      { root: null, threshold: 0.25 }
    );
    animObs.observe(el);

    return () => {
      entranceObs.disconnect();
      animObs.disconnect();
    };
  }, []);

  // Collapsible
  const [expanded, setExpanded] = useState(false);
  const shown = collapsible && !expanded ? testimonials.slice(0, initialCount) : testimonials;

  // Stats visibility trigger (replays each entry)
  const statsRef = useRef(null);
  const [statTrigger, setStatTrigger] = useState(0);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setStatTrigger((x) => x + 1); }),
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const disableStars = prefersReduced || PERF_LOW || !animOn;

  return (
    <section
      ref={wrapRef}
      className={`ct-wrap ${visible ? "ct-visible" : ""} ${animOn ? "ct-anim-on" : ""}`}
    >
      <div className="ct-top-feather" aria-hidden />
      <Stars count={PERF_LOW ? 24 : 60} disabled={disableStars} />
      <div className="ct-aurora" aria-hidden />

      <header className={`ct-header ${align === "left" ? "left" : ""}`}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      <div className="ct-marquee" role="marquee" aria-label="Trusted by creator segments">
        <div className="ct-track">
          {[...LOGOS, ...LOGOS].map((label, i) => (
            <span key={i} className="ct-chip">{label}</span>
          ))}
        </div>
      </div>

      <div className="ct-grid">
        {shown.map((t, idx) => (
          <article key={idx} className="ct-card" tabIndex={0} aria-label={`Testimonial from ${t.name}`}>
            <div className="ct-card-top">
              <Avatar name={t.name} />
              <div className="ct-id">
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
              <Rating n={t.rating} />
            </div>
            <p className="ct-text">{t.text}</p>
          </article>
        ))}
      </div>

      {collapsible && testimonials.length > initialCount && (
        <div className="ct-more">
          <button className="ct-more-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `Show more testimonials (${testimonials.length - shown.length})`}
          </button>
        </div>
      )}

      <div className="ct-divider" aria-hidden />

      <section ref={statsRef} className="ct-stats-wrap" aria-label="Product statistics">
        <div className="ct-stats" role="list">
          <div className="ct-stat" role="listitem" aria-label={`Current users ${stats?.users ?? 0}`}>
            <span className="ct-stat-icon" aria-hidden>👥</span>
            <div className="ct-stat-text">
              <strong className="ct-stat-number"><StatNumber value={stats?.users ?? 0} trigger={statTrigger} /></strong>
              <span className="ct-stat-sub">current users</span>
            </div>
          </div>
          <div className="ct-stat" role="listitem" aria-label={`Scripts generated ${stats?.scripts ?? 0}`}>
            <span className="ct-stat-icon" aria-hidden>📝</span>
            <div className="ct-stat-text">
              <strong className="ct-stat-number"><StatNumber value={stats?.scripts ?? 0} trigger={statTrigger} /></strong>
              <span className="ct-stat-sub">scripts generated</span>
            </div>
          </div>
          <div className="ct-stat" role="listitem" aria-label={`Average rating ${stats?.rating ?? "—"}`}>
            <span className="ct-stat-icon" aria-hidden>⭐</span>
            <div className="ct-stat-text">
              <strong className="ct-stat-number">{stats?.rating ? `${stats.rating.toFixed(1)}` : "—"}</strong>
              <span className="ct-stat-sub">average rating</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

const CSS_STRING = `
:root{
  --ct-bg: var(--bg, #0b0114);
  --ct-fg: var(--fg, #eae6ff);
  --ct-muted: #bdb4d6;
  --ct-accent: var(--accent, #a55cff);
  --ct-border: rgba(165,92,255,0.3);
  --ct-ease: cubic-bezier(.4,0,.2,1);
}

/* Section base */
.ct-wrap{ position:relative; overflow:hidden; isolation:isolate; padding: 80px 20px; color:var(--ct-fg); background: none; opacity: 0; transform: translateY(28px); transition: opacity .8s var(--ct-ease), transform .8s var(--ct-ease); }
.ct-wrap.ct-visible{ opacity: 1; transform: translateY(0); }

/* Top feather */
.ct-top-feather{ position:absolute; inset:0 0 auto 0; height:140px; background: linear-gradient(to bottom, var(--ct-bg) 0%, rgba(0,0,0,0) 100%); pointer-events:none; z-index:0; opacity:.9; }

/* Stars container + DOM stars */
.ct-stars{ position:absolute; inset:0; pointer-events:none; z-index:0; }
.ct-star{ position:absolute; display:block; background:#ffffff; border-radius:999px; /* drop-shadow is expensive on Chrome; use box-shadow only when needed */
  box-shadow: 0 0 6px #ffffff88;
  opacity:.75; animation: twinkle 6s infinite ease-in-out; animation-play-state: paused;
}
@keyframes twinkle{ 0%,100%{opacity:.5; transform:scale(0.9)} 50%{opacity:1; transform:scale(1.1)} }
.ct-anim-on .ct-star{ animation-play-state: running; }

/* CSS starfield fallback */
.ct-stars::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(2px 2px at 20% 30%, #ffffff55 0 40%, transparent 41%) repeat,
    radial-gradient(2px 2px at 70% 60%, #ffffff35 0 40%, transparent 41%) repeat,
    radial-gradient(1px 1px at 40% 80%, #ffffff40 0 40%, transparent 41%) repeat;
  background-size: 1600px 900px, 1200px 800px, 1800px 1200px;
  opacity:.55;
}

/* Aurora (huge blurs are heavy → keep, but pause offscreen and tone down on perf-low) */
.ct-aurora{
  position:absolute; inset:-20%; z-index:0;
  background: conic-gradient(from 210deg at 50% 50%, #5b3aa999, #126b7f88, #a93a9e88, #5b3aa999);
  filter: blur(120px) saturate(0.9) brightness(0.7);
  opacity:.18; animation: drift 38s linear infinite; animation-play-state: paused; will-change: transform;
}
@keyframes drift{ 0%{transform:translate3d(0,0,0) rotate(0)} 50%{transform:translate3d(0,-2%,0) rotate(180deg)} 100%{transform:translate3d(0,0,0) rotate(360deg)} }
.ct-anim-on .ct-aurora{ animation-play-state: running; }

/* Header */
.ct-header{ position:relative; z-index:1; max-width:900px; margin:0 auto 18px; text-align:center; }
.ct-header.left{ text-align:left; margin-left:auto; margin-right:auto; }
.ct-header h2{ font-size: clamp(28px, 3.4vw, 46px); line-height:1.1; margin:0 0 10px; background: linear-gradient(90deg, #ffffff, #c7b7ff, var(--ct-accent)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ct-header p{ color:var(--ct-muted); font-size: clamp(14px, 1.5vw, 18px); margin:0; }

/* Marquee */
.ct-marquee{ position:relative; z-index:1; overflow:hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); margin: 12px auto 24px; max-width: 1000px; }
.ct-track{ display:flex; gap:14px; width:max-content; animation: scroll 22s linear infinite; animation-play-state: paused; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
.ct-anim-on .ct-track{ animation-play-state: running; }
.ct-chip{ white-space:nowrap; padding:8px 14px; border:1px solid var(--ct-border); background:rgba(255,255,255,0.05); border-radius:999px; font-size:13px; color:#e9ddff; backdrop-filter: blur(6px); }
@keyframes scroll{ from{ transform: translateX(0) } to{ transform: translateX(-50%) } }

/* Grid (masonry via columns) */
.ct-grid{ position:relative; z-index:1; column-count: 3; column-gap: 16px; max-width: 1200px; margin: 0 auto; contain: layout paint style; }
@media (max-width: 1024px){ .ct-grid{ column-count:2 } }
@media (max-width: 640px){ .ct-grid{ column-count:1 } }

/* Card */
.ct-card{
  break-inside: avoid; display:block; margin: 0 0 16px; padding:18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid var(--ct-border); border-radius:18px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
  transition: transform .25s var(--ct-ease), box-shadow .25s var(--ct-ease), border-color .25s var(--ct-ease);
  backdrop-filter: blur(6px);
  content-visibility: auto; contain-intrinsic-size: 280px 220px;
}
.ct-card:hover, .ct-card:focus{ transform: translateY(-4px) rotateZ(-.2deg); border-color: #bda1ff; box-shadow: 0 18px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(189,161,255,.18) inset; outline: none; }

.ct-card-top{ display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.ct-avatar{ width:36px; height:36px; border-radius:999px; display:grid; place-items:center; font-weight:700; font-size:14px; color:#0b0114; background: radial-gradient(circle at 30% 30%, #f8f8ff, #c0a6ff 60%, #8bd5ff); box-shadow: inset 0 0 8px rgba(255,255,255,.7); }
.ct-id{ display:flex; flex-direction:column; }
.ct-id strong{ font-size:14px; }
.ct-id span{ font-size:12px; color: var(--ct-muted); }
.ct-rating{ margin-left:auto; font-size:14px; color:#ffd166; text-shadow:0 0 8px #ffd16666; letter-spacing:1px; }

.ct-text{ color:#efeaff; font-size:15px; line-height:1.55; opacity:.95; }

/* Show more/less */
.ct-more{ position:relative; z-index:1; display:flex; justify-content:center; margin-top:14px; }
.ct-more-btn{ padding:10px 14px; background:rgba(255,255,255,0.06); border:1px solid var(--ct-border); border-radius:999px; color:var(--ct-fg); font-weight:600; cursor:pointer; backdrop-filter: blur(6px); transition: transform .15s var(--ct-ease), box-shadow .15s var(--ct-ease); }
.ct-more-btn:hover{ transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.35); }

/* Divider before stats */
.ct-divider{ position:relative; z-index:1; height:1px; max-width:1000px; margin: 24px auto 0; background: linear-gradient(90deg, rgba(0,0,0,0), rgba(165,92,255,.6), rgba(42,164,199,.6), rgba(0,0,0,0)); opacity:.8; }

/* Stats panel */
.ct-stats-wrap{
  position:relative; z-index:1; max-width:1000px; margin: 16px auto 0; padding: 16px; border-radius: 20px;
  background:
    radial-gradient(120% 120% at 10% -10%, rgba(165,92,255,.20) 0%, rgba(165,92,255,0) 40%),
    radial-gradient(120% 120% at 90% 110%, rgba(42,164,199,.18) 0%, rgba(42,164,199,0) 40%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(165,92,255,.35);
  box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 40px rgba(165,92,255,.08);
  overflow: hidden;
  content-visibility: auto; contain-intrinsic-size: 240px; contain: layout paint style;
}
/* animated shimmer ring (paused by default; runs when ct-anim-on) */
.ct-stats-wrap::before{
  content:""; position:absolute; inset:-2px; border-radius: 22px;
  background: conic-gradient(from 0deg, rgba(165,92,255,.0), rgba(165,92,255,.55), rgba(42,164,199,.55), rgba(165,92,255,.0));
  filter: blur(12px); opacity:.35; animation: ct-spin 24s linear infinite; animation-play-state: paused; pointer-events:none;
}
.ct-anim-on .ct-stats-wrap::before{ animation-play-state: running; }
.ct-stats-wrap::after{ content:""; position:absolute; inset:0; border-radius:20px; box-shadow: 0 0 0 0 rgba(165,92,255,.25) inset; animation: ct-pulse 6s ease-in-out infinite; animation-play-state: paused; pointer-events:none; }
.ct-anim-on .ct-stats-wrap::after{ animation-play-state: running; }

.ct-stats{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:14px; }
@media (max-width: 640px){ .ct-stats{ grid-template-columns: 1fr; } }

.ct-stat{
  display:flex; align-items:center; gap:14px; padding:12px 14px;
  background:rgba(255,255,255,0.04); border:1px solid rgba(199,183,255,.28); border-radius:14px;
  backdrop-filter: blur(8px); box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}
.ct-stat-icon{ width:40px; height:40px; border-radius:999px; display:grid; place-items:center; font-size:18px; color:#0b0114; background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff); box-shadow: 0 0 12px rgba(255,255,255,.25), inset 0 0 10px rgba(255,255,255,.6); animation: ct-glow 4.5s ease-in-out infinite; animation-play-state: paused; }
.ct-anim-on .ct-stat-icon{ animation-play-state: running; }

.ct-stat-text{ display:flex; flex-direction:column; line-height:1.1; }
.ct-stat-number{ font-weight:800; font-size: clamp(22px, 5vw, 40px); background: linear-gradient(90deg, #ffffff, #e9e3ff 30%, var(--ct-accent) 75%); -webkit-background-clip:text; background-clip:text; color:transparent; text-shadow: 0 0 16px rgba(165,92,255,.35); }
.ct-stat-sub{ font-size:12px; letter-spacing:.6px; text-transform: uppercase; color: var(--ct-muted); opacity:.95; }

@keyframes ct-spin{ from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
@keyframes ct-pulse{ 0%,100%{ box-shadow: inset 0 0 0 0 rgba(165,92,255,.18) } 50%{ box-shadow: inset 0 0 0 14px rgba(165,92,255,.06) } }
@keyframes ct-glow{ 0%,100%{ filter: drop-shadow(0 0 2px rgba(165,92,255,.35)) } 50%{ filter: drop-shadow(0 0 8px rgba(165,92,255,.55)) } }

/* =========================
   Performance boosts / fallbacks
   ========================= */

/* Offscreen skip */
.ct-card{ content-visibility: auto; contain-intrinsic-size: 280px 220px; }
.ct-stats-wrap{ content-visibility: auto; contain-intrinsic-size: 240px; }

/* Limit will-change to truly long-running transforms */
.ct-track, .ct-aurora{ will-change: transform; }

/* If backdrop-filter isn’t supported, keep frosted look without blur */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ct-card, .ct-stat{ backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(255,255,255,0.06); }
}

/* Adaptive lighten on weaker devices (Chrome/low-end) */
.ct-perf-low .ct-aurora{ filter: blur(60px); opacity:.12; }
.ct-perf-low .ct-stats-wrap::before{ filter: blur(6px); opacity:.25; }
.ct-perf-low .ct-stat-icon{ animation: none; }

/* Remove heavy backdrops and star glows on perf-low */
.ct-perf-low .ct-card, .ct-perf-low .ct-stat{ backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
.ct-perf-low .ct-star{ box-shadow: none; }
.ct-perf-low .ct-chip{ backdrop-filter: none; }

/* Reduced motion users: freeze everything */
@media (prefers-reduced-motion: reduce){
  .ct-track{ animation: none !important; }
  .ct-star{ animation: none !important; }
  .ct-aurora{ animation: none !important; }
  .ct-wrap{ opacity:1 !important; transform:none !important; }
  .ct-stats-wrap::before, .ct-stats-wrap::after, .ct-stat-icon{ animation: none !important; }
}
`;

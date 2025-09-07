import React, { useState } from "react";
import "./WhyUs.css";

/**
 * CreatorFlow — WhyUs (desktop table + mobile compact matrix, no horizontal scroll)
 * Layout: Hero → Prompting Strip → Comparison → Analogy → Gains → Final CTA
 */
export default function WhyUs({ onCTAClick }) {
  const comparisons = [
    { label: "Setup & effort",               pro: "Pick options. No long prompts.",  gen: "Write long prompts and rules." },
    { label: "Time to ready script",         pro: "~30–60s",                         gen: "~10–20 min of tweaks" },
    { label: "Hook first",                   pro: "Starts strong in 3s",             gen: "Slow intro" },
    { label: "Beat timing (0–3s / 3–8s / 8–12s)", pro: "Auto-timed",                gen: "Manual timing" },
    { label: "Overlays & captions",          pro: "Matches each beat",               gen: "Free text; off-beat" },
    { label: "Hook options",                 pro: "A/B hooks ready",                 gen: "Re-prompt to try more" },
    { label: "Style stays the same",         pro: "Consistent tone",                 gen: "Changes each time" },
    { label: "Screen-friendly lines",        pro: "Easy to read",                    gen: "Long paragraphs" },
    { label: "Translate well",               pro: "Simple, clear phrasing",          gen: "Idioms & bloat" },
  ];

  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="wy2">
      {/* Animated aurora layers */}
      <div className="wy2-aurora" aria-hidden="true"></div>
      <div className="wy2-aurora2" aria-hidden="true"></div>

      {/* ---------- HERO ---------- */}
      <header className="wy2-hero" id="top">
        <div className="wy2-pills">
          <span className="wy2-pill wy2-pill--brand"><Sparkle /> Why not multipurpose AI?</span>
          <span className="wy2-pill wy2-pill--ghost"><Shield /> Built for Instagram scripts</span>
        </div>

        <h1 className="wy2-h1">
          <Logo />
          <span>CreatorFlow</span>
          <i> outperforms generic chatbots on short-form content.</i>
        </h1>

        <p className="wy2-lead">
          General chatbots can write anything. <b>CreatorFlow does one job</b>—hook-first, beat-timed Instagram scripts,
          with overlays, captions, and CTAs aligned to the seconds that matter.
        </p>

        <div className="wy2-ctaRow">
          <button className="wy2-btn wy2-btn--primary wy2-btn--lg" onClick={() => onCTAClick && onCTAClick()}>
            Generate my first script — Free
          </button>
          <a href="#compare" className="wy2-btn wy2-btn--ghost wy2-btn--lg">
            See the difference <Arrow />
          </a>
        </div>
      </header>

      {/* ---------- PROMPTING STRIP ---------- */}
      <section className="wy2-strip">
        <div className="wy2-stripCol wy2-stripCol--gen">
          <div className="wy2-stripBadge"><Keyboard /> Multipurpose AI</div>
          <h3>Prompt → test → tweak → rewrite…</h3>
          <p>High prompting overhead. Structure drifts; timing is manual.</p>
        </div>
        <div className="wy2-stripCol wy2-stripCol--pro">
          <div className="wy2-stripBadge"><Wand /> CreatorFlow</div>
          <h3>Select format & tone → done</h3>
          <p>Hook-first, beat-timed script instantly. Aligned overlays & captions.</p>
        </div>
      </section>

      {/* ---------- COMPARISON ---------- */}
      <section id="compare" className="wy2-compare">
        <div className="wy2-compHead">
          <div className="wy2-compIntro">
            <div className="wy2-compKicker"><Crown /> Clear comparison</div>
            <h2 className="wy2-compTitle">CreatorFlow vs <em>ChatGPT</em></h2>
            <p className="wy2-compSub">Simple, side-by-side facts. No jargon.</p>
          </div>

          <div className="wy2-compLegend">
            <div className="wy2-legendCard wy2-legendCard--pro">
              <div className="wy2-badge wy2-badge--win"><Sparkle /> Winner</div>
              <div className="wy2-legendName"><Logo /> CreatorFlow</div>
              <div className="wy2-meter">
                <span className="wy2-meterFill wy2-meterFill--pro" style={{width:"96%"}}></span>
              </div>
              <div className="wy2-legendNote">Built for hooks, beats, overlays & captions</div>
            </div>

            <div className="wy2-legendCard wy2-legendCard--gen">
              <div className="wy2-badge wy2-badge--neutral"><Bot /> ChatGPT</div>
              <div className="wy2-legendName"><Bot /> General chatbots</div>
              <div className="wy2-meter">
                <span className="wy2-meterFill wy2-meterFill--gen" style={{width:"70%"}}></span>
              </div>
              <div className="wy2-legendNote">Great general writer; not beat-timed</div>
            </div>
          </div>
        </div>

        {/* Desktop: full 3-col table */}
        <ul className="wy2-rows wy2-rows--desktop" aria-label="Desktop comparison table">
          {comparisons.map((c, i) => (
            <Row key={i} label={c.label} pro={c.pro} gen={c.gen} />
          ))}
        </ul>

        {/* Mobile: ultra-compact matrix (no horizontal scroll, short height) */}
        <div className="wy2-matrix wy2-matrix--mobile" aria-label="Mobile comparison (compact)">
          <div className="wy2-mx-head" role="row">
            <div className="wy2-mx-what" role="columnheader">What</div>
            <div className="wy2-mx-pro" role="columnheader"><Logo /> CF</div>
            <div className="wy2-mx-gen" role="columnheader"><Bot /> GPT</div>
          </div>
          <div className="wy2-mx-body">
            {comparisons.map((c, i) => (
              <div className="wy2-mx-row" role="row" key={i}>
                <div className="wy2-mx-label" role="rowheader" title={c.label}>{c.label}</div>
                <div className="wy2-mx-dot wy2-mx-dot--pro" title={c.pro}><Check aria-hidden="true" /></div>
                <div className="wy2-mx-dot wy2-mx-dot--gen" title={c.gen}><Cross aria-hidden="true" /></div>
              </div>
            ))}
          </div>

          <button
            className="wy2-mx-toggle"
            type="button"
            onClick={() => setShowDetails(v => !v)}
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <ul className="wy2-mx-details" aria-label="Explanations">
              {comparisons.map((c, i) => (
                <li className="wy2-mx-detailItem" key={`d-${i}`}>
                  <div className="wy2-mx-detailLabel">{c.label}</div>
                  <div className="wy2-mx-detailCols">
                    <div className="wy2-mx-detailCol wy2-mx-detailCol--pro">
                      <span className="wy2-mx-detailTag">CreatorFlow</span>
                      <p>{c.pro}</p>
                    </div>
                    <div className="wy2-mx-detailCol wy2-mx-detailCol--gen">
                      <span className="wy2-mx-detailTag">ChatGPT</span>
                      <p>{c.gen}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Proof chips */}
        <div className="wy2-receipts">
          <div className="wy2-receipt">
            <div className="wy2-receiptIcon"><TrendUp /></div>
            <div className="wy2-receiptText"><b>Stronger first 3 seconds</b> with hook-first layout</div>
          </div>
          <div className="wy2-receipt">
            <div className="wy2-receiptIcon"><Clock /></div>
            <div className="wy2-receiptText"><b>~70% faster</b> from brief → post-ready script</div>
          </div>
          <div className="wy2-receipt">
            <div className="wy2-receiptIcon"><Repeat /></div>
            <div className="wy2-receiptText"><b>3× consistency</b> across tone and structure</div>
          </div>
        </div>

        <div className="wy2-compCTA">
          <div className="wy2-compCTA-copy">
            <h3>Make the first 3 seconds count.</h3>
            <p>Use CreatorFlow to publish faster with stronger hooks.</p>
          </div>
          <div className="wy2-compCTA-actions">
            <button className="wy2-btn wy2-btn--primary" onClick={() => onCTAClick && onCTAClick()}>
              Try CreatorFlow — Free
            </button>
            <a href="#top" className="wy2-btn wy2-btn--ghost">
              See a live example <Arrow />
            </a>
          </div>
        </div>
      </section>

      {/* ---------- ANALOGY ---------- */}
      <section className="wy2-analogy">
        <div className="wy2-analogyWrap">
          <div className="wy2-analogyCol wy2-analogyCol--specialist">
            <div className="wy2-analogyBadge"><Trophy /> Specialist</div>
            <h3>CreatorFlow is your <em>specialist</em>.</h3>
            <p>Like a <b>surgeon</b> or <b>race engineer</b>—trained for one job and unbeatable at it.</p>
            <ul className="wy2-analogyList">
              <li><Check /> Knows the first 3 seconds by heart</li>
              <li><Check /> Hits each beat on time</li>
              <li><Check /> Delivers ready-to-post scripts</li>
            </ul>
          </div>

          <div className="wy2-analogyCol wy2-analogyCol--generalist">
            <div className="wy2-analogyBadge wy2-analogyBadge--gen"><Toolbox /> Generalist</div>
            <h3>ChatGPT is a <em>generalist</em>.</h3>
            <p>Smart at many tasks, like a <b>GP doctor</b>—great overall, but not tuned for Instagram beats.</p>
            <ul className="wy2-analogyList wy2-analogyList--gen">
              <li><Cross /> Needs long instructions</li>
              <li><Cross /> Timing is manual</li>
              <li><Cross /> More edits before posting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- PROOF CHIPS ---------- */}
      <section className="wy2-gains">
        <Gain icon={<Clock />}  num="~70%" label="time saved" />
        <Gain icon={<Repeat />} num="3×"    label="more consistent" />
        <Gain icon={<TrendUp />} num="+25%"  label="viewer retention" />
        <Gain icon={<Calm />}   num="↓"     label="stress & rewrites" />
      </section>

      {/* ---------- FINAL CTA ---------- */}

    </main>
  );
}

/* ===== Small bits ===== */
function Row({ label, pro, gen }) {
  return (
    <li className="wy2-row">
      <div className="wy2-colLabel">{label}</div>
      <div className="wy2-colPro">
        <span className="wy2-cellIcon wy2-cellIcon--good"><Check /></span>
        <span className="wy2-cellText">{pro}</span>
      </div>
      <div className="wy2-colGen">
        <span className="wy2-cellIcon wy2-cellIcon--bad"><Cross /></span>
        <span className="wy2-cellText">{gen}</span>
      </div>
    </li>
  );
}
function Gain({ icon, num, label }) {
  // Tooltip on mobile (labels hidden in CSS)
  return (
    <div className="wy2-gain" title={label} aria-label={`${label}: ${num}`}>
      {icon}
      <span className="wy2-gainNum">{num}</span>
      <span className="wy2-gainLabel">{label}</span>
    </div>
  );
}

/* ===== Icons ===== */
function Logo(){return(<svg width="28" height="28" viewBox="0 0 24 24"><defs><linearGradient id="wy2-g" x1="0" x2="1"><stop offset="0" stopColor="#FF66C4"/><stop offset="0.5" stopColor="#8B6EF6"/><stop offset="1" stopColor="#6AA8FF"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#wy2-g)" opacity=".9"/><path d="M8 12h8M12 8v8" stroke="#0B0114" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Sparkle(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor"/></svg>);}
function Shield(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4z" fill="currentColor"/></svg>);}
function Arrow(){return(<svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Keyboard(){return(<svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor"/><path d="M6 10h2M10 10h2M14 10h2M18 10h2M6 14h8M16 14h4" stroke="#0B0114" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Wand(){return(<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="4" rx="2" fill="currentColor"/><path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/></svg>);}
function Crown(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 18l2-10 5 4 4-6 5 12H3z" fill="currentColor"/></svg>);}
function Bot(){return(<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3" fill="currentColor"/><circle cx="9" cy="13" r="1.8" fill="#0B0114"/><circle cx="15" cy="13" r="1.8" fill="#0B0114"/><path d="M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Check(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Cross(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Trophy(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 4h10v3a5 5 0 01-10 0V4zM8 20h8" stroke="currentColor" strokeWidth="2" fill="none"/></svg>);}
function Toolbox(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 9h18v10H3z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 9V6h8v3" stroke="currentColor" strokeWidth="2" fill="none"/></svg>);}
function Repeat(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 7h10l-2-2M20 17H10l2 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Clock(){return(<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/><path d="M12 8v4l3 2" stroke="#0B0114" strokeWidth="2" strokeLinecap="round"/></svg>);}
function TrendUp(){return(<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 18h16M6 14l4-4 3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function Calm(){return(<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/><path d="M9 14c1.2 1.2 4.8 1.2 6 0" stroke="#0B0114" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="10" r="1" fill="#0B0114"/><circle cx="15" cy="10" r="1" fill="#0B0114"/></svg>);}

export { }

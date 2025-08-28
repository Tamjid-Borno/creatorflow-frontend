// src/components/PrivacyPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./PrivacyPage.css";

const SECTIONS = [
  { id: "scope", title: "Scope & Definitions" },
  { id: "collect", title: "Information We Collect" },
  { id: "use", title: "How We Use Information" },
  { id: "legal", title: "Legal Bases (EEA/UK)" },
  { id: "cookies", title: "Cookies & Local Storage" },
  { id: "analytics", title: "Analytics" },
  { id: "payments", title: "Payments" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "transfers", title: "International Transfers" },
  { id: "rights", title: "Your Rights" },
  { id: "children", title: "Children’s Privacy" },
  { id: "changes", title: "Changes to this Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPage() {
  const navigate = useNavigate();
  const lastUpdated = "August 25, 2025";

  return (
    <main className="pp" role="main" aria-labelledby="pp-title">
      {/* soft star field + aurora */}
      <div className="pp-bg" aria-hidden />
      <div className="pp-stars" aria-hidden />

      {/* header */}
      <header className="pp-hero">
        <div className="pp-hero-bar">
          <button className="pp-btn pp-btn-ghost" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="pp-btn pp-btn-primary" onClick={() => window.print()}>
            Print
          </button>
        </div>

        <h1 id="pp-title" className="pp-title">Privacy Policy</h1>
        <p className="pp-subtitle">
          We respect your privacy. This policy explains what we collect, why we collect it,
          and how you can control your data.
        </p>
        <p className="pp-updated">Last updated: {lastUpdated}</p>
      </header>

      {/* layout: ToC + content */}
      <div className="pp-layout">
        {/* Table of contents */}
        <aside className="pp-toc" aria-label="Contents">
          <div className="pp-card pp-toc-card">
            <h2 className="pp-toc-title">Contents</h2>
            <ol className="pp-toc-list">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="pp-toc-num">{i + 1}.</span>
                    <span className="pp-toc-text">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Content cards */}
        <section className="pp-content">
          <article id="scope" className="pp-card">
            <h2>1) {SECTIONS[0].title}</h2>
            <p>
              This Privacy Policy applies to CreatorFlow (“we,” “us,” or “our”) and your use of our
              website, app, and related services (collectively, the “Service”). “You” means an
              individual using the Service. This document is for general information only and is not
              legal advice.
            </p>
          </article>

          <article id="collect" className="pp-card">
            <h2>2) {SECTIONS[1].title}</h2>
            <ul>
              <li><strong>Account Data:</strong> email, display name, auth identifiers from our auth provider (e.g., Firebase).</li>
              <li><strong>Usage & Content:</strong> choices you make (e.g., niches, tones), prompts/inputs, and generated outputs; logs for debugging and abuse prevention.</li>
              <li><strong>Plan & Credits:</strong> plan type (Basic/Pro/Premium), credit balances, timestamps related to refills/top-ups.</li>
              <li><strong>Payment Metadata:</strong> status and non-sensitive checkout metadata from our processor (we do <em>not</em> store full card numbers).</li>
              <li><strong>Device & Technical:</strong> IP address, device/browser type, approximate location, page views, errors.</li>
              <li><strong>Support:</strong> messages you send us (e.g., email or in-app support).</li>
            </ul>
          </article>

          <article id="use" className="pp-card">
            <h2>3) {SECTIONS[2].title}</h2>
            <ul>
              <li>Provide, secure, and improve the Service.</li>
              <li>Personalize content and recommendations.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Detect, prevent, and address fraud, abuse, and outages.</li>
              <li>Comply with legal obligations and enforce terms.</li>
            </ul>
          </article>

          <article id="legal" className="pp-card">
            <h2>4) {SECTIONS[3].title}</h2>
            <ul>
              <li><strong>Performance of a contract</strong> (to deliver the Service).</li>
              <li><strong>Legitimate interests</strong> (e.g., security, product improvement).</li>
              <li><strong>Consent</strong> (where required by law; you may withdraw at any time).</li>
              <li><strong>Legal obligations</strong> (e.g., accounting, compliance).</li>
            </ul>
          </article>

          <article id="cookies" className="pp-card">
            <h2>5) {SECTIONS[4].title}</h2>
            <p>
              We use cookies/local storage to keep you signed in, remember preferences, and measure usage.
              You can control cookies via your browser settings. Disabling some cookies may limit features.
            </p>
          </article>

          <article id="analytics" className="pp-card">
            <h2>6) {SECTIONS[5].title}</h2>
            <p>
              We use privacy-respecting analytics to understand performance and reliability. Analytics data
              is aggregated and not used to identify you directly.
            </p>
          </article>

          <article id="payments" className="pp-card">
            <h2>7) {SECTIONS[6].title}</h2>
            <p>
              Payments are processed by a third-party provider (e.g., Paddle/Stripe). We receive non-sensitive
              payment metadata and do not store full card details.
            </p>
          </article>

          <article id="retention" className="pp-card">
            <h2>8) {SECTIONS[7].title}</h2>
            <p>
              We keep information only as long as necessary for the purposes described here or as required by law.
              When no longer needed, we delete or de-identify it.
            </p>
          </article>

          <article id="security" className="pp-card">
            <h2>9) {SECTIONS[8].title}</h2>
            <p>
              We use technical and organizational measures to protect data. No method of transmission or storage
              is 100% secure; we cannot guarantee absolute security.
            </p>
          </article>

          <article id="transfers" className="pp-card">
            <h2>10) {SECTIONS[9].title}</h2>
            <p>
              If we transfer your data internationally, we use appropriate safeguards (e.g., SCCs) where required.
            </p>
          </article>

          <article id="rights" className="pp-card">
            <h2>11) {SECTIONS[10].title}</h2>
            <ul>
              <li>Access, correction, deletion, or export of your data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Lodge a complaint with your local supervisory authority.</li>
            </ul>
          </article>

          <article id="children" className="pp-card">
            <h2>12) {SECTIONS[11].title}</h2>
            <p>
              The Service is not directed to children under 13 (or 16 where applicable). If you believe a child
              provided us personal data, contact us and we’ll take appropriate action.
            </p>
          </article>

          <article id="changes" className="pp-card">
            <h2>13) {SECTIONS[12].title}</h2>
            <p>
              We may update this policy from time to time. If changes are material, we’ll notify you using
              reasonable means (e.g., in-app notice). The “Last updated” date shows when the latest version took effect.
            </p>
          </article>

          <article id="contact" className="pp-card">
            <h2>14) {SECTIONS[13].title}</h2>
            <address className="pp-address">
              <strong>CreatorFlow, Inc.</strong><br />
              <a href="mailto:support@creatorflow.app">support@creatorflow.app</a>
            </address>
          </article>
        </section>
      </div>

      {/* bottom fade to match dark footer */}
      <div className="pp-bottom-fade" aria-hidden />
    </main>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import './Facilities.css';

// Icons
import { PiMonitorPlay, PiDress, PiMaskHappy } from 'react-icons/pi';
import { CiDumbbell } from 'react-icons/ci';
import { TbBrush } from 'react-icons/tb';
import { GrTechnology } from 'react-icons/gr';
import { MdProductionQuantityLimits } from 'react-icons/md';
import { FiInfo, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Facilities = () => {
  // Reveal only once
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // If the section is already in view on mount, reveal immediately
    const rect = el.getBoundingClientRect();
    if (
      !hasTriggeredRef.current &&
      rect.top < window.innerHeight * 0.88 &&
      rect.bottom > window.innerHeight * 0.12
    ) {
      hasTriggeredRef.current = true;
      setRevealed(true);
    }

    if (hasTriggeredRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0.12) {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      {
        root: null,
        threshold: [0, 0.12, 0.5, 1],
        rootMargin: '0px 0px -20% 0px',
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cards = [
    {
      title: 'Instagram growth',
      text:
        'Create content about growing your IG audience? Use concise hooks and formats that convert.',
      icon: <PiMonitorPlay />,
      accent: '#b48cff',
    },
    {
      title: 'Fitness',
      text:
        'Workout, nutrition, or challenges—scripts tuned for watch time and saves.',
      icon: <CiDumbbell />,
      accent: '#80d3ff',
    },
    {
      title: 'Fashion',
      text:
        'Lookbooks, styling tips, and hauls with retention-first storylines.',
      icon: <PiDress />,
      accent: '#ffb3d1',
    },
    {
      title: 'Glow-up tips',
      text:
        'Skincare & beauty: clean hooks and step-by-steps your audience will follow.',
      icon: <TbBrush />,
      accent: '#9fe2bf',
    },
    {
      title: 'Dark psychology',
      text:
        'Cover persuasion topics responsibly with high-engagement structures.',
      icon: <PiMaskHappy />,
      accent: '#d6d6d6',
    },
    {
      title: 'Tech',
      text:
        'Explainers, reviews, and AI tools—scripts that simplify complexity.',
      icon: <GrTechnology />,
      accent: '#9ad0ff',
    },
    {
      title: 'Digital products',
      text:
        'Selling courses, presets, or templates? Lift CTR and sales with proven angles.',
      icon: <MdProductionQuantityLimits />,
      accent: '#ffc98f',
    },
  ];

  return (
    <section
      id="facilities"
      className={`facilities ${revealed ? 'is-visible' : ''}`}
      ref={containerRef}
      aria-labelledby="facilities-heading"
    >
      <div className="facilities__inner">
        <h2 id="facilities-heading" className="facilities__title">
          One platform, endless possibilities
        </h2>

        <p className="facilities__subtitle" id="facilities-subtitle">
          We craft creator-ready scripts across today’s highest-performing niches.
        </p>

        {/* Centered legend chip */}
        <div className="legend-chip" role="note" aria-describedby="facilities-subtitle">
          <FiInfo aria-hidden="true" />
          <span>These tiles are examples of niches we support — not buttons.</span>
        </div>

        {/* Clear call to action */}
        <div className="facilities__ctaRow" role="group" aria-label="Primary actions">
          <button
            className="fac-btn fac-btn--primary"
            onClick={() => navigate('/target')}
            aria-label="Start generating scripts"
          >
            Start generating <FiArrowRight aria-hidden="true" />
          </button>

          <button
            className="fac-btn fac-btn--ghost"
            onClick={() => navigate('/about')}
            aria-label="Learn how CreatorFlow works"
          >
            How it works
          </button>
        </div>

        <div className="cards" role="list" aria-label="Example niches">
          {cards.map((c, i) => (
            <article
              role="listitem"
              aria-label={`${c.title} — example niche`}
              className="card"
              key={c.title}
              tabIndex={-1}
              style={{
                ['--accent']: c.accent,
                ['--delay']: `${0.06 * (i + 1)}s`,
              }}
            >
              <div className="card__icon" aria-hidden="true">
                <span className="card__iconCircle">{c.icon}</span>
              </div>
              <h3 className="card__title">{c.title}</h3>
              <p className="card__text">{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;

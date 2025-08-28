import React, { useEffect, useState, useRef } from 'react';
import './Facilities.css';

// Icons
import { PiMonitorPlay, PiDress, PiMaskHappy } from 'react-icons/pi';
import { CiDumbbell } from 'react-icons/ci';
import { TbBrush } from 'react-icons/tb';
import { GrTechnology } from 'react-icons/gr';
import { MdProductionQuantityLimits } from 'react-icons/md';

const Facilities = () => {
  // Reveal only once
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

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
        // Fire once; never toggle back to hidden
        if (entry.isIntersecting || entry.intersectionRatio > 0.12) {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setRevealed(true);
            io.disconnect(); // stop observing so we don't flicker
          }
        }
      },
      {
        root: null,
        threshold: [0, 0.12, 0.5, 1],
        rootMargin: '0px 0px -20% 0px', // a little leeway at the bottom
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
        <p className="facilities__subtitle">
          We craft creator-ready scripts across today’s highest-performing niches.
        </p>

        <div className="cards" role="list">
          {cards.map((c, i) => (
            <article
              role="listitem"
              className="card"
              key={c.title}
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Dumbbell, Brain, MessageCircle, MapPin, ArrowRight, PlayCircle, ChevronRight
} from 'lucide-react';
import './Home.css';

const ACCENT = '#DC2626';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=2000&q=80';

function Navbar({ isAuthenticated, login }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
      <div className="lp-nav__inner">
        <a href="/" className="lp-nav__brand">
          <span className="lp-nav__logo">
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <span className="lp-nav__brand-name">Workout Partner</span>
        </a>

        <div className="lp-nav__links">
          <a href="#features" className="lp-nav__link">Features</a>
          <a href="#how" className="lp-nav__link">How it Works</a>
        </div>

        <div className="lp-nav__actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="lp-nav__login-btn">Dashboard</Link>
          ) : (
            <button onClick={login} className="lp-nav__login-btn">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ isAuthenticated, login }) {
  return (
    <section
      className="lp-hero"
      style={{
        backgroundImage: `linear-gradient(180deg,
          rgba(8,8,10,0.92) 0%,
          rgba(8,8,10,0.78) 30%,
          rgba(60,8,8,0.78) 70%,
          rgba(140,18,24,0.86) 100%),
          url(${HERO_IMAGE})`,
      }}
    >
      <div className="lp-hero__glow" />

      <div className="lp-hero__content">
        <div className="lp-hero__pill">
          <span className="lp-hero__pill-dot" />
          AI-powered partner matching
        </div>

        <h1 className="lp-hero__title">
          Find your ideal<br />
          <em>workout</em> partner.
        </h1>

        <p className="lp-hero__subtitle">
          AI-powered matching connects you with athletes who share your goals,
          schedule, and fitness level — so you never train alone.
        </p>

        <div className="lp-hero__cta-row">
          {isAuthenticated ? (
            <>
              <Link to="/partners/match" className="lp-btn-primary">
                Find My Match <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link to="/workouts/new" className="lp-btn-ghost">
                <PlayCircle size={18} /> Log a Workout
              </Link>
            </>
          ) : (
            <>
              <button onClick={login} className="lp-btn-primary">
                Get Started <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <a href="#features" className="lp-btn-ghost">
                <PlayCircle size={18} /> See how it works
              </a>
            </>
          )}
        </div>

        <div className="lp-hero__stats">
          {[
            { k: '12K+', v: 'Active athletes' },
            { k: '94%', v: 'Match success rate' },
            { k: '4.8★', v: 'Average rating' },
          ].map((s) => (
            <div key={s.v} className="lp-hero__stat">
              <div className="lp-hero__stat-key">{s.k}</div>
              <div className="lp-hero__stat-val">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-hero__scroll-hint">
        <span>Scroll</span>
        <span className="lp-hero__scroll-line" />
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="lp-divider">
      <div className="lp-divider__bar" />
      <div className="lp-divider__dot" />
    </div>
  );
}

const FEATURES = [
  {
    Icon: Brain,
    title: 'Smart Matching',
    body: 'Our algorithm analyzes fitness level, goals, schedule compatibility, and workout preferences to find your perfect partner.',
  },
  {
    Icon: Dumbbell,
    title: 'Workout Logging',
    body: 'Track sessions, sets, reps, and calories burned using the MET method. Share workouts with your partners.',
  },
  {
    Icon: MessageCircle,
    title: 'Real-time Chat',
    body: 'Message your workout partners directly. Coordinate schedules and stay motivated together.',
  },
  {
    Icon: MapPin,
    title: 'Gym Finder',
    body: 'Discover fitness centers near you on an interactive map, powered by OpenStreetMap data.',
  },
];

function Features() {
  return (
    <section id="features" className="lp-features">
      <div className="lp-features__inner">
        <div className="lp-section-header">
          <div className="lp-eyebrow">What you get</div>
          <h2 className="lp-section-title">
            Everything you need to train better, together.
          </h2>
          <p className="lp-section-sub">
            Built for athletes who take their training seriously — but know it's more fun with the right partner.
          </p>
        </div>

        <div className="lp-features__grid">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="lp-feature-card">
              <div className="lp-feature-card__icon">
                <Icon size={22} strokeWidth={2.25} />
              </div>
              <h3 className="lp-feature-card__title">{title}</h3>
              <p className="lp-feature-card__body">{body}</p>
              <div className="lp-feature-card__learn">
                Learn more <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', t: 'Build your profile', d: 'Set your goals, fitness level, schedule, and workout preferences in under 2 minutes.' },
  { n: '02', t: 'Get matched', d: 'Our AI surfaces compatible athletes near you with overlapping schedules.' },
  { n: '03', t: 'Train together', d: 'Coordinate sessions, log workouts, and keep each other accountable.' },
];

function HowItWorks() {
  return (
    <section id="how" className="lp-how">
      <div className="lp-how__inner">
        <div className="lp-how__header">
          <div className="lp-eyebrow">How it works</div>
          <h2 className="lp-section-title">Three steps to your next workout.</h2>
        </div>

        <div className="lp-how__grid">
          {STEPS.map(({ n, t, d }, i) => (
            <div key={n} className="lp-step">
              <div className="lp-step__num">{n}</div>
              <h3 className="lp-step__title">{t}</h3>
              <p className="lp-step__body">{d}</p>
              {i < STEPS.length - 1 && (
                <div className="lp-step__arrow">
                  <ChevronRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ isAuthenticated, login }) {
  return (
    <section className="lp-cta">
      <div className="lp-cta__glow" />
      <div className="lp-cta__inner">
        <h2 className="lp-cta__title">Ready to find your match?</h2>
        <p className="lp-cta__sub">Join 12,000+ athletes already training smarter, together.</p>
        {isAuthenticated ? (
          <Link to="/partners/match" className="lp-btn-primary lp-btn-primary--dark">
            Find My Match <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        ) : (
          <button onClick={login} className="lp-btn-primary lp-btn-primary--dark">
            Get Started — it's free <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer__inner">
        <div className="lp-footer__brand">
          <span className="lp-nav__logo">
            <Dumbbell size={16} strokeWidth={2.5} />
          </span>
          <span className="lp-footer__name">Workout Partner</span>
        </div>
        <div className="lp-footer__copy">© 2026 Workout Partner. All rights reserved.</div>
      </div>
    </footer>
  );
}

const Home = () => {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="lp-root">
      <Navbar isAuthenticated={isAuthenticated} login={login} />
      <Hero isAuthenticated={isAuthenticated} login={login} />
      <Divider />
      <Features />
      <HowItWorks />
      <CTA isAuthenticated={isAuthenticated} login={login} />
      <LandingFooter />
    </div>
  );
};

export default Home;

import React from 'react';
import { ArrowRight, Shield, Zap, Sparkles, LayoutDashboard } from 'lucide-react';

interface LandingViewProps {
  onEnterApp: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterApp }) => {
  return (
    <div className="landing-2d-container">
      {/* Navbar */}
      <nav className="landing-2d-nav">
        <div className="landing-2d-logo">
          <div className="landing-2d-logo-icon">L</div>
          <span>LifeOS</span>
        </div>
        <div className="landing-2d-nav-actions">
          <button type="button" className="btn btn-secondary" onClick={onEnterApp}>
            Log In
          </button>
          <button type="button" className="btn btn-primary" onClick={onEnterApp}>
            Open Application <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-2d-hero">
        <div className="landing-2d-badge">
          <Sparkles size={14} className="text-indigo" />
          <span>Your Personal Operating System</span>
        </div>

        <h1 className="landing-2d-title">
          Master Your Day with <span className="text-gradient">Intelligent Focus.</span>
        </h1>

        <p className="landing-2d-description">
          Plan your day, track execution progress, and build better habits with LifeOS.
          A simple, clean, and fast personal digital command center designed for real work.
        </p>

        <div className="landing-2d-cta-group">
          <button type="button" className="btn btn-primary btn-lg" onClick={onEnterApp}>
            Launch LifeOS Dashboard <ArrowRight size={18} />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="landing-2d-grid">
          <div className="landing-2d-card">
            <div className="landing-2d-card-icon"><Zap size={22} color="#6366F1" /></div>
            <h3>Today's Focus</h3>
            <p>Prioritize your immediate execution with task statuses, due times, and priority tiers.</p>
          </div>

          <div className="landing-2d-card">
            <div className="landing-2d-card-icon"><LayoutDashboard size={22} color="#8B5CF6" /></div>
            <h3>Clean 2D Dashboard</h3>
            <p>Instant clarity on completed work, remaining tasks, and overall progress metrics.</p>
          </div>

          <div className="landing-2d-card">
            <div className="landing-2d-card-icon"><Shield size={22} color="#10B981" /></div>
            <h3>FastAPI Backend Sync</h3>
            <p>Direct REST API integration backed by SQLite and PostgreSQL migration readiness.</p>
          </div>
        </div>
      </main>

      <footer className="landing-2d-footer">
        <span>© 2026 LifeOS. Built for focus and clarity.</span>
      </footer>
    </div>
  );
};

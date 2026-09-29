import React from 'react';
import { ArrowRight, Play, CheckCircle2, Zap, BarChart2, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Hero3D } from './Hero3D';

export const Hero: React.FC = () => {
  return (
    <section className="hero-section" aria-label="LifeOS Product Overview">
      {/* 3D World Environment Layer (Spans entire Hero background seamlessly) */}
      <div className="hero-3d-background-layer">
        <Hero3D />
      </div>

      {/* Foreground Hero Text Content */}
      <div className="hero-content-wrapper">
        <div className="hero-content">
          <div className="hero-badge-wrapper">
            <Badge icon={<span>✨</span>}>Your Life. Organized. Effortlessly.</Badge>
          </div>

          <h1 className="hero-title">
            LifeOS — Your <span className="text-gradient">Personal Operating System.</span>
          </h1>

          <p className="hero-description">
            Plan your day. Track your progress. Build better habits. Achieve more.
            LifeOS is your intelligent digital command center designed for daily focus.
          </p>

          {/* CTA Group */}
          <div className="hero-cta-group">
            <Button variant="primary" size="lg">
              Get Started Free <ArrowRight size={18} />
            </Button>
            <Button variant="glass" size="lg">
              <Play size={16} fill="white" /> Watch Demo
            </Button>
          </div>

          {/* Feature Highlights Chips */}
          <div className="hero-feature-chips">
            <div className="feature-chip">
              <CheckCircle2 size={14} className="feature-chip-icon" />
              <span>Smart Tasks</span>
            </div>
            <div className="feature-chip">
              <Zap size={14} className="feature-chip-icon" />
              <span>Daily Focus</span>
            </div>
            <div className="feature-chip">
              <BarChart2 size={14} className="feature-chip-icon" />
              <span>Progress Sync</span>
            </div>
            <div className="feature-chip">
              <Calendar size={14} className="feature-chip-icon" />
              <span>Personal Planning</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

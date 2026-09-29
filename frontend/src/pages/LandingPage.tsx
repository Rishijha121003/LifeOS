import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { FeatureHighlights } from '../components/landing/FeatureHighlights';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      <Navbar />

      <main id="main-content">
        <Hero />
        <FeatureHighlights />
      </main>

      <footer className="landing-footer">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p>© {new Date().getFullYear()} LifeOS. Your Personal Operating System. Built for daily focus.</p>
        </div>
      </footer>
    </div>
  );
};

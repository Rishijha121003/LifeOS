import React from 'react';
import { CheckSquare, Target, TrendingUp, CalendarDays } from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: <CheckSquare size={24} />,
      title: 'Smart Tasks',
      description: 'Organize, prioritize, and structure your daily work with instant quick-add and intelligent priorities.',
    },
    {
      icon: <Target size={24} />,
      title: 'Daily Focus',
      description: 'Zero-clutter workstation designed to eliminate distractions and keep you in deep flow state.',
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Progress Sync',
      description: 'Clear completion metrics and visual task tracking that motivate consistent daily progress.',
    },
    {
      icon: <CalendarDays size={24} />,
      title: 'Personal Planning',
      description: 'Seamless Today, Upcoming, and Completed archives for effortless daily schedule management.',
    },
  ];

  return (
    <section id="features" className="features-section" aria-label="Core Capabilities">
      <div className="features-header">
        <h2>Designed for Deep Productivity</h2>
        <p>LifeOS provides the core tools you need to organize your life and execute without mental friction.</p>
      </div>

      <div className="features-grid">
        {features.map((feature, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-icon-box">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

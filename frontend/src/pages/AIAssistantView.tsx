import React from 'react';
import { Bot, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  return (
    <div className="bento-card" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
          <Bot size={22} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            LifeOS AI Assistant
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, letterSpacing: '0.02em' }}>
            INTELLIGENT PRODUCTIVITY COPILOT
          </span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '6px', marginBottom: '24px', lineHeight: 1.5 }}>
        Your personal executive assistant for automated schedule optimization, daily debriefs, and proactive task planning.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4F46E5', marginBottom: '6px' }}>
            <Sparkles size={16} />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Smart Prioritization</h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Dynamically rearranges deadlines and high-focus deep work slots around your peak energy windows.
          </p>
        </div>

        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '6px' }}>
            <Lightbulb size={16} />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Proactive Insights</h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Identifies recurring bottlenecks, task postponement patterns, and habit consistency trends.
          </p>
        </div>

        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EA580C', marginBottom: '6px' }}>
            <MessageSquare size={16} />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Natural Language Plan</h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Convert thoughts and notes into structured daily routine proposals with duration estimates.
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', margin: 0 }}>
          AI Engine integration is coming soon. The companion UI and interface preview are ready.
        </p>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { Bot, Sparkles, X, MessageSquare, Lightbulb, Send } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Global Floating AI Assistant Button */}
      <button
        type="button"
        className="global-floating-ai-btn"
        onClick={onOpen}
        aria-label="Open LifeOS AI Assistant"
        title="Open LifeOS AI Assistant Copilot"
      >
        <div className="global-floating-ai-icon-wrapper">
          <Sparkles size={20} className="floating-sparkle-icon" />
          <Bot size={22} className="floating-bot-icon" />
        </div>
      </button>

      {/* Slide-in Right Side Drawer & Overlay */}
      {isOpen && (
        <div className="ai-drawer-overlay" onClick={onClose}>
          <div
            className="ai-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="LifeOS AI Assistant Panel"
          >
            {/* Header */}
            <div className="ai-drawer-header">
              <div className="ai-drawer-title-group">
                <div className="ai-drawer-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="ai-drawer-title">LifeOS Assistant</h3>
                  <span className="ai-drawer-subtitle">INTELLIGENT PRODUCTIVITY COPILOT</span>
                </div>
              </div>
              <button
                type="button"
                className="ai-drawer-close-btn"
                onClick={onClose}
                aria-label="Close Assistant"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="ai-drawer-body">
              <div className="ai-drawer-intro">
                <p>
                  Your personal executive assistant for automated schedule optimization, daily debriefs, and proactive task planning.
                </p>
              </div>

              {/* Feature Capabilities Cards */}
              <div className="ai-drawer-features">
                <div className="ai-drawer-feature-card">
                  <div className="ai-drawer-feature-header" style={{ color: '#4F46E5' }}>
                    <Sparkles size={16} />
                    <h4>Smart Prioritization</h4>
                  </div>
                  <p>
                    Dynamically rearranges deadlines and high-focus deep work slots around your peak energy windows.
                  </p>
                </div>

                <div className="ai-drawer-feature-card">
                  <div className="ai-drawer-feature-header" style={{ color: '#059669' }}>
                    <Lightbulb size={16} />
                    <h4>Proactive Insights</h4>
                  </div>
                  <p>
                    Identifies recurring bottlenecks, task postponement patterns, and habit consistency trends.
                  </p>
                </div>

                <div className="ai-drawer-feature-card">
                  <div className="ai-drawer-feature-header" style={{ color: '#EA580C' }}>
                    <MessageSquare size={16} />
                    <h4>Natural Language Plan</h4>
                  </div>
                  <p>
                    Convert thoughts and quick notes into structured daily routine proposals with duration estimates.
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="ai-drawer-status-banner" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}>
                <div className="ai-drawer-status-dot" style={{ background: '#6366F1', boxShadow: '0 0 6px #6366F1' }} />
                <span>AI Engine integration coming soon. Companion UI preview is ready.</span>
              </div>
            </div>

            {/* Quick Prompt Input Footer */}
            <div className="ai-drawer-footer">
              <div className="ai-drawer-input-wrapper" style={{ opacity: 0.85, background: '#F1F5F9' }}>
                <input
                  type="text"
                  placeholder="AI Assistant chat coming soon..."
                  className="ai-drawer-input"
                  disabled
                  style={{ cursor: 'not-allowed', color: '#94A3B8' }}
                />
                <button
                  type="button"
                  className="ai-drawer-send-btn"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  aria-label="Send query (Coming Soon)"
                  title="AI chat model coming soon"
                >
                  <Send size={16} />
                </button>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center', marginTop: '6px' }}>
                Conversational model integration will be connected in an upcoming release.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

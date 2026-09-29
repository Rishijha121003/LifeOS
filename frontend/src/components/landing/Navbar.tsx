import React, { useState } from 'react';
import { Layers, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo */}
        <a href="#" className="navbar-logo">
          <div className="logo-icon">
            <Layers size={20} />
          </div>
          <span>LIFE<span className="text-gradient">OS</span></span>
        </a>

        {/* Center Nav Links */}
        <nav>
          <ul className="navbar-links">
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
            <li><a href="#about" className="nav-link">About</a></li>
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button variant="primary" size="sm">
            Get Started <ArrowRight size={14} />
          </Button>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#how-it-works" className="nav-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
        <a href="#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</a>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <Button variant="ghost" style={{ width: '100%' }}>Log in</Button>
          <Button variant="primary" style={{ width: '100%' }}>Get Started Free</Button>
        </div>
      </div>
    </header>
  );
};

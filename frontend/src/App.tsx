import React, { useState } from 'react';
import { LandingView } from './pages/LandingView';
import { AppLayout } from './components/dashboard/AppLayout';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/app_ui.css';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'app'>('app');

  if (currentScreen === 'landing') {
    return <LandingView onEnterApp={() => setCurrentScreen('app')} />;
  }

  return <AppLayout onBackToLanding={() => setCurrentScreen('landing')} />;
};

export default App;

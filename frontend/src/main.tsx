import { useState, useEffect, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import Phaser from 'phaser';
import '../styles/GameStyle.css';

import LoadingScene from './pages/scenes/loadingScene.js';
import Outdoor from './pages/scenes/outdoor.js';
import LeftWing from './pages/scenes/leftWing.js';
import Hallway from './pages/scenes/hallway.js';
import Classroom from './pages/scenes/classroom.js';
import RightWing from './pages/scenes/rightWing.js';

const PasswordRecovery = lazy(() => import('./components/PasswordRecovery'));
const Manual = lazy(() => import('./components/Manual'));
const AccountRegistration = lazy(() => import('./components/AccountManagement.js'));
const ProfilePreferencesCreation = lazy(() => import('./components/ProfileManagement.js'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Result = lazy(() => import('./components/Result'));
const ProfileSetupHint = lazy(() => import('./components/ProfileSetupHint'));

declare global {
  interface Window {
    game: Phaser.Game;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1300,
  height: 600,
  input: { 
    activePointers: 3
  },
  physics: { 
    default: 'arcade',
    arcade: { 
      debug: false
    }
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: { 
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    expandParent: false
  },
  scene: [LoadingScene, Outdoor, LeftWing, Hallway, Classroom, RightWing]
};

const UIOverlay = () => {
  const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAccountRegistrationOpen, setIsAccountRegistrationOpen] = useState(false);
  const [isProfilePreferencesOpen, setIsProfilePreferencesOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isProfileSetupHintOpen, setIsProfileSetupHintOpen] = useState(false);
  const [resultData, setResultData] = useState<{
    results: any[];
    rawType: string;
    courseCode: string;
    source?: string;
  }>({ results: [], rawType: '', courseCode: '' });

  useEffect(() => {
    let titleInterval: ReturnType<typeof setInterval>;

    const handleUpdateTitle = (e: any) => {
      if (titleInterval) clearInterval(titleInterval);

      let titleText = e.detail.text + " | ";
      titleInterval = setInterval(() => {
        titleText = titleText.substring(1) + titleText.substring(0, 1);
        document.title = titleText;
      }, 250);
    };
    window.addEventListener('updateGameTitle', handleUpdateTitle);

    const handleOpenPasswordRecoveryModal = () => setIsPasswordRecoveryOpen(true);
    const handleOpenManualModal = () => setIsManualOpen(true);
    const handleOpenAccountRegistrationModal = () => setIsAccountRegistrationOpen(true);
    const handleOpenProfilePreferencesCreationModal = () => setIsProfilePreferencesOpen(true);
    const handleOpenDashboardModal = () => setIsDashboardOpen(true);
    const handleOpenLeaderboardModal = () => setIsLeaderboardOpen(true);
    const handleOpenProfileSetupHintModal = () => setIsProfileSetupHintOpen(true);
    const handleOpenResultModal = (e: Event) => {
      const custom = e as CustomEvent;
      console.log('openResultModal fired', custom.detail);
      setResultData(custom.detail);
      setIsResultOpen(true);
    };

    window.addEventListener('openPasswordRecoveryModal', handleOpenPasswordRecoveryModal);
    window.addEventListener('openManualModal', handleOpenManualModal);
    window.addEventListener('openAccountRegistrationModal', handleOpenAccountRegistrationModal);
    window.addEventListener('openProfilePreferencesCreationModal', handleOpenProfilePreferencesCreationModal);
    window.addEventListener('openDashboardModal', handleOpenDashboardModal);
    window.addEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
    window.addEventListener('openProfileSetupHintModal', handleOpenProfileSetupHintModal);
    window.addEventListener('openResultModal', handleOpenResultModal);

    const game = new Phaser.Game(config);
    window.game = game;

    return () => {
      game.destroy(true);
      if (titleInterval) clearInterval(titleInterval);

      window.removeEventListener('updateGameTitle', handleUpdateTitle);
      window.removeEventListener('openPasswordRecoveryModal', handleOpenPasswordRecoveryModal);
      window.removeEventListener('openManualModal', handleOpenManualModal);
      window.removeEventListener('openAccountRegistrationModal', handleOpenAccountRegistrationModal);
      window.removeEventListener('openProfilePreferencesCreationModal', handleOpenProfilePreferencesCreationModal);
      window.removeEventListener('openDashboardModal', handleOpenDashboardModal);
      window.removeEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
      window.removeEventListener('openProfileSetupHintModal', handleOpenProfileSetupHintModal);
      window.removeEventListener('openResultModal', handleOpenResultModal);
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <PasswordRecovery
        isOpen={isPasswordRecoveryOpen} 
        onClose={() => setIsPasswordRecoveryOpen(false)} 
      />

      <Manual
        isOpen={isManualOpen} 
        onClose={() => setIsManualOpen(false)}
      />

      <AccountRegistration
        isOpen={isAccountRegistrationOpen}
        onClose={() => setIsAccountRegistrationOpen(false)}
      />

      <ProfilePreferencesCreation
        isOpen={isProfilePreferencesOpen}
        onClose={() => setIsProfilePreferencesOpen(false)}
      />

      <Dashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />

      <Leaderboard
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
      />

      <Result
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        results={resultData.results}
        rawType={resultData.rawType}
        courseCode={resultData.courseCode}
        source={resultData.source ?? 'classroom'}
      />

      <ProfileSetupHint
        isOpen={isProfileSetupHintOpen}
        onClose={() => setIsProfileSetupHintOpen(false)}
      />
    </Suspense>
  );
};

const rootElement = document.getElementById('ui-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<UIOverlay />);
}
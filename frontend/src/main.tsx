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
const AccountManagement = lazy(() => import('./components/AccountManagement'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Result = lazy(() => import('./components/Result'));

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
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultData, setResultData] = useState<{
    results: any[];
    rawType: string;
    courseCode: string;
    source?: string;
  }>({ results: [], rawType: '', courseCode: '' });

  useEffect(() => {
    const game = new Phaser.Game(config);
    window.game = game;

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
    const handleOpenAccountManagementModal = () => setIsAccountManagementOpen(true);
    const handleOpenDashboardModal = () => setIsDashboardOpen(true);
    const handleOpenLeaderboardModal = () => setIsLeaderboardOpen(true);
    const handleOpenResultModal = (e: Event) => {
      const custom = e as CustomEvent;
      console.log('openResultModal fired', custom.detail);
      setResultData(custom.detail);
      setIsResultOpen(true);
    };

    window.addEventListener('openPasswordRecoveryModal', handleOpenPasswordRecoveryModal);
    window.addEventListener('openManualModal', handleOpenManualModal);
    window.addEventListener('openAccountManagementModal', handleOpenAccountManagementModal);
    window.addEventListener('openDashboardModal', handleOpenDashboardModal);
    window.addEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
    window.addEventListener('openResultModal', handleOpenResultModal);

    return () => {
      game.destroy(true);
      if (titleInterval) clearInterval(titleInterval);

      window.removeEventListener('updateGameTitle', handleUpdateTitle);
      window.removeEventListener('openPasswordRecoveryModal', handleOpenPasswordRecoveryModal);
      window.removeEventListener('openManualModal', handleOpenManualModal);
      window.removeEventListener('openAccountManagementModal', handleOpenAccountManagementModal);
      window.removeEventListener('openDashboardModal', handleOpenDashboardModal);
      window.removeEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
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

      <AccountManagement 
        isOpen={isAccountManagementOpen} 
        onClose={() => setIsAccountManagementOpen(false)} 
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
    </Suspense>
  );
};

const rootElement = document.getElementById('ui-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<UIOverlay />);
}
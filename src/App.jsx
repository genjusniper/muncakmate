import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Map, Backpack, Wrench, Activity, Sun, Moon, ShieldAlert, Users, LogOut, Trophy } from 'lucide-react';
import localforage from 'localforage';
import TrackerPage from './pages/TrackerPage';
import ChecklistPage from './pages/ChecklistPage';
import ToolsPage from './pages/ToolsPage';
import StravaPage from './pages/StravaPage';
import SafetyPage from './pages/SafetyPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await localforage.getItem('currentUser');
    if (user) setCurrentUser(user);
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await localforage.removeItem('currentUser');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (isLightMode) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
  }, [isLightMode]);

  if (isAuthLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary-color)' }}>Memuat...</div>;
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <Router>
      <div className="app-container">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={currentUser.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary-color)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{currentUser.username}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setIsLightMode(!isLightMode)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>
              {isLightMode ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/strava" element={<StravaPage />} />
            <Route path="/safety" element={<SafetyPage />} />
          </Routes>
        </main>

        <nav className="nav-bar" style={{ padding: '0.5rem 0', gap: '0' }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Users size={20} /> <span style={{ fontSize: '0.6rem' }}>BERANDA</span>
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Trophy size={20} /> <span style={{ fontSize: '0.6rem' }}>TOP</span>
          </NavLink>
          <NavLink to="/tracker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Map size={20} /> <span style={{ fontSize: '0.6rem' }}>GPS</span>
          </NavLink>
          <NavLink to="/checklist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Backpack size={20} /> <span style={{ fontSize: '0.6rem' }}>TAS</span>
          </NavLink>
          <NavLink to="/tools" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Wrench size={20} /> <span style={{ fontSize: '0.6rem' }}>ALAT</span>
          </NavLink>
          <NavLink to="/safety" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <ShieldAlert size={20} /> <span style={{ fontSize: '0.6rem' }}>SOS</span>
          </NavLink>
          <NavLink to="/strava" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
            <Activity size={20} /> <span style={{ fontSize: '0.6rem' }}>LOG</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;

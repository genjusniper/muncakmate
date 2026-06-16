import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Zap, Map, Car, Bike, Footprints, Clock } from 'lucide-react';
import localforage from 'localforage';

const API_BASE = import.meta.env.VITE_API_URL || '';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Gagal memuat leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const medals = ['🥇', '🥈', '🥉'];

  const periodLabels = { week: 'Minggu Ini', month: 'Bulan Ini', all: 'Sepanjang Masa' };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}>
          <Trophy size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Papan Peringkat</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Siapa petualang terhebat?</p>
      </div>

      {/* Period Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '0.4rem', borderRadius: '12px' }}>
        {Object.entries(periodLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            style={{
              flex: 1, border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', transition: 'all 0.2s',
              background: period === key ? 'var(--primary-color)' : 'transparent',
              color: period === key ? 'white' : 'var(--text-secondary)'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', height: '140px' }}>
            {/* 2nd Place */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <img src={leaderboard[1]?.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #9CA3AF', margin: '0 auto 0.5rem', display: 'block' }} alt="" />
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{leaderboard[1]?.username}</div>
              <div style={{ background: '#6B7280', height: '70px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🥈</span>
                <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>{leaderboard[1]?.total_distance} km</span>
              </div>
            </div>
            {/* 1st Place */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <img src={leaderboard[0]?.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #F59E0B', margin: '0 auto 0.5rem', display: 'block', boxShadow: '0 0 15px rgba(245,158,11,0.5)' }} alt="" />
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{leaderboard[0]?.username}</div>
              <div style={{ background: 'var(--primary-color)', height: '100px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🥇</span>
                <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 'bold' }}>{leaderboard[0]?.total_distance} km</span>
              </div>
            </div>
            {/* 3rd Place */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <img src={leaderboard[2]?.avatar} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #CD7F32', margin: '0 auto 0.5rem', display: 'block' }} alt="" />
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{leaderboard[2]?.username}</div>
              <div style={{ background: '#92400E', height: '50px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '1rem' }}>🥉</span>
                <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 'bold' }}>{leaderboard[2]?.total_distance} km</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Peringkat Lengkap</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat...</p>
        ) : leaderboard.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Belum ada data. Ayo rekam aktivitas pertamamu!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.map((user, i) => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: i === 0 ? 'rgba(252,76,2,0.05)' : 'transparent', border: i === 0 ? '1px solid rgba(252,76,2,0.15)' : 'none' }}>
                <div style={{ width: '28px', textAlign: 'center', fontWeight: 'bold', fontSize: i < 3 ? '1.2rem' : '0.9rem', color: 'var(--text-secondary)' }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <img src={user.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--card-bg)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.total_activities} Aktivitas</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.1rem' }}>{user.total_distance}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>km</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;

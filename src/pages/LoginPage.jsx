import React, { useState } from 'react';
import { Mountain, LogIn, UserPlus } from 'lucide-react';
import localforage from 'localforage';

const LoginPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Mohon isi username dan password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan.');
      }

      await localforage.setItem('currentUser', data);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'pulse 3s infinite' }}>
        <Mountain size={80} color="var(--primary-color)" />
        <h1 style={{ fontSize: '2.5rem', marginTop: '1rem', letterSpacing: '2px' }}>MuncakMate</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Eksplorasi Tanpa Batas</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
          {isRegister ? 'BUAT AKUN BARU' : 'MASUK KE AKUN'}
        </h2>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Masukkan username..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Masukkan password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button className="btn" type="submit" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'MEMPROSES...' : isRegister ? <><UserPlus size={20} /> DAFTAR</> : <><LogIn size={20} /> MASUK</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          </span>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isRegister ? 'Login di sini' : 'Daftar sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

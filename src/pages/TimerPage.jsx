import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Timer, AlarmClock } from 'lucide-react';

const TimerPage = () => {
  const [mode, setMode] = useState('stopwatch'); // stopwatch | countdown
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [laps, setLaps] = useState([]);
  const [countdownInput, setCountdownInput] = useState({ h: 0, m: 10, s: 0 });
  const [countdownMs, setCountdownMs] = useState(10 * 60 * 1000);
  const [alarmFired, setAlarmFired] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const playBeep = (times = 3) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.3);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + i * 0.4 + 0.3);
    }
  };

  const startStop = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      startTimeRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        const now = Date.now() - startTimeRef.current;
        if (mode === 'countdown') {
          const remaining = countdownMs - now;
          if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setElapsed(countdownMs);
            setAlarmFired(true);
            playBeep(5);
          } else {
            setElapsed(now);
          }
        } else {
          setElapsed(now);
        }
      }, 50);
      setRunning(true);
      setAlarmFired(false);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    setAlarmFired(false);
    if (mode === 'countdown') {
      const total = (countdownInput.h * 3600 + countdownInput.m * 60 + countdownInput.s) * 1000;
      setCountdownMs(total);
    }
  };

  const addLap = () => {
    if (running && mode === 'stopwatch') {
      setLaps(prev => [{ num: prev.length + 1, time: elapsed }, ...prev]);
    }
  };

  const updateCountdown = (field, val) => {
    const updated = { ...countdownInput, [field]: Math.max(0, Number(val)) };
    setCountdownInput(updated);
    const total = (updated.h * 3600 + updated.m * 60 + updated.s) * 1000;
    setCountdownMs(total);
  };

  const formatTime = (ms, showMs = true) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const milli = Math.floor((ms % 1000) / 10);
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${showMs ? `.${String(milli).padStart(2,'0')}` : ''}`;
  };

  const displayMs = mode === 'countdown' ? Math.max(0, countdownMs - elapsed) : elapsed;
  const progress = mode === 'countdown' && countdownMs > 0 ? ((countdownMs - displayMs) / countdownMs) * 100 : 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 4px 20px rgba(139,92,246,0.2)' }}>
          <Timer size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Timer & Stopwatch</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Untuk interval training & istirahat</p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '12px', padding: '0.4rem', marginBottom: '1.5rem' }}>
        <button onClick={() => { reset(); setMode('stopwatch'); }} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: mode === 'stopwatch' ? '#8b5cf6' : 'transparent', color: mode === 'stopwatch' ? 'white' : 'var(--text-secondary)', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }}>
          ⏱️ Stopwatch
        </button>
        <button onClick={() => { reset(); setMode('countdown'); }} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: mode === 'countdown' ? '#8b5cf6' : 'transparent', color: mode === 'countdown' ? 'white' : 'var(--text-secondary)', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }}>
          ⏳ Countdown
        </button>
      </div>

      {/* Countdown Input */}
      {mode === 'countdown' && !running && elapsed === 0 && (
        <div className="card fade-in" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Atur waktu countdown</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            {[['h', 'Jam', 23], ['m', 'Menit', 59], ['s', 'Detik', 59]].map(([field, label, max]) => (
              <React.Fragment key={field}>
                <div style={{ textAlign: 'center' }}>
                  <input type="number" min="0" max={max} value={countdownInput[field]} onChange={e => updateCountdown(field, e.target.value)} className="input-field" style={{ width: '70px', textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', padding: '0.5rem', background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
                </div>
                {field !== 's' && <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>:</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Main Timer Display */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem', background: alarmFired ? 'rgba(239,68,68,0.1)' : 'var(--card-bg)', border: alarmFired ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
        {/* Circular Progress for countdown */}
        {mode === 'countdown' && (
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 1rem' }}>
            <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="90" cy="90" r="80" fill="none" stroke={alarmFired ? '#ef4444' : '#8b5cf6'} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 80}`} strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: alarmFired ? '#ef4444' : '#8b5cf6' }}>
                {formatTime(displayMs, false)}
              </div>
              {alarmFired && <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem', animation: 'pulse 0.5s infinite' }}>⏰ WAKTU HABIS!</div>}
            </div>
          </div>
        )}

        {mode === 'stopwatch' && (
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#8b5cf6', padding: '1.5rem 0', letterSpacing: '-1px' }}>
            {formatTime(displayMs)}
          </div>
        )}

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {mode === 'stopwatch' && (
            <button onClick={addLap} disabled={!running} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: running ? 'pointer' : 'not-allowed', color: running ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: running ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={22} />
            </button>
          )}
          <button onClick={startStop} style={{ width: '72px', height: '72px', borderRadius: '50%', border: 'none', background: running ? '#ef4444' : '#8b5cf6', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${running ? '#ef444460' : '#8b5cf660'}`, transition: 'all 0.2s' }}>
            {running ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button onClick={reset} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={22} />
          </button>
        </div>
      </div>

      {/* Lap Times */}
      {laps.length > 0 && (
        <div className="card fade-in">
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>🏁 Catatan Lap</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
            {laps.map((lap, i) => (
              <div key={lap.num} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: i === 0 ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lap {lap.num}</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: i === 0 ? '#8b5cf6' : 'var(--text-primary)' }}>{formatTime(lap.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerPage;

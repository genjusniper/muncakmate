import React, { useState } from 'react';
import { Calculator, Mountain, Droplets, Clock, Flame, ChevronRight } from 'lucide-react';

const CalcPage = () => {
  const [weight, setWeight] = useState(65);
  const [distance, setDistance] = useState(5);
  const [elevation, setElevation] = useState(500);
  const [pace, setPace] = useState('moderate');
  const [result, setResult] = useState(null);

  const paceOptions = [
    { value: 'easy', label: '🐢 Santai', factor: 1.4 },
    { value: 'moderate', label: '🚶 Normal', factor: 1.0 },
    { value: 'fast', label: '🏃 Cepat', factor: 0.7 },
  ];

  const calculate = () => {
    // Naismith's Rule: 1 hour per 5km + 1 hour per 600m elevation
    const selectedPace = paceOptions.find(p => p.value === pace);
    const baseTimeHours = (distance / 5) + (elevation / 600);
    const adjustedTime = baseTimeHours * selectedPace.factor;
    const hours = Math.floor(adjustedTime);
    const minutes = Math.round((adjustedTime - hours) * 60);

    // Calories: MET * weight * time (hours)
    // Hiking MET: easy=5.3, moderate=6.0, fast=7.8
    const metValues = { easy: 5.3, moderate: 6.0, fast: 7.8 };
    const calories = Math.round(metValues[pace] * weight * adjustedTime);

    // Water: 500ml per hour + 250ml per 300m elevation
    const waterMl = Math.round((adjustedTime * 500) + (elevation / 300 * 250));

    // Descent time (about 75% of ascent)
    const descentTimeHours = adjustedTime * 0.75;
    const descentH = Math.floor(descentTimeHours);
    const descentM = Math.round((descentTimeHours - descentH) * 60);

    // Difficulty rating
    const difficulty = elevation > 1000 || distance > 10 ? 'Berat' :
                       elevation > 500 || distance > 6 ? 'Sedang' : 'Ringan';
    const diffColor = difficulty === 'Berat' ? '#ef4444' : difficulty === 'Sedang' ? '#f59e0b' : '#10b981';

    setResult({ hours, minutes, calories, waterMl, descentH, descentM, difficulty, diffColor });
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(252,76,2,0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 4px 20px rgba(252,76,2,0.2)' }}>
          <Mountain size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Kalkulator Pendakian</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Estimasi waktu, kalori & kebutuhan air</p>
      </div>

      {/* Input Card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Berat Badan */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>⚖️ Berat Badan</label>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{weight} kg</span>
            </div>
            <input type="range" min="30" max="150" value={weight} onChange={e => setWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
          </div>

          {/* Jarak */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>📏 Jarak Pendakian</label>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{distance} km</span>
            </div>
            <input type="range" min="1" max="30" value={distance} onChange={e => setDistance(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
          </div>

          {/* Elevasi */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>⛰️ Ketinggian yang Didaki</label>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{elevation} mdpl</span>
            </div>
            <input type="range" min="50" max="3500" step="50" value={elevation} onChange={e => setElevation(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
          </div>

          {/* Kecepatan */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>🏃 Kecepatan Jalan</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {paceOptions.map(p => (
                <button key={p.value} onClick={() => setPace(p.value)} style={{ flex: 1, padding: '0.6rem 0.25rem', borderRadius: '10px', border: '1px solid', borderColor: pace === p.value ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', background: pace === p.value ? 'rgba(252,76,2,0.15)' : 'transparent', color: pace === p.value ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', transition: 'all 0.2s' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={calculate} className="btn" style={{ width: '100%' }}>
            <Calculator size={18} /> HITUNG SEKARANG
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card fade-in" style={{ background: 'linear-gradient(135deg, rgba(252,76,2,0.05), rgba(0,0,0,0.2))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>📊 Hasil Estimasi</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderRadius: '20px', background: `${result.diffColor}20`, color: result.diffColor, border: `1px solid ${result.diffColor}40` }}>
              Tingkat: {result.difficulty}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Waktu Naik */}
            <div style={{ background: 'rgba(252,76,2,0.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(252,76,2,0.2)' }}>
              <Clock size={24} color="var(--primary-color)" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {result.hours > 0 ? `${result.hours}j` : ''} {result.minutes}m
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>⬆️ Waktu Naik</div>
            </div>

            {/* Waktu Turun */}
            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Clock size={24} color="#10b981" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
                {result.descentH > 0 ? `${result.descentH}j` : ''} {result.descentM}m
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>⬇️ Waktu Turun</div>
            </div>

            {/* Kalori */}
            <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Flame size={24} color="#ef4444" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ef4444' }}>{result.calories.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>🔥 Kalori Terbakar</div>
            </div>

            {/* Air */}
            <div style={{ background: 'rgba(6,182,212,0.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Droplets size={24} color="#06b6d4" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#06b6d4' }}>{(result.waterMl / 1000).toFixed(1)}L</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>💧 Kebutuhan Air</div>
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: '#f59e0b' }}>Tips:</strong> Total perjalanan PP ≈ <strong>{result.hours + result.descentH > 0 ? `${result.hours + result.descentH}j ` : ''}{Math.min(result.minutes + result.descentM, 59)}m</strong>. Bawa air minimal <strong>{Math.ceil(result.waterMl / 600)} botol</strong> (600ml). Berangkat pagi agar ada cadangan waktu!
          </div>
        </div>
      )}
    </div>
  );
};

export default CalcPage;

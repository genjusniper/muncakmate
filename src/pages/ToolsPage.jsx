import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Music, Zap, TriangleAlert, Download, Compass, Star, Moon, CloudRain, Wind, Thermometer, Radio, PhoneCall, Mic, Calculator, Timer } from 'lucide-react';
import Peer from 'peerjs';

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const dLon = (lon2 - lon1) * toRad;
  const y = Math.sin(dLon) * Math.cos(lat2 * toRad);
  const x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
            Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * toDeg;
  return (brng + 360) % 360;
}

function getGalacticCenterAzimuth(lat, lon, date) {
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const daysSince2000 = (date.getTime() - J2000) / 86400000;
    const LST = (100.46 + 0.985647 * daysSince2000 + lon + 15 * (date.getUTCHours() + date.getUTCMinutes()/60)) % 360;
    const RA = 266.4;
    const Dec = -29.0 * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    let HA = LST - RA;
    if (HA < 0) HA += 360;
    const HARad = HA * Math.PI / 180;
    const y = -Math.sin(HARad) * Math.cos(Dec);
    const x = Math.cos(latRad)*Math.sin(Dec) - Math.sin(latRad)*Math.cos(Dec)*Math.cos(HARad);
    let azimuth = Math.atan2(y, x) * 180 / Math.PI;
    return (azimuth + 360) % 360;
}

const wmoCodes = {
  0: 'Cerah', 1: 'Sebagian Berawan', 2: 'Berawan', 3: 'Mendung',
  45: 'Berkabut', 48: 'Kabut Embun', 51: 'Gerimis Ringan', 53: 'Gerimis Sedang',
  61: 'Hujan Ringan', 63: 'Hujan Sedang', 65: 'Hujan Lebat', 71: 'Salju Ringan',
  80: 'Hujan Badai Ringan', 81: 'Hujan Badai Sedang', 82: 'Hujan Badai Lebat',
  95: 'Badai Petir', 99: 'Badai Petir Ekstrem'
};

const ToolsPage = () => {
  const [sosActive, setSosActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [altitude, setAltitude] = useState('--');
  
  const [heading, setHeading] = useState(0);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [qibla, setQibla] = useState(null);
  const [milkyWay, setMilkyWay] = useState(null);
  
  // Weather State
  const [weather, setWeather] = useState(null);

  // Walkie Talkie State
  const [htActive, setHtActive] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Offline');

  // AR Camera State
  const [arActive, setArActive] = useState(false);
  const videoRef = useRef(null);
  
  const watchIdRef = useRef(null);
  const audioRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const currentCallRef = useRef(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const alt = position.coords.altitude;
          
          if (!coords.lat) {
            fetchWeather(lat, lng);
          }

          setCoords({ lat, lng });
          if (alt !== null) setAltitude(Math.floor(alt));

          setQibla(calculateBearing(lat, lng, 21.4225, 39.8262));
          setMilkyWay(getGalacticCenterAzimuth(lat, lng, new Date()));
        },
        (error) => console.error("Error GPS:", error),
        { enableHighAccuracy: true }
      );
    }

    const handleOrientation = (e) => {
      let compassHeading = e.webkitCompassHeading;
      if (compassHeading === undefined || compassHeading === null) {
        compassHeading = 360 - e.alpha; 
      }
      if (compassHeading !== null) {
        setHeading(compassHeading);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchWeather = async (lat, lng) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      const data = await res.json();
      setWeather(data.current_weather);
    } catch (e) {
      console.error("Gagal memuat cuaca", e);
    }
  };

  const initHT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      const randomId = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit radio frequency
      const peer = new Peer(`muncakmate-${randomId}`);
      
      peer.on('open', (id) => {
        setPeerId(randomId);
        setConnectionStatus('Standby');
      });

      peer.on('call', (call) => {
        call.answer(); // Don't send our stream back immediately unless we want two-way all the time
        call.on('stream', (remoteStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play();
            setConnectionStatus('Menerima Suara...');
          }
        });
        call.on('close', () => {
          setConnectionStatus('Standby');
        });
      });

      peer.on('error', (err) => {
        console.error(err);
        setConnectionStatus('Error Koneksi');
      });

      peerRef.current = peer;
      setHtActive(true);
      setConnectionStatus('Menghubungkan...');
    } catch (err) {
      alert("Akses mikrofon dibutuhkan untuk fitur HT.");
      console.error(err);
    }
  };

  const startTalking = () => {
    if (!targetId || targetId.length !== 4) {
      alert("Masukkan 4 digit frekuensi temanmu.");
      return;
    }
    if (!peerRef.current || !localStreamRef.current) return;

    setIsTalking(true);
    setConnectionStatus('Mengirim Suara...');
    
    const call = peerRef.current.call(`muncakmate-${targetId}`, localStreamRef.current);
    currentCallRef.current = call;
  };

  const stopTalking = () => {
    setIsTalking(false);
    setConnectionStatus('Standby');
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
  };

  const toggleSOS = () => {
    setSosActive(!sosActive);
    if (!sosActive) document.body.classList.add('sos-active');
    else document.body.classList.remove('sos-active');
  };

  const toggleAR = async () => {
    if (!arActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setArActive(true);
      } catch (err) {
        alert('Kamera belakang tidak dapat diakses.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setArActive(false);
    }
  };

  const sendWhatsAppSOS = () => {
    let loc = "Lokasi tidak diketahui.";
    if (coords.lat) {
      loc = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    }
    const msg = encodeURIComponent(`[MuncakMate DARURAT]\nSaya membutuhkan bantuan darurat!\nLokasi GPS saya saat ini: ${loc}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCache = () => {
    setIsCached(true);
    alert('Musik telah disimpan untuk diputar offline!');
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const compassTransform = `rotate(${-heading}deg)`;

  return (
    <div className="fade-in">
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value" style={{ fontSize: '2rem' }}>{altitude}</div>
          <div className="stat-label">MDPL</div>
        </div>
        <div className="stat-box" style={{ position: 'relative' }}>
          <div className="stat-value" style={{ fontSize: '2rem' }}>{Math.floor(heading)}°</div>
          <div className="stat-label">ARAH</div>
        </div>
      </div>

      {weather && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>CUACA LOKAL (Satelit)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <CloudRain size={20} color="var(--primary-color)" /> {wmoCodes[weather.weathercode] || 'Tidak Diketahui'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{weather.temperature}°C</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}><Thermometer size={12}/> Suhu</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{weather.windspeed} <span style={{ fontSize: '0.8rem' }}>km/j</span></div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}><Wind size={12}/> Angin</div>
            </div>
          </div>
        </div>
      )}

      {/* HT / WALKIE TALKIE PANEL */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
          <Radio size={20} /> WebRTC Walkie Talkie
        </h3>
        
        {!htActive ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Nyalakan radio HT untuk berkomunikasi dengan teman via internet.
            </p>
            <button className="btn" onClick={initHT}>NYALAKAN HT</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Frekuensi HT Kamu:</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)', letterSpacing: '4px' }}>{peerId || '...'}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: connectionStatus === 'Menerima Suara...' ? 'var(--success-color)' : 'var(--warning-color)' }}>
                Status: {connectionStatus}
              </div>
            </div>
            
            <input 
              type="number" 
              className="input-field" 
              placeholder="Masukkan Frekuensi Teman (4 Digit)" 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value.substring(0, 4))}
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', background: 'rgba(255,255,255,0.02)' }}
            />

            <button 
              className="btn" 
              onMouseDown={startTalking}
              onMouseUp={stopTalking}
              onTouchStart={(e) => { e.preventDefault(); startTalking(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopTalking(); }}
              style={{ 
                height: '100px', 
                borderRadius: '20px', 
                background: isTalking ? 'var(--primary-color)' : 'var(--card-bg)',
                border: '4px solid var(--primary-color)',
                color: isTalking ? 'white' : 'var(--primary-color)',
                fontSize: '1.2rem',
                boxShadow: isTalking ? '0 0 20px var(--primary-color)' : 'none',
                transition: 'all 0.1s'
              }}
            >
              <Mic size={32} />
              <br/>
              {isTalking ? 'SEDANG MENGIRIM...' : 'TAHAN UNTUK BICARA'}
            </button>

            <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }}></audio>
          </div>
        )}
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
          <Compass size={20} /> Radar Navigasi Pro
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Putar ponselmu. Utara selalu di Atas.
        </p>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button 
            className="btn" 
            onClick={toggleAR} 
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: arActive ? 'rgba(252,76,2,0.2)' : 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
          >
            {arActive ? 'MATIKAN KAMERA AR' : 'NYALAKAN KAMERA AR HUD'}
          </button>
        </div>

        <div style={{ 
          position: 'relative', width: '220px', height: '220px', margin: '0 auto', 
          borderRadius: '50%', background: arActive ? 'black' : 'rgba(255,255,255,0.02)', 
          border: '4px solid rgba(255,255,255,0.05)', overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
          {arActive && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
            />
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: compassTransform, transition: 'transform 0.1s linear' }}>
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', color: 'var(--danger-color)', fontWeight: 'bold' }}>U</div>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>S</div>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>B</div>
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>T</div>

            {qibla !== null && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '2px', height: '100px', 
                background: 'transparent', transformOrigin: 'bottom center',
                transform: `translate(-50%, -100%) rotate(${qibla}deg)`
              }}>
                <div style={{ position: 'absolute', top: '-15px', left: '-10px', color: '#10b981', filter: 'drop-shadow(0 0 5px rgba(16,185,129,0.8))' }}>
                  <Moon size={20} fill="#10b981" />
                </div>
              </div>
            )}

            {milkyWay !== null && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '2px', height: '100px', 
                background: 'transparent', transformOrigin: 'bottom center',
                transform: `translate(-50%, -100%) rotate(${milkyWay}deg)`
              }}>
                <div style={{ position: 'absolute', top: '-15px', left: '-10px', color: '#f59e0b', filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.8))' }}>
                  <Star size={20} fill="#f59e0b" />
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', background: 'white', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, boxShadow: '0 0 10px white' }}></div>
          <div style={{ position: 'absolute', top: '20px', left: '50%', width: '2px', height: '90px', background: 'rgba(255,255,255,0.2)', transform: 'translateX(-50%)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>{qibla ? Math.floor(qibla) + '°' : '--'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>KIBLAT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem' }}>{milkyWay ? Math.floor(milkyWay) + '°' : '--'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>BIMA SAKTI</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Lainnya</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          <Link to="/calc" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(252,76,2,0.1)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid rgba(252,76,2,0.2)' }}>
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
              <Calculator size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>Kalkulator Pendakian</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimasi waktu & kalori</div>
            </div>
          </Link>
          <Link to="/timer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ background: '#8b5cf6', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
              <Timer size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>Timer & Stopwatch</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Untuk interval training</div>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default ToolsPage;

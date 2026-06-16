import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Navigation2, Car, Map as MapIcon, Image as ImageIcon, Bike, Footprints, Heart } from 'lucide-react';
import localforage from 'localforage';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to auto-center map on new position
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
};

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

const TrackerPage = () => {
  const [mode, setMode] = useState('hike'); 
  const [isTracking, setIsTracking] = useState(false);
  
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0.00);
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null });
  const [path, setPath] = useState([]); // Array of [lat, lng]
  
  const [driverName, setDriverName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [topSpeed, setTopSpeed] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Bluetooth HR State
  const [bpm, setBpm] = useState(0);
  const bluetoothDeviceRef = useRef(null);

  const watchIdRef = useRef(null);
  const prevPosRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  
  // Track current BPM in a ref so geolocation watcher can access the latest value without causing dependency loops
  const currentBpmRef = useRef(0);
  useEffect(() => { currentBpmRef.current = bpm; }, [bpm]);

  const connectBluetoothHR = async () => {
    try {
      if (!navigator.bluetooth) {
        alert("Browser ini tidak mendukung Sensor Web Bluetooth. Gunakan Chrome di PC/Android.");
        return;
      }
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });
      bluetoothDeviceRef.current = device;
      
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e) => {
        const value = e.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        const currentBpm = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setBpm(currentBpm);
      });
      
      device.addEventListener('gattserverdisconnected', () => {
        alert("Sensor Detak Jantung terputus.");
        setBpm(0);
      });
      
    } catch (err) {
      console.error(err);
      if (err.name !== 'NotFoundError') {
        alert("Gagal koneksi Bluetooth: " + err.message);
      }
    }
  };

  useEffect(() => {
    lastMoveTimeRef.current = Date.now();
  }, [distance]);

  useEffect(() => {
    if (isTracking && duration > 0) {
      // Voice Assistant every 5 mins
      if (voiceEnabled && duration % 300 === 0) {
        if ('speechSynthesis' in window) {
          const tMins = Math.floor(duration / 60);
          const tDist = distance.toFixed(1);
          const tSpeed = Math.floor(currentSpeed);
          
          const modeNames = { hike: 'Mendaki', drive: 'Berkendara', cycle: 'Bersepeda', run: 'Lari' };
          const text = `Waktu ${modeNames[mode]} ${tMins} menit. Jarak ${tDist} kilometer. Kecepatan ${tSpeed} kilometer per jam.`;
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'id-ID';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }

      // Dead Man's Switch (Inactivity Check every minute)
      if (duration % 60 === 0) {
        const idleSeconds = (Date.now() - lastMoveTimeRef.current) / 1000;
        if (idleSeconds > 900) { // 15 minutes
          alert('PERINGATAN KESELAMATAN (Anti-Pingsan): Anda terdeteksi tidak bergerak selama 15 Menit saat pelacak aktif! Jika Anda terluka atau butuh bantuan, segera buka Tab DARURAT dan tekan SOS WhatsApp.');
          lastMoveTimeRef.current = Date.now(); // reset to avoid spam
        }
      }
    }
  }, [duration, isTracking, voiceEnabled, distance, currentSpeed, mode]);

  useEffect(() => {
    // If not tracking, try to get initial location to show on map
    if (!isTracking && !currentLocation.lat && navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
         setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
       }, () => {}, { enableHighAccuracy: true });
    }

    if (isTracking) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed, altitude } = position.coords;
            const newPos = { lat: latitude, lng: longitude };
            setCurrentLocation(newPos);
            
            // Add to path [lat, lng, alt, speed, bpm]
            const currentSpeedLog = speed !== null ? (speed * 3.6) : 0;
            const currentAltLog = altitude !== null ? altitude : 0;
            const currentBpmLog = currentBpmRef.current;
            setPath(prev => [...prev, [latitude, longitude, currentAltLog, currentSpeedLog, currentBpmLog]]);

            let calcSpeed = 0;
            let distIncrement = 0;

            if (prevPosRef.current) {
              const { lat: prevLat, lng: prevLng, timestamp: prevTime } = prevPosRef.current;
              distIncrement = calculateDistance(prevLat, prevLng, latitude, longitude);
              
              if (distIncrement > 0.002) {
                setDistance(prev => prev + distIncrement);
              } else {
                distIncrement = 0;
              }

              if (speed === null) {
                const timeDiff = (position.timestamp - prevTime) / 1000 / 3600; 
                if (timeDiff > 0 && distIncrement > 0) {
                  calcSpeed = distIncrement / timeDiff;
                }
              }
            }

            const finalSpeed = speed !== null ? (speed * 3.6) : calcSpeed;
            const displaySpeed = finalSpeed < 1.5 ? 0 : finalSpeed; 
            
            setCurrentSpeed(displaySpeed);
            setTopSpeed(prev => displaySpeed > prev ? Math.floor(displaySpeed) : prev);

            prevPosRef.current = { lat: latitude, lng: longitude, timestamp: position.timestamp };
          },
          (error) => {
            console.error('Error getting location', error);
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setCurrentSpeed(0);
      prevPosRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (durationIntervalRef.current !== null) clearInterval(durationIntervalRef.current);
    };
  }, [isTracking]);

  const toggleTracking = async () => {
    if (mode === 'drive' && !isTracking && (!driverName || !vehicle)) {
      alert('Mohon isi Nama Pengemudi dan Kendaraan terlebih dahulu.');
      return;
    }

    if (isTracking) {
      setIsTracking(false);
      const activity = {
        date: new Date().toISOString(),
        type: mode,
        duration,
        distance: distance.toFixed(2),
        synced: false,
        driver: mode === 'drive' ? driverName : undefined,
        vehicle: mode === 'drive' ? vehicle : undefined,
        topSpeed: topSpeed,
        path: path // save the path for strava export
      };
      const activities = await localforage.getItem('activities') || [];
      await localforage.setItem('activities', [...activities, activity]);
      
      const modeNames = { hike: 'Mendaki', drive: 'Berkendara', cycle: 'Sepeda', run: 'Lari' };
      alert(`Aktivitas ${modeNames[mode]} berhasil disimpan!`);
      
      setDuration(0);
      setDistance(0);
      setCurrentSpeed(0);
      setTopSpeed(0);
      setPath([]);
    } else {
      setPath([]);
      setDistance(0);
      setDuration(0);
      setIsTracking(true);
    }
  };

  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'hike': return 'MENDAKI';
      case 'drive': return 'BERKENDARA';
      case 'cycle': return 'SEPEDA';
      case 'run': return 'LARI';
      default: return '';
    }
  };

  return (
    <div className="fade-in">
      <div className="mode-toggle" style={{ gap: '0.25rem', padding: '0.25rem', overflowX: 'auto' }}>
        <div className={`mode-btn ${mode === 'hike' ? 'active' : ''}`} onClick={() => !isTracking && setMode('hike')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          <MapIcon size={16} /> Mendaki
        </div>
        <div className={`mode-btn ${mode === 'run' ? 'active' : ''}`} onClick={() => !isTracking && setMode('run')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          <Footprints size={16} /> Lari
        </div>
        <div className={`mode-btn ${mode === 'cycle' ? 'active' : ''}`} onClick={() => !isTracking && setMode('cycle')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          <Bike size={16} /> Sepeda
        </div>
        <div className={`mode-btn ${mode === 'drive' ? 'active' : ''}`} onClick={() => !isTracking && setMode('drive')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          <Car size={16} /> Kendaraan
        </div>
      </div>

      {/* INTERACTIVE MAP */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '250px', marginBottom: '1.5rem', position: 'relative', borderRadius: '16px' }}>
        {currentLocation.lat ? (
          <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[currentLocation.lat, currentLocation.lng]} />
            {path.length > 1 && <Polyline positions={path} color="#FC4C02" weight={5} />}
            <MapRecenter lat={currentLocation.lat} lng={currentLocation.lng} />
          </MapContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Mencari Sinyal GPS...
          </div>
        )}
      </div>

      <div className="card">
        {mode === 'drive' && !isTracking && duration === 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <input type="text" className="input-field" placeholder="Nama Pengemudi" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            <input type="text" className="input-field" placeholder="Kendaraan (mis. CB150R)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          </div>
        )}

        {mode === 'drive' && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: '280px', margin: '0 auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path 
                d="M 20 100 A 80 80 0 0 1 180 100" 
                fill="none" 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="12" 
                strokeLinecap="round" 
              />
              
              <path 
                d="M 20 100 A 80 80 0 0 1 180 100" 
                fill="none" 
                stroke="url(#speedGradient)" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeDasharray={Math.PI * 80} 
                strokeDashoffset={(Math.PI * 80) - ((Math.min(currentSpeed, 160) / 160) * (Math.PI * 80))} 
                style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                filter="url(#glow)"
              />
              
              <text x="100" y="85" textAnchor="middle" fill="#FFFFFF" fontSize="48" fontWeight="800" letterSpacing="-2">
                {Math.floor(currentSpeed)}
              </text>
              <text x="100" y="105" textAnchor="middle" fill="#A3A3A3" fontSize="12" fontWeight="600" letterSpacing="1">
                KM/JAM
              </text>
            </svg>
          </div>
        )}

        <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)', textAlign: 'center', fontSize: '1.2rem' }}>
          {isTracking ? 'GPS: MEREKAM...' : 'GPS: MENUNGGU'}
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{ 
              background: voiceEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent', 
              border: `1px solid ${voiceEnabled ? 'var(--success-color)' : 'var(--text-secondary)'}`, 
              color: voiceEnabled ? 'var(--success-color)' : 'var(--text-secondary)',
              padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {voiceEnabled ? '🔊 ASISTEN SUARA: ON' : '🔈 ASISTEN SUARA: OFF'}
          </button>
        </div>
        
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-box">
            <div className="stat-value">{formatTime(duration)}</div>
            <div className="stat-label">WAKTU</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{distance.toFixed(2)}</div>
            <div className="stat-label">JARAK (KM)</div>
          </div>
          <div className="stat-box" style={{ position: 'relative' }}>
            <div className="stat-value" style={{ color: bpm > 0 ? '#ef4444' : 'inherit' }}>{bpm > 0 ? bpm : '--'}</div>
            <div className="stat-label">BPM</div>
            {bpm > 0 && <Heart size={16} color="#ef4444" style={{ position: 'absolute', top: '10px', right: '10px', animation: 'pulse 1s infinite' }} />}
          </div>
        </div>

        {!isTracking && (
          <button 
            className="btn" 
            onClick={connectBluetoothHR}
            style={{ width: '100%', marginBottom: '1.5rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
          >
            <Heart size={20} /> SAMBUNGKAN SENSOR DETAK JANTUNG
          </button>
        )}

        {mode === 'drive' && (
          <div className="stat-box" style={{ marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
             <div className="stat-value" style={{ color: 'var(--warning-color)' }}>{topSpeed} km/h</div>
             <div className="stat-label" style={{ color: 'var(--warning-color)' }}>KEC. MAKSIMAL</div>
          </div>
        )}

        <button 
          className={`btn ${isTracking ? 'btn-danger' : ''}`} 
          onClick={toggleTracking}
        >
          {isTracking ? <><Square size={20} /> BERHENTI</> : <><Play size={20} /> MULAI {getModeLabel()}</>}
        </button>
      </div>
    </div>
  );
};

export default TrackerPage;

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Download, CheckCircle, Volume2, Music, Repeat, Shuffle } from 'lucide-react';

const tracks = [
  { id: 1, title: 'Acoustic Breeze', artist: 'Bensound', genre: '🎸 Santai', url: 'https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3', color: '#10b981' },
  { id: 2, title: 'Epic Mountain', artist: 'SoundHelix', genre: '🏔️ Petualangan', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', color: '#f59e0b' },
  { id: 3, title: 'Creative Minds', artist: 'Bensound', genre: '💡 Inspirasi', url: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3', color: '#8b5cf6' },
  { id: 4, title: 'Ukulele', artist: 'Bensound', genre: '🌴 Tropical', url: 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3', color: '#f97316' },
  { id: 5, title: 'Energy Sport', artist: 'SoundHelix', genre: '💪 Olahraga', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', color: '#ef4444' },
  { id: 6, title: 'Happy Rock', artist: 'Bensound', genre: '🎸 Rock', url: 'https://www.bensound.com/bensound-music/bensound-happyrock.mp3', color: '#ec4899' },
  { id: 7, title: 'Forest Walk', artist: 'SoundHelix', genre: '🌲 Alam', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', color: '#06b6d4' },
  { id: 8, title: 'Sunny Days', artist: 'Bensound', genre: '☀️ Ceria', url: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3', color: '#facc15' },
];

const MusicPage = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [cachedTracks, setCachedTracks] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef(null);

  const currentTrack = tracks[currentIdx];

  useEffect(() => {
    checkCachedTracks();
  }, []);

  const checkCachedTracks = async () => {
    if (!('caches' in window)) return;
    const cache = await caches.open('muncakmate-music-v1');
    const cached = {};
    for (const track of tracks) {
      const match = await cache.match(track.url);
      if (match) cached[track.id] = true;
    }
    setCachedTracks(cached);
  };

  const cacheTrack = async (track) => {
    if (!('caches' in window)) return;
    setDownloadProgress(prev => ({ ...prev, [track.id]: 0 }));
    try {
      const response = await fetch(track.url);
      const cache = await caches.open('muncakmate-music-v1');
      await cache.put(track.url, response);
      setCachedTracks(prev => ({ ...prev, [track.id]: true }));
      setDownloadProgress(prev => ({ ...prev, [track.id]: 100 }));
    } catch (err) {
      console.error('Gagal mengunduh:', err);
    }
  };

  const downloadAll = async () => {
    setIsDownloadingAll(true);
    for (const track of tracks) {
      if (!cachedTracks[track.id]) await cacheTrack(track);
    }
    setIsDownloadingAll(false);
    alert('Semua lagu berhasil diunduh! Sekarang bisa diputar offline 🎵');
  };

  const getAudioSrc = async (url) => {
    if ('caches' in window) {
      const cache = await caches.open('muncakmate-music-v1');
      const match = await cache.match(url);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    }
    return url;
  };

  const playTrack = async (idx) => {
    setCurrentIdx(idx);
    const src = await getAudioSrc(tracks[idx].url);
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const next = () => {
    const nextIdx = shuffle ? Math.floor(Math.random() * tracks.length) : (currentIdx + 1) % tracks.length;
    playTrack(nextIdx);
  };

  const prev = () => {
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(prevIdx);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedData = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    if (repeat) { audioRef.current.play(); }
    else next();
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const cachedCount = Object.keys(cachedTracks).length;

  return (
    <div className="fade-in" style={{ paddingBottom: '1rem' }}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedData={handleLoadedData} onEnded={handleEnded} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(${currentIdx * 30 % 255},100,200,0.15)`, color: currentTrack.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: `0 0 30px ${currentTrack.color}40`, transition: 'all 0.5s', animation: isPlaying ? 'spin 4s linear infinite' : 'none' }}>
          <Music size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Pemutar Musik Offline</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          {cachedCount}/{tracks.length} lagu tersimpan offline
        </p>
      </div>

      {/* Now Playing Card */}
      <div className="card" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.3), ${currentTrack.color}20)`, border: `1px solid ${currentTrack.color}40`, marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{currentTrack.genre.split(' ')[0]}</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{currentTrack.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{currentTrack.artist} • {currentTrack.genre}</div>
          {cachedTracks[currentTrack.id] && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <CheckCircle size={12} /> Tersedia Offline
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div onClick={handleSeek} style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', cursor: 'pointer', marginBottom: '0.5rem', position: 'relative' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: currentTrack.color, borderRadius: '2px', transition: 'width 0.5s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          <span>{formatTime(audioRef.current?.currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
          <button onClick={() => setShuffle(!shuffle)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: shuffle ? currentTrack.color : 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Shuffle size={20} />
          </button>
          <button onClick={prev} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <SkipBack size={28} />
          </button>
          <button onClick={togglePlay} style={{ width: '60px', height: '60px', borderRadius: '50%', background: currentTrack.color, border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${currentTrack.color}60`, transition: 'all 0.2s' }}>
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button onClick={next} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <SkipForward size={28} />
          </button>
          <button onClick={() => setRepeat(!repeat)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: repeat ? currentTrack.color : 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Volume2 size={16} color="var(--text-secondary)" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => { setVolume(Number(e.target.value)); if(audioRef.current) audioRef.current.volume = Number(e.target.value); }} style={{ flex: 1, accentColor: currentTrack.color }} />
        </div>
      </div>

      {/* Download All Button */}
      <button onClick={downloadAll} disabled={isDownloadingAll || cachedCount === tracks.length} className="btn" style={{ width: '100%', marginBottom: '1rem', background: cachedCount === tracks.length ? 'rgba(16,185,129,0.1)' : 'var(--primary-color)', border: cachedCount === tracks.length ? '1px solid #10b981' : 'none', color: cachedCount === tracks.length ? '#10b981' : 'white' }}>
        {cachedCount === tracks.length ? <><CheckCircle size={18} /> SEMUA LAGU TERSIMPAN OFFLINE</> : isDownloadingAll ? `MENGUNDUH... (${cachedCount}/${tracks.length})` : <><Download size={18} /> UNDUH SEMUA UNTUK OFFLINE ({tracks.length} Lagu)</>}
      </button>

      {/* Track List */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Daftar Lagu</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tracks.map((track, idx) => (
            <div key={track.id} onClick={() => playTrack(idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', background: currentIdx === idx ? `${track.color}15` : 'transparent', border: currentIdx === idx ? `1px solid ${track.color}40` : '1px solid transparent', transition: 'all 0.2s' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${track.color}20`, color: track.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {currentIdx === idx && isPlaying ? '▶' : track.genre.split(' ')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: currentIdx === idx ? 'bold' : 'normal', fontSize: '0.9rem', color: currentIdx === idx ? track.color : 'var(--text-primary)' }}>{track.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{track.artist} • {track.genre}</div>
              </div>
              {cachedTracks[track.id] ? (
                <CheckCircle size={16} color="#10b981" />
              ) : (
                <button onClick={(e) => { e.stopPropagation(); cacheTrack(track); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Download size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MusicPage;

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Plus, Trash2, Music, Repeat, Shuffle, HardDrive } from 'lucide-react';
import localforage from 'localforage';

const MusicPage = () => {
  const [tracks, setTracks] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUrlRef = useRef(null);

  useEffect(() => {
    loadTracks();
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
    };
  }, []);

  const loadTracks = async () => {
    try {
      const savedTracks = await localforage.getItem('localMusicTracks') || [];
      setTracks(savedTracks);
    } catch (err) {
      console.error('Gagal memuat lagu', err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsAdding(true);

    try {
      const currentTracks = await localforage.getItem('localMusicTracks') || [];
      const newTracks = [...currentTracks];

      for (const file of files) {
        // Hanya tambahkan jika ukurannya wajar (misal max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          alert(`File ${file.name} terlalu besar (>15MB). Silakan pilih file yang lebih kecil.`);
          continue;
        }

        const trackData = {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""), // Hapus ekstensi
          blob: file, // Menyimpan File object (File inherit dari Blob)
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        };
        newTracks.push(trackData);
      }

      await localforage.setItem('localMusicTracks', newTracks);
      setTracks(newTracks);
    } catch (err) {
      console.error('Gagal menyimpan lagu', err);
      alert('Gagal menyimpan file lagu. Pastikan memori cukup.');
    }
    
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeTrack = async (e, trackId) => {
    e.stopPropagation();
    if (!confirm('Hapus lagu ini dari aplikasi?')) return;
    
    const newTracks = tracks.filter(t => t.id !== trackId);
    await localforage.setItem('localMusicTracks', newTracks);
    setTracks(newTracks);
    
    if (tracks[currentIdx]?.id === trackId) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentIdx(0);
    } else if (tracks.findIndex(t => t.id === trackId) < currentIdx) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const playTrack = (idx) => {
    if (idx < 0 || idx >= tracks.length) return;
    setCurrentIdx(idx);
    
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
    }
    
    const track = tracks[idx];
    const url = URL.createObjectURL(track.blob);
    currentUrlRef.current = url;
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Play error:", e));
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (tracks.length === 0 || !audioRef.current || !audioRef.current.src) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(e => console.error("Play error:", e)); setIsPlaying(true); }
  };

  const next = () => {
    if (tracks.length === 0) return;
    const nextIdx = shuffle ? Math.floor(Math.random() * tracks.length) : (currentIdx + 1) % tracks.length;
    playTrack(nextIdx);
  };

  const prev = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(prevIdx);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedData = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (isPlaying) audioRef.current.play().catch(e => console.error("Play error:", e));
    }
  };

  const handleEnded = () => {
    if (repeat && audioRef.current) { 
      audioRef.current.currentTime = 0;
      audioRef.current.play(); 
    }
    else next();
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentIdx] || null;

  return (
    <div className="fade-in" style={{ paddingBottom: '1rem' }}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedData={handleLoadedData} onEnded={handleEnded} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `rgba(16,185,129,0.15)`, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: `0 0 30px rgba(16,185,129,0.4)`, transition: 'all 0.5s', animation: isPlaying ? 'spin 4s linear infinite' : 'none' }}>
          <Music size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Musik Pribadi Offline</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          {tracks.length} lagu tersimpan di memori HP
        </p>
      </div>

      {/* Notice/Tips */}
      {tracks.length === 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <HardDrive size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#f59e0b' }}>Lagu Kamu, Bebas Offline!</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Klik tombol di bawah untuk menambahkan file MP3 (Denny Caknan, NDX, dll) dari HP kamu. Lagu akan disimpan secara lokal di aplikasi ini tanpa perlu internet lagi.</p>
        </div>
      )}

      {/* Now Playing Card */}
      {currentTrack && (
        <div className="card fade-in" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.3), ${currentTrack.color}20)`, border: `1px solid ${currentTrack.color}40`, marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: `${currentTrack.color}40`, color: currentTrack.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: `0 8px 20px rgba(0,0,0,0.2)` }}>
              <Music size={40} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', wordBreak: 'break-word', padding: '0 1rem' }}>{currentTrack.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Local MP3 File</div>
          </div>

          {/* Progress Bar */}
          <div onClick={handleSeek} style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', marginBottom: '0.5rem', position: 'relative' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: currentTrack.color, borderRadius: '3px', transition: 'width 0.1s linear' }} />
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
            <button onClick={togglePlay} style={{ width: '64px', height: '64px', borderRadius: '50%', background: currentTrack.color, border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${currentTrack.color}60`, transition: 'all 0.2s' }}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button onClick={next} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <SkipForward size={28} />
            </button>
            <button onClick={() => setRepeat(!repeat)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: repeat ? currentTrack.color : 'var(--text-secondary)', transition: 'color 0.2s' }}>
              <Repeat size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Add Track Button */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="audio/*" 
        multiple 
        style={{ display: 'none' }} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isAdding} 
        className="btn" 
        style={{ width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Plus size={20} /> {isAdding ? 'Menyimpan Lagu...' : 'TAMBAHKAN LAGU DARI HP'}
      </button>

      {/* Track List */}
      {tracks.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Daftar Playlist Saya</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tracks.map((track, idx) => (
              <div 
                key={track.id} 
                onClick={() => playTrack(idx)} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', 
                  borderRadius: '10px', cursor: 'pointer', 
                  background: currentIdx === idx ? `${track.color}15` : 'transparent', 
                  border: currentIdx === idx ? `1px solid ${track.color}40` : '1px solid rgba(255,255,255,0.05)', 
                  transition: 'all 0.2s' 
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${track.color}20`, color: track.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {currentIdx === idx && isPlaying ? <div className="equalizer"><span/><span/><span/></div> : <Music size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: currentIdx === idx ? 'bold' : 'normal', fontSize: '0.85rem', color: currentIdx === idx ? track.color : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.title}
                  </div>
                </div>
                <button 
                  onClick={(e) => removeTrack(e, track.id)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem', opacity: 0.7 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .equalizer { display: flex; gap: 2px; height: 12px; align-items: flex-end; }
        .equalizer span { width: 3px; background: currentColor; animation: eq 1s ease-in-out infinite alternate; }
        .equalizer span:nth-child(2) { animation-delay: 0.2s; }
        .equalizer span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes eq { 0% { height: 20%; } 100% { height: 100%; } }
      `}</style>
    </div>
  );
};

export default MusicPage;

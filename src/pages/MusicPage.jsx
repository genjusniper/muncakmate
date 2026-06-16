import React, { useState } from 'react';
import { Music, Radio, ExternalLink, ChevronRight } from 'lucide-react';

const playlists = [
  {
    id: 'artist-denny',
    name: 'Denny Caknan',
    desc: 'Hits terbaru & terpopuler',
    emoji: '🎤',
    color: '#f59e0b',
    // Denny Caknan Spotify artist
    spotifyEmbed: 'https://open.spotify.com/embed/artist/6tdiCFuPNzrxRKCyezsCXJ?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=denny+caknan+official'
  },
  {
    id: 'playlist-hits-id',
    name: 'Top Hits Indonesia',
    desc: 'Chart #1 Indonesia minggu ini',
    emoji: '🔥',
    color: '#ef4444',
    spotifyEmbed: 'https://open.spotify.com/embed/playlist/37i9dQZEVXbObFQZ3JLcXt?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/playlist?list=PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIm'
  },
  {
    id: 'playlist-koplo',
    name: 'Dangdut Koplo Viral',
    desc: 'Koplo hits yang lagi viral',
    emoji: '💃',
    color: '#8b5cf6',
    spotifyEmbed: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8mBRYewE6or?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dangdut+koplo+viral+2024'
  },
  {
    id: 'artist-guyon',
    name: 'Guyon Waton',
    desc: 'Lagu-lagu hits Guyon Waton',
    emoji: '🎸',
    color: '#10b981',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/3VCKpPNuMBRXhAASEOzQ8v?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=guyon+waton+official'
  },
  {
    id: 'artist-happy',
    name: 'Happy Asmara',
    desc: 'Queen of Koplo',
    emoji: '👑',
    color: '#ec4899',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/0MMlkWgOBKUGHZVqbBkOdb?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=happy+asmara+official'
  },
  {
    id: 'playlist-outdoor',
    name: 'Outdoor & Hiking Vibes',
    desc: 'Semangat mendaki gunung!',
    emoji: '🏔️',
    color: '#06b6d4',
    spotifyEmbed: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=playlist+semangat+mendaki'
  },
  {
    id: 'artist-ndarboy',
    name: 'Ndarboy Genk',
    desc: 'Campursari modern hits',
    emoji: '🎶',
    color: '#f97316',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/1pMoVzK1I6W7L2MfbYiEOJ?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=ndarboy+genk+official'
  },
  {
    id: 'playlist-workout',
    name: 'Workout Energy Boost',
    desc: 'Semangat olahraga & lari!',
    emoji: '💪',
    color: '#dc2626',
    spotifyEmbed: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=workout+music+playlist+2024'
  },
  {
    id: 'artist-aftershine',
    name: 'Aftershine',
    desc: 'Hits Aftershine terpopuler',
    emoji: '🌟',
    color: '#a78bfa',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/4Tm9HGBHQQkUlRFGLJLGMR?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=aftershine+official+musik'
  },
  {
    id: 'artist-ndx',
    name: 'NDX A.K.A',
    desc: 'Raja Hip-Hop Koplo Indonesia',
    emoji: '🎤',
    color: '#facc15',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/0gPMUCuBIgM4PJc3jnpj9E?utm_source=generator&theme=0',
    youtubeUrl: 'https://www.youtube.com/results?search_query=NDX+AKA+official+musik'
  }
];

const MusicPage = () => {
  const [activePlaylist, setActivePlaylist] = useState(null);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(16,185,129,0.2)', animation: 'pulse 2s infinite' }}>
          <Music size={32} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Musik Perjalanan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Nikmati lagu favoritmu sambil mendaki ⛰️🎵
        </p>
      </div>

      {/* Tip */}
      <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span>💡</span>
        <span>Klik playlist untuk memutar langsung. Butuh aplikasi <strong style={{ color: '#1DB954' }}>Spotify</strong> untuk pengalaman terbaik.</span>
      </div>

      {/* Active Spotify Player */}
      {activePlaylist && (
        <div className="card fade-in" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{activePlaylist.emoji}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{activePlaylist.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activePlaylist.desc}</div>
              </div>
            </div>
            <button onClick={() => setActivePlaylist(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
          <iframe
            src={activePlaylist.spotifyEmbed}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Playlist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {playlists.map(pl => (
          <div
            key={pl.id}
            onClick={() => setActivePlaylist(pl.id === activePlaylist?.id ? null : pl)}
            className="card"
            style={{
              padding: '1rem',
              cursor: 'pointer',
              border: `1px solid ${activePlaylist?.id === pl.id ? pl.color : 'rgba(255,255,255,0.05)'}`,
              background: activePlaylist?.id === pl.id ? `rgba(${hexToRgb(pl.color)}, 0.08)` : 'var(--card-bg)',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Color accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: pl.color, borderRadius: '0' }} />
            
            <div style={{ paddingLeft: '0.5rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{pl.emoji}</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.2rem', lineHeight: '1.2' }}>{pl.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{pl.desc}</div>
              
              {activePlaylist?.id === pl.id && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: pl.color, fontSize: '0.7rem', fontWeight: 'bold' }}>
                  <Radio size={12} /> SEDANG DIPUTAR
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* YouTube Fallback */}
      {activePlaylist && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a
            href={activePlaylist.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#FF0000', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.05)' }}
          >
            <ExternalLink size={16} /> Buka di YouTube jika Spotify tidak tersedia
          </a>
        </div>
      )}
    </div>
  );
};

// Helper to convert hex to rgb for rgba usage
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
}

export default MusicPage;

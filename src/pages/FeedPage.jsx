import React, { useState, useEffect } from 'react';
import { Users, Map, Car, Bike, Footprints, Heart, MessageCircle, Send, X } from 'lucide-react';
import localforage from 'localforage';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';

const API_BASE = import.meta.env.VITE_API_URL || '';

const FeedPage = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentPanel, setCommentPanel] = useState(null); // activityId
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadUserAndFeed();
  }, []);

  const loadUserAndFeed = async () => {
    const user = await localforage.getItem('currentUser');
    setCurrentUser(user);
    if (user) fetchFeed(user.id);
  };

  const fetchFeed = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/feed?userId=${userId}`);
      if (res.ok) setFeed(await res.json());
    } catch (err) {
      console.error('Gagal memuat feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleKudo = async (activityId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/kudos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, activityId })
      });
      if (res.ok) {
        const { action } = await res.json();
        setFeed(feed.map(item => item.id === activityId ? {
          ...item,
          has_kudoed: action === 'added',
          kudos_count: action === 'added' ? item.kudos_count + 1 : item.kudos_count - 1
        } : item));
      }
    } catch (err) { console.error(err); }
  };

  const openComments = async (activityId) => {
    setCommentPanel(activityId);
    if (!comments[activityId]) {
      try {
        const res = await fetch(`${API_BASE}/api/comments?activityId=${activityId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(prev => ({ ...prev, [activityId]: data }));
        }
      } catch (err) { console.error(err); }
    }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !currentUser || !commentPanel) return;
    setSendingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, activityId: commentPanel, text: commentText })
      });
      if (res.ok) {
        const newComment = { user_id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar, text: commentText, date: new Date().toISOString() };
        setComments(prev => ({ ...prev, [commentPanel]: [...(prev[commentPanel] || []), newComment] }));
        setCommentText('');
      }
    } catch (err) { console.error(err); }
    setSendingComment(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'drive': return <Car size={18} />;
      case 'cycle': return <Bike size={18} />;
      case 'run': return <Footprints size={18} />;
      default: return <Map size={18} />;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'drive': return 'Berkendara';
      case 'cycle': return 'Sepeda';
      case 'run': return 'Lari';
      default: return 'Mendaki';
    }
  };

  const renderMiniMap = (path) => {
    if (!path || path.length < 2) return null;
    const positions = path.map(pt => [pt[0], pt[1]]);
    const center = positions[Math.floor(positions.length / 2)];

    return (
      <div style={{ height: '130px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', pointerEvents: 'none' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={positions} color="#FC4C02" weight={4} opacity={0.9} />
        </MapContainer>
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>Memuat Beranda...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
        <Users size={24} /> <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Beranda Komunitas</h2>
      </div>

      {feed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Belum ada aktivitas di komunitas. Ayo jadilah yang pertama!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feed.map(item => (
            <div key={item.id} className="card" style={{ padding: '1rem' }}>

              {/* User Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <img src={item.avatar} alt="avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--primary-color)' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(item.date).toLocaleString('id-ID')}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '700' }}>
                  {getIcon(item.type)} {getLabel(item.type)}
                </div>
              </div>

              {/* Mini Map */}
              {renderMiniMap(item.path)}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, borderLeft: '3px solid var(--primary-color)', paddingLeft: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Jarak</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.distance} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>km</span></div>
                </div>
                <div style={{ flex: 1, borderLeft: '3px solid var(--warning-color)', paddingLeft: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Waktu</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Math.floor(item.duration/60)} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>mnt</span></div>
                </div>
                {(item.type === 'drive' || item.type === 'cycle') && item.topSpeed > 0 && (
                  <div style={{ flex: 1, borderLeft: '3px solid var(--danger-color)', paddingLeft: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Max Speed</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.topSpeed} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>km/j</span></div>
                  </div>
                )}
              </div>

              {/* Interaction Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.75rem' }}>
                <button onClick={() => toggleKudo(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: item.has_kudoed ? '#f43f5e' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Heart size={20} fill={item.has_kudoed ? '#f43f5e' : 'none'} /> {item.kudos_count}
                </button>
                <button onClick={() => openComments(commentPanel === item.id ? null : item.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: commentPanel === item.id ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <MessageCircle size={20} /> Komentar
                </button>
              </div>

              {/* Comment Panel */}
              {commentPanel === item.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }} className="fade-in">
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {(comments[item.id] || []).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Belum ada komentar. Jadilah yang pertama!</p>
                    ) : (comments[item.id] || []).map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', gap: '0.5rem' }}>
                        <img src={c.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.4rem 0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', marginRight: '0.5rem' }}>{c.username}</span>
                          <span style={{ fontSize: '0.85rem' }}>{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Tulis komentar..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendComment()}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    />
                    <button onClick={sendComment} disabled={sendingComment} style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', color: 'white' }}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;

import React, { useState, useEffect, useRef } from 'react';
import { CloudUpload, Activity, Map, Car, Share2, Camera, Bike, Footprints, Download, ChevronDown, ChevronUp } from 'lucide-react';
import localforage from 'localforage';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StravaPage = () => {
  const [activities, setActivities] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const saved = await localforage.getItem('activities') || [];
    setActivities(saved);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const currentUser = await localforage.getItem('currentUser');
      if (!currentUser) throw new Error('Harap login terlebih dahulu.');

      const unsynced = activities.filter(a => !a.synced);
      for (const act of unsynced) {
        const payload = {
          userId: currentUser.id,
          type: act.type,
          duration: act.duration,
          distance: act.distance,
          topSpeed: act.topSpeed || 0,
          path: act.path || [],
          date: act.date,
          driver: act.driver || '',
          vehicle: act.vehicle || ''
        };
        
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Gagal sinkronisasi satu atau lebih aktivitas.');
      }

      const updated = activities.map(act => ({ ...act, synced: true }));
      await localforage.setItem('activities', updated);
      setActivities(updated);
      alert('Berhasil disinkronisasi ke Cloud / Beranda!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal sinkronisasi ke server.');
    } finally {
      setIsSyncing(false);
    }
  };

  const unsyncedCount = activities.filter(a => !a.synced).length;

  const triggerPhotoShare = (activity) => {
    setSelectedActivity(activity);
    fileInputRef.current.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedActivity) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 1080;
        canvas.height = 1080;

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const gradient = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 400, canvas.width, 400);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        ctx.font = 'bold 40px "Inter", sans-serif';
        ctx.fillStyle = '#FC4C02';
        ctx.fillText('MuncakMate', 60, canvas.height - 250);

        let typeText = 'Aktivitas';
        if (selectedActivity.type === 'drive') typeText = 'Berkendara';
        if (selectedActivity.type === 'hike') typeText = 'Mendaki';
        if (selectedActivity.type === 'cycle') typeText = 'Bersepeda';
        if (selectedActivity.type === 'run') typeText = 'Lari Pagi';

        ctx.font = 'bold 60px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(typeText, 60, canvas.height - 180);

        ctx.font = 'bold 80px "Inter", sans-serif';
        ctx.fillText(selectedActivity.distance, 60, canvas.height - 60);
        ctx.font = '30px "Inter", sans-serif';
        ctx.fillStyle = '#A3A3A3';
        ctx.fillText('Kilometer', 60, canvas.height - 30);

        const mins = Math.floor(selectedActivity.duration / 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px "Inter", sans-serif';
        ctx.fillText(mins + 'm', 420, canvas.height - 60);
        ctx.font = '30px "Inter", sans-serif';
        ctx.fillStyle = '#A3A3A3';
        ctx.fillText('Waktu', 420, canvas.height - 30);

        if (selectedActivity.type === 'drive' || selectedActivity.type === 'cycle') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 80px "Inter", sans-serif';
          ctx.fillText(selectedActivity.topSpeed, 750, canvas.height - 60);
          ctx.font = '30px "Inter", sans-serif';
          ctx.fillStyle = '#A3A3A3';
          ctx.fillText('Kec. Maks (km/h)', 750, canvas.height - 30);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `muncakmate-share-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleExportGPX = (activity) => {
    if (!activity.path || activity.path.length === 0) {
      alert("Tidak ada data GPS untuk di-ekspor.");
      return;
    }
    
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MuncakMate">\n  <trk>\n    <name>${getLabel(activity.type)} - ${new Date(activity.date).toLocaleString('id-ID')}</name>\n    <trkseg>\n`;
    
    activity.path.forEach(pt => {
      gpx += `      <trkpt lat="${pt[0]}" lon="${pt[1]}">\n        <ele>${pt[2] || 0}</ele>\n      </trkpt>\n`;
    });

    gpx += `    </trkseg>\n  </trk>\n</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `MuncakMate_${activity.type}_${Date.now()}.gpx`;
    link.href = url;
    link.click();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'drive': return <Car size={24} />;
      case 'cycle': return <Bike size={24} />;
      case 'run': return <Footprints size={24} />;
      default: return <Map size={24} />;
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

  const renderChart = (activity) => {
    if (!activity.path || activity.path.length < 2) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>Tidak cukup data grafik</div>;
    
    const isSpeedChart = activity.type === 'drive' || activity.type === 'cycle';
    const hasHeartRate = activity.path.some(pt => pt[4] && pt[4] > 0);
    
    const chartData = activity.path.map((pt, index) => ({
      index,
      alt: pt[2] || 0,
      speed: pt[3] || 0,
      bpm: pt[4] || 0
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ height: '150px', width: '100%', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>
            {isSpeedChart ? 'Grafik Kecepatan (km/j)' : 'Grafik Elevasi (mdpl)'}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: 'none', borderRadius: '8px' }} />
              <Line 
                type="monotone" 
                dataKey={isSpeedChart ? "speed" : "alt"} 
                stroke="var(--primary-color)" 
                strokeWidth={3} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {hasHeartRate && (
          <div style={{ height: '150px', width: '100%' }}>
            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '0.5rem', textAlign: 'center' }}>
              Grafik Detak Jantung (BPM)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: 'none', borderRadius: '8px' }} />
                <Line 
                  type="monotone" 
                  dataKey="bpm" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'rgba(252, 76, 2, 0.1)', color: 'var(--primary-color)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 1.5rem', boxShadow: '0 4px 12px rgba(252, 76, 2, 0.2)' 
        }}>
          <Activity size={32} />
        </div>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Integrasi Strava</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Hubungkan ke akun Strava untuk mengunggah catatan mendaki, lari, & bersepedamu secara otomatis.
        </p>
        
        {unsyncedCount > 0 ? (
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--warning-color)', marginBottom: '0.25rem' }}>{unsyncedCount} Aktivitas Tertunda</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Anda memiliki catatan offline. Sinkronkan sekarang.</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: '600' }}>Semua aktivitas telah tersinkronisasi!</p>
          </div>
        )}

        <button 
          className="btn" 
          onClick={handleSync}
          disabled={isSyncing || unsyncedCount === 0}
          style={{ opacity: (isSyncing || unsyncedCount === 0) ? 0.5 : 1 }}
        >
          {isSyncing ? 'SINKRONISASI...' : <><CloudUpload size={20} /> UNGGAH KE STRAVA</>}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Riwayat Aktivitas</h3>
        {activities.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada aktivitas yang direkam.</p>
        ) : (
          <div className="track-list" style={{ marginTop: 0 }}>
            {activities.slice().reverse().map((act, i) => (
              <div key={i} className="track-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                
                {/* Header Summary */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ marginRight: '1rem', marginTop: '0.2rem', color: 'var(--primary-color)' }}>
                    {getIcon(act.type)}
                  </div>
                  <div style={{ flex: 1 }} onClick={() => setExpandedId(expandedId === i ? null : i)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getLabel(act.type)} - {new Date(act.date).toLocaleDateString('id-ID')}
                      {expandedId === i ? <ChevronUp size={16} color="var(--text-secondary)"/> : <ChevronDown size={16} color="var(--text-secondary)"/>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Jarak:</span> {act.distance} km &nbsp;|&nbsp; <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Waktu:</span> {Math.floor(act.duration / 60)} mnt
                      {(act.type === 'drive' || act.type === 'cycle') && (
                        <div style={{ marginTop: '0.2rem' }}>
                          {act.type === 'drive' && <><span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Driver:</span> {act.driver} ({act.vehicle}) <br/></>}
                          <span style={{ color: 'var(--warning-color)', fontWeight: '600' }}>Kec. Maks: {act.topSpeed} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    {act.synced ? (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '0.25rem 0.5rem', borderRadius: '12px', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Tersinkron</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', padding: '0.25rem 0.5rem', borderRadius: '12px', fontWeight: '600', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Tertunda</span>
                    )}
                  </div>
                </div>

                {/* Expanded Details (Charts & Export) */}
                {expandedId === i && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }} className="fade-in">
                    
                    {/* Render Charts */}
                    {renderChart(act)}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => triggerPhotoShare(act)}
                        style={{ flex: 1, background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <Camera size={16} /> FOTO SHARE
                      </button>
                      <button 
                        onClick={() => handleExportGPX(act)}
                        style={{ flex: 1, background: 'var(--primary-color)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <Download size={16} /> UNDUH GPX
                      </button>
                    </div>

                  </div>
                )}
                
              </div>
            ))}
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handlePhotoUpload}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default StravaPage;

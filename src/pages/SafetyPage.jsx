import React, { useState, useEffect } from 'react';
import { TriangleAlert, HeartPulse, Stethoscope, Zap, PhoneCall, BookOpen, AlertCircle, Droplets, Flame } from 'lucide-react';
import localforage from 'localforage';

const SafetyPage = () => {
  const [sosActive, setSosActive] = useState(false);
  const [medicalId, setMedicalId] = useState({
    name: '', bloodType: '', allergies: '', emergencyContact: '', notes: ''
  });
  const [isEditingMedical, setIsEditingMedical] = useState(false);

  useEffect(() => {
    loadMedicalId();
  }, []);

  const loadMedicalId = async () => {
    const saved = await localforage.getItem('medical_id');
    if (saved) setMedicalId(saved);
  };

  const saveMedicalId = async () => {
    await localforage.setItem('medical_id', medicalId);
    setIsEditingMedical(false);
    alert('Kartu Medis berhasil disimpan.');
  };

  const toggleSOS = () => {
    setSosActive(!sosActive);
    if (!sosActive) {
      document.body.classList.add('sos-active');
      // Play high frequency sound
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime); // High pitch siren
      // Siren effect
      setInterval(() => {
        if (!sosActive) return;
        osc.frequency.setValueAtTime(osc.frequency.value === 800 ? 1200 : 800, ctx.currentTime);
      }, 500);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      window.currentSiren = { osc, ctx };
    } else {
      document.body.classList.remove('sos-active');
      if (window.currentSiren) {
        window.currentSiren.osc.stop();
        window.currentSiren.ctx.close();
        window.currentSiren = null;
      }
    }
  };

  const sendWhatsAppSOS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const msg = encodeURIComponent(`[MuncakMate DARURAT]\nSaya membutuhkan bantuan!\n\nInfo Medis:\nGol. Darah: ${medicalId.bloodType}\nAlergi: ${medicalId.allergies}\n\nLokasi saya saat ini: ${loc}`);
        window.open(`https://wa.me/${medicalId.emergencyContact}?text=${msg}`, '_blank');
      },
      () => {
        const msg = encodeURIComponent(`[MuncakMate DARURAT]\nSaya membutuhkan bantuan!\n\nInfo Medis:\nGol. Darah: ${medicalId.bloodType}\nAlergi: ${medicalId.allergies}\n\nLokasi tidak diketahui.`);
        window.open(`https://wa.me/${medicalId.emergencyContact}?text=${msg}`, '_blank');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="fade-in">
      {/* KARTU MEDIS */}
      <div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger-color)' }}>
          <Stethoscope size={20} /> Kartu Medis Darurat (Medical ID)
        </h3>
        
        {isEditingMedical ? (
          <div>
            <input type="text" className="input-field" placeholder="Nama Lengkap" value={medicalId.name} onChange={e => setMedicalId({...medicalId, name: e.target.value})} />
            <input type="text" className="input-field" placeholder="Golongan Darah (Contoh: O+)" value={medicalId.bloodType} onChange={e => setMedicalId({...medicalId, bloodType: e.target.value})} />
            <input type="text" className="input-field" placeholder="Riwayat Alergi" value={medicalId.allergies} onChange={e => setMedicalId({...medicalId, allergies: e.target.value})} />
            <input type="text" className="input-field" placeholder="No. Telepon Darurat (Contoh: 62812...)" value={medicalId.emergencyContact} onChange={e => setMedicalId({...medicalId, emergencyContact: e.target.value})} />
            <input type="text" className="input-field" placeholder="Catatan Medis Tambahan" value={medicalId.notes} onChange={e => setMedicalId({...medicalId, notes: e.target.value})} />
            <button className="btn" onClick={saveMedicalId} style={{ marginTop: '0.5rem' }}>SIMPAN KARTU MEDIS</button>
          </div>
        ) : (
          <div>
            {medicalId.name ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                <p><strong>Nama:</strong> {medicalId.name}</p>
                <p><strong>Gol. Darah:</strong> <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{medicalId.bloodType || '-'}</span></p>
                <p><strong>Alergi:</strong> {medicalId.allergies || 'Tidak ada'}</p>
                <p><strong>Kontak Darurat:</strong> {medicalId.emergencyContact || '-'}</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><em>Catatan: {medicalId.notes || '-'}</em></p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Kartu medis belum diisi. Info ini sangat penting jika terjadi kecelakaan.</p>
            )}
            <button className="btn" onClick={() => setIsEditingMedical(true)} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}>
              {medicalId.name ? 'EDIT INFO MEDIS' : 'ISI KARTU MEDIS'}
            </button>
          </div>
        )}
      </div>

      {/* TOMBOL DARURAT */}
      <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>AKSI DARURAT (SOS)</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Gunakan hanya dalam keadaan mendesak.</p>
        
        <button 
          className={`btn ${sosActive ? '' : 'btn-danger'}`} 
          onClick={toggleSOS} 
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1rem', animation: sosActive ? 'pulse 1s infinite' : 'none' }}
        >
          <Zap size={24} /> {sosActive ? 'MATIKAN SIRINE & LAMPU' : 'NYALAKAN SIRINE + LAMPU SOS'}
        </button>
        
        <button className="btn" onClick={sendWhatsAppSOS} style={{ background: '#25D366', color: 'white', width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}>
          <PhoneCall size={24} /> KIRIM LOKASI KE WHATSAPP
        </button>
      </div>

      {/* PANDUAN KESELAMATAN */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={20} color="var(--primary-color)" /> Panduan Gawat Darurat
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
              <Droplets size={18} /> Hipotermia (Kedinginan Ekstrem)
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>Segera cari tempat berlindung dari angin/hujan.</li>
              <li>Ganti semua pakaian basah dengan pakaian kering.</li>
              <li>Berikan minuman hangat manis (bukan kopi/alkohol).</li>
              <li>Gunakan *sleeping bag* dan peluk penderita untuk transfer panas tubuh (Skin-to-skin).</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--warning-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
              <TriangleAlert size={18} /> Tersesat di Hutan (S.T.O.P)
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li><strong>S</strong>top: Berhenti melangkah, tenangkan diri.</li>
              <li><strong>T</strong>hink: Pikirkan orientasi terakhir.</li>
              <li><strong>O</strong>bserve: Amati sekitar, hemat baterai & air. Nyalakan Sirine di aplikasi ini sesekali.</li>
              <li><strong>P</strong>lan: Buat *bivak* (tenda darurat) jika hari mulai gelap. Jangan berjalan di malam hari!</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--danger-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-color)', marginBottom: '0.5rem' }}>
              <AlertCircle size={18} /> Kecelakaan / Pendarahan
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>Tekan luka secara langsung dengan kain bersih.</li>
              <li>Tinggikan posisi luka di atas level jantung (jika di tangan/kaki).</li>
              <li>Jangan sembarangan memindahkan korban jika curiga ada patah tulang belakang/leher.</li>
              <li>Kirim SOS WhatsApp ke kontak darurat/SAR terdekat.</li>
            </ul>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default SafetyPage;

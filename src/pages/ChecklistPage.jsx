import React, { useState, useEffect } from 'react';
import { Tent, Flame, Droplets, Backpack, Wrench, Fuel, ShieldAlert, Bike, Footprints } from 'lucide-react';
import localforage from 'localforage';

const hikeItems = [
  { id: 'h1', text: 'Tenda & Frame', category: 'Shelter', icon: <Tent size={18} /> },
  { id: 'h2', text: 'Kantong Tidur (Sleeping Bag)', category: 'Shelter', icon: <Tent size={18} /> },
  { id: 'h3', text: 'Kompor Portabel', category: 'Cooking', icon: <Flame size={18} /> },
  { id: 'h4', text: 'Gas Kaleng', category: 'Cooking', icon: <Flame size={18} /> },
  { id: 'h5', text: 'Air Minum (3L)', category: 'Essentials', icon: <Droplets size={18} /> },
  { id: 'h6', text: 'Jas Hujan', category: 'Essentials', icon: <Backpack size={18} /> },
];

const driveItems = [
  { id: 'd1', text: 'Bensin Penuh', category: 'Vehicle', icon: <Fuel size={18} /> },
  { id: 'd2', text: 'Cek Rem Depan/Belakang', category: 'Safety', icon: <Wrench size={18} /> },
  { id: 'd3', text: 'Tekanan Angin Ban', category: 'Vehicle', icon: <Wrench size={18} /> },
  { id: 'd4', text: 'Helm & Jaket', category: 'Safety', icon: <ShieldAlert size={18} /> },
  { id: 'd5', text: 'Surat Kendaraan (STNK/SIM)', category: 'Essentials', icon: <Backpack size={18} /> },
];

const cycleItems = [
  { id: 'c1', text: 'Botol Air (Bidon)', category: 'Essentials', icon: <Droplets size={18} /> },
  { id: 'c2', text: 'Pompa Mini & Ban Dalam', category: 'Repair', icon: <Wrench size={18} /> },
  { id: 'c3', text: 'Helm Sepeda', category: 'Safety', icon: <ShieldAlert size={18} /> },
  { id: 'c4', text: 'Kacamata Hitam', category: 'Safety', icon: <Bike size={18} /> },
];

const runItems = [
  { id: 'r1', text: 'Sepatu Lari', category: 'Wear', icon: <Footprints size={18} /> },
  { id: 'r2', text: 'Jam Tangan Pintar', category: 'Tech', icon: <ShieldAlert size={18} /> },
  { id: 'r3', text: 'Air Minum Ringan', category: 'Essentials', icon: <Droplets size={18} /> },
];

const ChecklistPage = () => {
  const [items, setItems] = useState([]);
  const [listType, setListType] = useState('hike'); 

  useEffect(() => {
    loadItems(listType);
  }, [listType]);

  const loadItems = async (type) => {
    const saved = await localforage.getItem(`checklist_${type}`);
    if (saved) {
      setItems(saved);
    } else {
      let initialList = hikeItems;
      if (type === 'drive') initialList = driveItems;
      else if (type === 'cycle') initialList = cycleItems;
      else if (type === 'run') initialList = runItems;
      
      const initial = initialList.map(item => ({ ...item, checked: false }));
      setItems(initial);
      await localforage.setItem(`checklist_${type}`, initial);
    }
  };

  const toggleItem = async (id) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);
    await localforage.setItem(`checklist_${listType}`, newItems);
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.checked).length / items.length) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="mode-toggle" style={{ gap: '0.25rem', padding: '0.25rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
        <div className={`mode-btn ${listType === 'hike' ? 'active' : ''}`} onClick={() => setListType('hike')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          Mendaki
        </div>
        <div className={`mode-btn ${listType === 'run' ? 'active' : ''}`} onClick={() => setListType('run')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          Lari
        </div>
        <div className={`mode-btn ${listType === 'cycle' ? 'active' : ''}`} onClick={() => setListType('cycle')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          Sepeda
        </div>
        <div className={`mode-btn ${listType === 'drive' ? 'active' : ''}`} onClick={() => setListType('drive')} style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem' }}>
          Kendaraan
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Progres Persiapan</h3>
        <div style={{ background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
        </div>
        <p style={{ textAlign: 'right', fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
          {progress}% SIAP
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)', fontSize: '1.1rem' }}>
          {listType === 'hike' ? 'Peralatan Mendaki Wajib' : 'Pengecekan Sebelum Berangkat'}
        </h3>
        <div>
          {items.map(item => (
            <div 
              key={item.id} 
              className={`check-item ${item.checked ? 'checked' : ''}`}
              onClick={() => toggleItem(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ color: item.checked ? 'var(--text-secondary)' : 'var(--primary-color)' }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, fontWeight: '500' }}>{item.text}</div>
              <div style={{ width: '24px', height: '24px', border: `2px solid ${item.checked ? 'var(--primary-color)' : 'var(--text-secondary)'}`, borderRadius: '6px', background: item.checked ? 'var(--primary-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.checked && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistPage;

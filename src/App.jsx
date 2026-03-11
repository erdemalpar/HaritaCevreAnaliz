import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  School,
  Hospital,
  Building2,
  TrainFront,
  Bus,
  ShoppingBag,
  Info,
  ExternalLink,
  Navigation,
  Layers,
  LocateFixed,
  Map as MapIcon,
  ImageIcon,
  Landmark,
  ChevronDown,
  ChevronUp,
  X,
  Store,
  Theater,
  Ruler,
  AlertCircle,
  Shield,
  ShieldAlert,
  PlusCircle,
  CheckCircle2,
  Settings2,
  BarChart3
} from 'lucide-react';

const App = () => {
  const [coords, setCoords] = useState({ lat: 39.9570, lon: 32.8501 });
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(['education', 'health', 'government', 'cadastre', 'transport', 'shopping', 'social', 'military']);
  const [baseLayer, setBaseLayer] = useState('osm');
  const [map, setMap] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' veya 'results'

  // Manuel Nokta Durumları
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPointForm, setManualPointForm] = useState(null);

  const markersRef = useRef([]);
  const linesRef = useRef([]);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);

  const categories = [
    { id: 'education', label: 'Eğitim', icon: <School size={18} />, color: '#3b82f6', tags: '["amenity"~"school|university|kindergarten|college|library"]' },
    { id: 'health', label: 'Sağlık', icon: <Hospital size={18} />, color: '#ef4444', tags: '["amenity"~"hospital|doctors|clinic|pharmacy|dentist"]' },
    { id: 'cadastre', label: 'Tapu ve Kadastro', icon: <Landmark size={18} />, color: '#0891b2', tags: '["office"~"government|land_registry"]["government"~"cadastre|land_registry|tax"]' },
    { id: 'government', label: 'Resmi Kurumlar', icon: <Building2 size={18} />, color: '#f59e0b', tags: '["amenity"~"townhall|courthouse|police|post_office|fire_station|ministry|public_building"]["office"~"government|ministry|public_administration"]["government"~"ministry|national_assembly|administrative"]' },
    { id: 'military', label: 'Askeri Alanlar', icon: <Shield size={18} />, color: '#166534', tags: '["landuse"~"military"]["military"~"barracks|airfield|base|range"]' },
    { id: 'transport', label: 'Ulaşım (Durak/İstasyon)', icon: <Bus size={18} />, color: '#10b981', tags: '["highway"~"bus_stop|platform"]["railway"~"station|subway_entrance|stop"]["amenity"~"bus_station|taxi"]' },
    { id: 'shopping', label: 'AVM / Market', icon: <Store size={18} />, color: '#db2777', tags: '["shop"~"mall|supermarket|department_store|convenience"]' },
    { id: 'social', label: 'Sosyal / Kültürel', icon: <Theater size={18} />, color: '#8b5cf6', tags: '["amenity"~"cinema|theatre|arts_centre|community_centre|social_facility|marketplace"]["historic"~"monument|memorial"]' },
  ];

  const baseMaps = {
    osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
    satellite: { url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', attribution: '© Google Satellite' },
    hybrid: { url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', attribution: '© Google Hybrid' }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  useEffect(() => {
    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else if (window.L) {
        initMap();
      } else {
        const checkL = setInterval(() => {
          if (window.L) {
            clearInterval(checkL);
            initMap();
          }
        }, 100);
      }
    };
    const initMap = () => {
      if (!window.L) return;

      const container = window.L.DomUtil.get('map-container');
      if (container !== null) {
        container._leaflet_id = null;
      }

      if (map) {
        map.remove();
      }

      const leafletMap = window.L.map('map-container', {
        center: [coords.lat, coords.lon],
        zoom: 15,
        zoomControl: true
      });
      const initialLayer = window.L.tileLayer(baseMaps[baseLayer].url, {
        attribution: baseMaps[baseLayer].attribution
      }).addTo(leafletMap);
      tileLayerRef.current = initialLayer;

      leafletMap.on('click', (e) => {
        // En son isManualMode değerini almak için fonksiyonel güncelleme gerekebilir veya effect ile yönetilmeli
      });

      setMap(leafletMap);
    };
    loadLeaflet();

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []);

  // Click handler'ı mod değiştikçe güncelle
  useEffect(() => {
    if (!map) return;
    map.off('click');
    map.on('click', (e) => {
      if (isManualMode) {
        setManualPointForm({ lat: e.latlng.lat, lon: e.latlng.lng, name: '', type: '', catId: 'government' });
      } else {
        setCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    });
  }, [map, isManualMode]);

  useEffect(() => {
    if (map && tileLayerRef.current && window.L) {
      tileLayerRef.current.setUrl(baseMaps[baseLayer].url);
      tileLayerRef.current.options.attribution = baseMaps[baseLayer].attribution;
    }
  }, [baseLayer, map]);

  useEffect(() => {
    if (!map || !window.L) return;
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }
    circleRef.current = window.L.circle([coords.lat, coords.lon], {
      radius: radius,
      color: baseLayer === 'osm' ? '#3b82f6' : '#fff',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: baseLayer !== 'osm' ? '5, 5' : null
    }).addTo(map);
    map.panTo([coords.lat, coords.lon]);
  }, [coords, radius, map, baseLayer]);

  const identifyCategory = (tags) => {
    const name = tags.name || "";
    if (tags.office?.match(/land_registry/) || tags.government?.match(/cadastre|land_registry/) || name.match(/Tapu|Kadastro/i))
      return categories.find(c => c.id === 'cadastre');
    if (tags.amenity?.match(/school|university|kindergarten|college|library/))
      return categories.find(c => c.id === 'education');
    if (tags.amenity?.match(/hospital|doctors|clinic|pharmacy|dentist/))
      return categories.find(c => c.id === 'health');
    if (tags.landuse === 'military' || tags.military || name.match(/Kışla|Askeri|Orduevi|Komutanlık/i))
      return categories.find(c => c.id === 'military');
    if (tags.amenity?.match(/townhall|courthouse|police|post_office|fire_station|ministry|public_building/) ||
      tags.office?.match(/government|ministry|public_administration/) ||
      tags.government?.match(/ministry|national_assembly|administrative/) ||
      name.match(/Bakanlığı|Müdürlüğü|Valiliği|Kaymakamlığı|Belediyesi|Meclis|TBMM/i))
      return categories.find(c => c.id === 'government');
    if (tags.public_transport || tags.highway?.match(/bus_stop|platform/) || tags.railway?.match(/subway|station|stop/) || tags.amenity === 'bus_station')
      return categories.find(c => c.id === 'transport');
    if (tags.shop?.match(/mall|supermarket|department_store|convenience/))
      return categories.find(c => c.id === 'shopping');
    if (tags.amenity?.match(/cinema|theatre|arts_centre|community_centre|social_facility|marketplace/) ||
      tags.historic?.match(/monument|memorial/) ||
      name.match(/Anıtkabir|Anıt/i))
      return categories.find(c => c.id === 'social');
    return { id: 'other', color: '#64748b', label: 'Diğer' };
  };

  const createCustomIcon = (color, distance) => {
    return window.L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="background-color: ${color}; width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>
          <div style="margin-top: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1px 5px; font-weight: 800; font-size: 10px; color: #1e293b; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap;">
            ${distance}m
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 9]
    });
  };

  const searchPOIs = async () => {
    if (!window.L || !map) return;
    setLoading(true);
    setErrorMsg(null);
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    linesRef.current.forEach(l => map.removeLayer(l));
    linesRef.current = [];

    const selectedTags = categories
      .filter(c => selectedCategories.includes(c.id))
      .map(c => `node${c.tags}(around:${radius},${coords.lat},${coords.lon});way${c.tags}(around:${radius},${coords.lat},${coords.lon});rel${c.tags}(around:${radius},${coords.lat},${coords.lon});`)
      .join('');

    const query = `[out:json][timeout:45];(${selectedTags});out body center;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter'
    ];

    let success = false;
    for (const endpoint of endpoints) {
      if (success) break;
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!data || !data.elements) throw new Error("Veri formatı hatalı");

        const processedResults = data.elements.map(el => {
          const catInfo = identifyCategory(el.tags || {});
          const lat = el.lat || (el.center && el.center.lat);
          const lon = el.lon || (el.center && el.center.lon);
          const distance = calculateDistance(coords.lat, coords.lon, lat, lon);
          return {
            id: el.id,
            name: el.tags.name || el.tags.operator || el.tags.description || "İsimsiz Yapı",
            type: el.tags.amenity || el.tags.office || el.tags.shop || el.tags.highway || "Bina",
            lat, lon, distance, category: catInfo
          };
        }).filter(el => el.lat && el.lon);

        // Tekrar edenleri temizle
        const uniqueResults = Array.from(new Map(processedResults.map(item => [item.name + item.lat + item.lon, item])).values());
        uniqueResults.sort((a, b) => a.distance - b.distance);

        setResults(uniqueResults);

        uniqueResults.forEach(item => {
          const marker = window.L.marker([item.lat, item.lon], {
            icon: createCustomIcon(item.category.color, item.distance)
          })
            .bindPopup(`
              <div style="min-width: 220px; font-family: 'Segoe UI', sans-serif; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span style="background-color: ${item.category.color}; color: white; padding: 3px 10px; border-radius: 15px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
                    ${item.category.label}
                  </span>
                  <span style="font-size: 11px; font-weight: bold; color: #64748b;">${item.distance}m</span>
                </div>
                <strong style="color: #1e293b; font-size: 15px; display: block; margin-bottom: 6px; line-height: 1.4;">${item.name}</strong>
                <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">${item.type}</p>
                <a href="https://parselsorgu.tkgm.gov.tr/#ara/cografi/${item.lat}/${item.lon}" 
                   target="_blank" 
                   style="background: #10b981; color: white; padding: 10px; border-radius: 8px; font-size: 12px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 800;">
                  TKGM SORGULA <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            `)
            .addTo(map);
          markersRef.current.push(marker);

          const line = window.L.polyline([[coords.lat, coords.lon], [item.lat, item.lon]], {
            color: item.category.color,
            weight: 2,
            dashArray: '8, 12',
            opacity: 0.5
          }).addTo(map);
          linesRef.current.push(line);
        });

        if (uniqueResults.length > 0) {
          const group = new window.L.featureGroup([...markersRef.current]);
          map.fitBounds(group.getBounds().pad(0.2));
          setActiveAccordion(uniqueResults[0].category.id);
          setActiveTab('results');
        }
        success = true;
      } catch (error) {
        console.error(`${endpoint} hatası:`, error);
      }
    }

    if (!success) {
      setErrorMsg("Overpass sunucularına bağlanılamadı. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  };

  const handleSaveManualPoint = () => {
    if (!manualPointForm.name) {
      setErrorMsg("Lütfen bina adını giriniz.");
      return;
    }
    const cat = categories.find(c => c.id === manualPointForm.catId);
    const distance = calculateDistance(coords.lat, coords.lon, manualPointForm.lat, manualPointForm.lon);
    const newPoint = {
      id: 'manual-' + Date.now(),
      name: manualPointForm.name,
      type: manualPointForm.type || 'Manuel Kayıt',
      lat: manualPointForm.lat, lon: manualPointForm.lon,
      distance: distance, category: cat, isManual: true
    };

    const updatedResults = [...results, newPoint].sort((a, b) => a.distance - b.distance);
    setResults(updatedResults);

    // Haritaya ekle
    const marker = window.L.marker([newPoint.lat, newPoint.lon], {
      icon: createCustomIcon(newPoint.category.color, newPoint.distance)
    }).bindPopup(`<strong>${newPoint.name}</strong><br>${newPoint.type}`).addTo(map);
    markersRef.current.push(marker);

    const line = window.L.polyline([[coords.lat, coords.lon], [newPoint.lat, newPoint.lon]], {
      color: cat.color, weight: 2, dashArray: '8, 12', opacity: 0.5
    }).addTo(map);
    linesRef.current.push(line);

    setManualPointForm(null);
    setIsManualMode(false);
    setActiveAccordion(cat.id);
    setActiveTab('results');
  };

  const groupedResults = categories.reduce((acc, cat) => {
    const items = results.filter(r => r.category.id === cat.id);
    if (items.length > 0) {
      acc[cat.id] = { category: cat, items: items };
    }
    return acc;
  }, {});

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-blue-100 shadow-xl">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">CBS Analiz Sistemi</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic tracking-tighter">Tuğba ŞERBETCİ</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 font-mono bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <MapPin size={12} className="text-blue-500" /> {coords.lat.toFixed(6)} : {coords.lon.toFixed(6)}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-96 bg-white border-r shadow-xl flex flex-col z-20 overflow-hidden">
          <div className="flex p-2 bg-slate-50 border-b gap-1">
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <Settings2 size={14} /> Parametreler
            </button>
            <button onClick={() => setActiveTab('results')} className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${activeTab === 'results' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <BarChart3 size={14} /> Analiz Raporu
              {results.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white shadow-sm">{results.length}</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <section>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2 tracking-widest">
                    <Navigation size={14} className="text-blue-500" /> Konum Ayarları
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 mb-1 uppercase">ENLEM</span>
                      <input type="number" step="0.0001" value={coords.lat}
                        onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 mb-1 uppercase">BOYLAM</span>
                      <input type="number" step="0.0001" value={coords.lon}
                        onChange={(e) => setCoords({ ...coords, lon: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
                    </div>
                  </div>
                </section>

                <section>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2 tracking-widest">
                    <MapIcon size={14} className="text-blue-500" /> Harita Görünümü
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'osm', label: 'STANDART', icon: <MapIcon size={14} />, bg: 'bg-slate-100' },
                      { id: 'satellite', label: 'UYDU', icon: <ImageIcon size={14} />, bg: 'bg-slate-800 text-white' },
                      { id: 'hybrid', label: 'HİBRİT', icon: <Layers size={14} />, bg: 'bg-emerald-800 text-white' }
                    ].map(layer => (
                      <button key={layer.id} onClick={() => setBaseLayer(layer.id)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl border text-[9px] font-black transition-all ${baseLayer === layer.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-500' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${layer.bg}`}>{layer.icon}</div>
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tarama Çapı</label>
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-black">{radius}m</span>
                  </div>
                  <input type="range" min="250" max="3000" step="50" value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </section>

                <section>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Veri Katmanları</label>
                  <div className="space-y-1.5">
                    {categories.map(cat => (
                      <div key={cat.id} onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCategories.includes(cat.id) ? `bg-white shadow-md border-l-4 translate-x-1` : 'bg-white border-slate-50 text-slate-300 hover:bg-slate-50'}`}
                        style={{ borderLeftColor: selectedCategories.includes(cat.id) ? cat.color : 'transparent' }}>
                        <div className="transition-colors" style={{ color: selectedCategories.includes(cat.id) ? cat.color : '#cbd5e1' }}>{cat.icon}</div>
                        <span className={`text-xs font-black uppercase tracking-tight ${selectedCategories.includes(cat.id) ? 'text-slate-700' : 'text-slate-300'}`}>{cat.label}</span>
                        <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedCategories.includes(cat.id) ? 'border-transparent' : 'border-slate-100'}`} style={{ backgroundColor: selectedCategories.includes(cat.id) ? cat.color : 'transparent' }}>
                          {selectedCategories.includes(cat.id) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <button onClick={searchPOIs} disabled={loading || !map}
                  className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mb-4 ${loading || !map ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span> : <Search size={22} />}
                  {loading ? "VERİ ANALİZ EDİLİYOR..." : "ANALİZİ BAŞLAT"}
                </button>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setIsManualMode(!isManualMode); setManualPointForm(null); }} className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md ${isManualMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-400' : 'bg-slate-900 text-white hover:bg-black'}`}>
                    {isManualMode ? <X size={18} /> : <PlusCircle size={18} />}
                    {isManualMode ? "SEÇİMİ İPTAL ET" : "MANUEL NOKTA EKLE"}
                  </button>
                  {isManualMode && <div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-[10px] font-black text-amber-800 uppercase text-center leading-tight">Haritaya tıklayarak eksik bina ekleyebilirsiniz.</p></div>}
                </div>

                {results.length === 0 && !isManualMode ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40">
                    <BarChart3 size={48} className="text-slate-300" />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Henüz analiz yapılmadı veya veri bulunamadı.</p>
                  </div>
                ) : (
                  Object.values(groupedResults).map(({ category, items }) => (
                    <div key={category.id} className="border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <button
                        onClick={() => setActiveAccordion(activeAccordion === category.id ? null : category.id)}
                        className="w-full px-5 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-2"
                        style={{ borderLeft: `6px solid ${category.color}` }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div style={{ color: category.color }} className="flex-shrink-0">{category.icon}</div>
                          <span className="font-black text-slate-700 uppercase tracking-widest text-xs truncate text-left">{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500">{items.length}</span>
                          <div className="text-slate-400">
                            {activeAccordion === category.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </button>

                      {activeAccordion === category.id && (
                        <div className="p-4 flex flex-col gap-5 bg-white border-t border-slate-50 animate-in fade-in duration-300 overflow-y-auto max-h-[800px] custom-scrollbar-thin">
                          {items.map((item, idx) => (
                            <div key={idx} className="px-6 py-12 border border-slate-100 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden ring-1 ring-slate-100 flex flex-col justify-between min-h-[500px]">
                              <div className="flex justify-between items-start mb-8">
                                <span className="text-[10px] font-black px-3 py-1.5 rounded-xl text-white uppercase tracking-widest shadow-sm"
                                  style={{ backgroundColor: category.color }}>
                                  {item.type}
                                </span>
                                <div className="flex flex-col items-end gap-1">
                                  {item.isManual && <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full mb-1">MANUEL</span>}
                                  <span className="text-[11px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1 shadow-sm">
                                    <Ruler size={10} className="text-blue-500" /> {item.distance}m
                                  </span>
                                  <button onClick={() => map.setView([item.lat, item.lon], 18)} className="text-slate-300 hover:text-blue-500 transition-all p-2 rounded-xl hover:bg-blue-50">
                                    <MapPin size={22} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-center">
                                <h4 className="text-xl font-black text-slate-800 leading-tight tracking-tight mb-4" title={item.name}>{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Konum Analiz Detayı</p>
                              </div>
                              <a
                                href={`https://parselsorgu.tkgm.gov.tr/#ara/cografi/${item.lat}/${item.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full border-2 text-[11px] py-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-black uppercase tracking-wider text-emerald-600 border-emerald-100 bg-white shadow-sm active:scale-95"
                              >
                                TKGM PARSEL SORGULA <ExternalLink size={16} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 relative flex min-h-0 min-w-0">
          <div id="map-container" className="absolute inset-0 z-0 bg-slate-100"></div>

          {manualPointForm && (
            <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 border border-slate-100 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><PlusCircle size={24} /></div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest leading-none">Nokta Tanımla</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Manuel bina ekleme formu</p>
                    </div>
                  </div>
                  <button onClick={() => setManualPointForm(null)} className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-full hover:bg-slate-50">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">BİNA ADI</label>
                    <input autoFocus type="text" placeholder="Örn: X Durağı / Metro Girişi" value={manualPointForm.name} onChange={(e) => setManualPointForm({ ...manualPointForm, name: e.target.value })} className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">VERİ KATMANI</label>
                    <select value={manualPointForm.catId} onChange={(e) => setManualPointForm({ ...manualPointForm, catId: e.target.value })} className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none cursor-pointer">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveManualPoint} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <CheckCircle2 size={20} /> ANALİZ LİSTESİNE KAYDET
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-2 p-1 hover:bg-red-50 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      <style>{`
        #map-container { width: 100% !important; height: 100% !important; }
        .leaflet-container { font-family: inherit; height: 100% !important; width: 100% !important; cursor: ${isManualMode ? 'crosshair' : 'default'}; }
        .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.2); }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom { border: none !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important; margin-left: 20px !important; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { background-color: white !important; color: #1e293b !important; font-weight: bold !important; height: 40px !important; width: 40px !important; border: none !important; }
        .custom-div-icon { background: none; border: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;

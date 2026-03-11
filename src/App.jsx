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
  AlertCircle
} from 'lucide-react';

const App = () => {
  const [coords, setCoords] = useState({ lat: 39.9570, lon: 32.8501 });
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(['education', 'health', 'government', 'cadastre', 'transport', 'shopping', 'social']);
  const [baseLayer, setBaseLayer] = useState('osm');
  const [map, setMap] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);

  const markersRef = useRef([]);
  const linesRef = useRef([]);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);

  const categories = [
    { id: 'education', label: 'Eğitim', icon: <School size={18} />, color: '#3b82f6', tags: '["amenity"~"school|university|kindergarten|college|library"]' },
    { id: 'health', label: 'Sağlık', icon: <Hospital size={18} />, color: '#ef4444', tags: '["amenity"~"hospital|doctors|clinic|pharmacy|dentist"]' },
    { id: 'cadastre', label: 'Tapu ve Kadastro', icon: <Landmark size={18} />, color: '#0891b2', tags: '["office"~"government|land_registry"]["government"~"cadastre|land_registry|tax"]' },
    { id: 'government', label: 'Kamu (Belediye/Valilik)', icon: <Building2 size={18} />, color: '#f59e0b', tags: '["amenity"~"townhall|courthouse|police|post_office|fire_station"]' },
    { id: 'transport', label: 'Ulaşım (Durak/İstasyon)', icon: <Bus size={18} />, color: '#10b981', tags: '["highway"~"bus_stop|platform"]["railway"~"station|subway_entrance|stop"]["amenity"~"bus_station|taxi"]' },
    { id: 'shopping', label: 'AVM / Market', icon: <Store size={18} />, color: '#db2777', tags: '["shop"~"mall|supermarket|department_store|convenience"]' },
    { id: 'social', label: 'Sosyal / Kültürel', icon: <Theater size={18} />, color: '#8b5cf6', tags: '["amenity"~"cinema|theatre|arts_centre|community_centre|social_facility|marketplace"]' },
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

      // Eğer container üzerinde zaten bir harita varsa, onu kaldır
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
        setCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      });
      setMap(leafletMap);
    };
    loadLeaflet();

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []);

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
    if (tags.office?.match(/land_registry/) || tags.government?.match(/cadastre|land_registry/) || tags.name?.match(/Tapu|Kadastro/i))
      return categories.find(c => c.id === 'cadastre');
    if (tags.amenity?.match(/school|university|kindergarten|college|library/))
      return categories.find(c => c.id === 'education');
    if (tags.amenity?.match(/hospital|doctors|clinic|pharmacy|dentist/))
      return categories.find(c => c.id === 'health');
    if (tags.amenity?.match(/townhall|courthouse|police|post_office|fire_station/))
      return categories.find(c => c.id === 'government');
    if (tags.public_transport || tags.highway?.match(/bus_stop|platform/) || tags.railway?.match(/subway|station|stop/) || tags.amenity === 'bus_station')
      return categories.find(c => c.id === 'transport');
    if (tags.shop?.match(/mall|supermarket|department_store|convenience/))
      return categories.find(c => c.id === 'shopping');
    if (tags.amenity?.match(/cinema|theatre|arts_centre|community_centre|social_facility|marketplace/))
      return categories.find(c => c.id === 'social');
    return { id: 'other', color: '#64748b', label: 'Diğer' };
  };

  const createCustomIcon = (color) => {
    return window.L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
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
      .map(c => `node${c.tags}(around:${radius},${coords.lat},${coords.lon});way${c.tags}(around:${radius},${coords.lat},${coords.lon});`)
      .join('');

    const query = `[out:json][timeout:30];(${selectedTags});out body center;`;

    // Overpass API için alternatif sunucular ve daha güvenilir istek yapısı
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
          method: 'GET', // GET isteği bazen CORS sorunlarını daha kolay aşar
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!data || !data.elements) throw new Error("Veri formatı hatalı");

        const processedResults = data.elements.map(el => {
          const catInfo = identifyCategory(el.tags);
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

        processedResults.sort((a, b) => a.distance - b.distance);
        setResults(processedResults);

        processedResults.forEach(item => {
          // Marker Ekleme
          const marker = window.L.marker([item.lat, item.lon], {
            icon: createCustomIcon(item.category.color)
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

          // Kesik Çizgi ve Mesafe Etiketi Ekleme
          const line = window.L.polyline([[coords.lat, coords.lon], [item.lat, item.lon]], {
            color: item.category.color,
            weight: 2,
            dashArray: '8, 12',
            opacity: 0.6
          })
            .bindTooltip(`${item.distance}m`, {
              permanent: true,
              direction: 'center',
              className: 'distance-label'
            })
            .addTo(map);
          linesRef.current.push(line);
        });

        if (processedResults.length > 0) {
          const group = new window.L.featureGroup([...markersRef.current]);
          map.fitBounds(group.getBounds().pad(0.2));
          setActiveAccordion(processedResults[0].category.id);
        }
        success = true;
      } catch (error) {
        console.error(`${endpoint} hatası:`, error);
      }
    }

    if (!success) {
      setErrorMsg("Overpass sunucularına bağlanılamadı. Lütfen farklı bir tarayıcı veya ağ ile tekrar deneyin (CORS kısıtlaması).");
    }
    setLoading(false);
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
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-blue-100 shadow-xl">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">CBS Analiz Sistemi</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Tuğba ŞERBETCİ</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 font-mono bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <MapPin size={12} className="text-blue-500" /> {coords.lat.toFixed(6)} : {coords.lon.toFixed(6)}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 bg-white border-r shadow-xl overflow-y-auto z-20 p-5 flex flex-col gap-6">
          <section>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2 tracking-widest">
              <Navigation size={14} className="text-blue-500" /> Konum Ayarları
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 mb-1">ENLEM</span>
                <input type="number" step="0.0001" value={coords.lat}
                  onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || 0 })}
                  className="border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 mb-1">BOYLAM</span>
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

          <section className="flex-1">
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
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${loading || !map ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <Search size={20} />}
            {loading ? "ANALİZ EDİLİYOR..." : "ANALİZİ BAŞLAT"}
          </button>
        </aside>

        <main className="flex-1 relative flex min-h-0 min-w-0">
          <div id="map-container" className="absolute inset-0 z-0 bg-slate-100"></div>

          {errorMsg && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-2 p-1 hover:bg-red-50 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="absolute top-6 bottom-6 right-6 w-96 bg-white shadow-2xl z-20 flex flex-col overflow-hidden border-r-8 border-r-blue-600 rounded-[2.5rem] animate-in slide-in-from-right-10 duration-500">

              <div className="flex-none p-6 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                      <LocateFixed size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none">Analiz Raporu</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{results.length} Toplam Tespit</p>
                    </div>
                  </div>
                  <button onClick={() => setResults([])} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-300">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50/50">
                {Object.values(groupedResults).map(({ category, items }) => (
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
                      <div className="p-4 flex flex-col gap-5 bg-white border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto max-h-[800px] custom-scrollbar-thin">
                        {items.map((item, idx) => (
                          <div key={idx} className="px-6 py-24 border border-slate-100 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden ring-1 ring-slate-100 flex flex-col justify-between min-h-[550px]">
                            <div className="flex justify-between items-start mb-12">
                              <span className="text-[10px] font-black px-3 py-1.5 rounded-xl text-white uppercase tracking-widest shadow-sm"
                                style={{ backgroundColor: category.color }}>
                                {item.type}
                              </span>
                              <div className="flex flex-col items-end gap-1">
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
                              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider italic">Konum Analiz Detayı</p>
                            </div>
                            <a
                              href={`https://parselsorgu.tkgm.gov.tr/#ara/cografi/${item.lat}/${item.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full border-2 text-[11px] py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-black uppercase tracking-wider text-emerald-600 border-emerald-100 bg-white shadow-sm active:scale-95"
                            >
                              TKGM PARSEL SORGULA <ExternalLink size={16} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        #map-container { width: 100% !important; height: 100% !important; }
        .leaflet-container { font-family: inherit; height: 100% !important; width: 100% !important; }
        .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.2); }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom { border: none !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important; margin-left: 20px !important; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { background-color: white !important; color: #1e293b !important; font-weight: bold !important; height: 40px !important; width: 40px !important; border: none !important; }
        
        /* Mesafe Etiketleri (Tooltip) Tasarımı */
        .distance-label {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 2px 6px !important;
          font-weight: 800 !important;
          font-size: 10px !important;
          color: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          opacity: 1 !important;
        }
        .distance-label::before { display: none !important; }

        .custom-div-icon { background: none; border: none; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar-thin { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f8fafc; }
        .custom-scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in-from-right-10 { animation: slideInRight 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;

import { useState, useCallback, useRef } from 'react';
export default function HotspotEditor() {
  const [image, setImage] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null); // {id, type:'move'|'resize', startX, startY, origSpot}
  const [showJson, setShowJson] = useState(false);
  const containerRef = useRef(null);

  const getPercent = (clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const handleContainerClick = (e) => {
    if (dragging || e.target !== containerRef.current?.querySelector('.bg-layer')) return;
    const { x, y } = getPercent(e.clientX, e.clientY);
    const id = `spot-${Date.now()}`;
    setHotspots(prev => [...prev, { id, x: x - 4, y: y - 3, w: 8, h: 6, real: false, clueKey: '', label: '' }]);
    setSelected(id);
  };

  const handleMouseDown = (e, id, type) => {
    e.stopPropagation();
    const spot = hotspots.find(s => s.id === id);
    if (!spot) return;
    setDragging({ id, type, startX: e.clientX, startY: e.clientY, orig: { ...spot } });
    setSelected(id);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragging.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragging.startY) / rect.height) * 100;
    setHotspots(prev => prev.map(s => {
      if (s.id !== dragging.id) return s;
      if (dragging.type === 'move') {
        return { ...s, x: Math.max(0, dragging.orig.x + dx), y: Math.max(0, dragging.orig.y + dy) };
      } else {
        return { ...s, w: Math.max(2, dragging.orig.w + dx), h: Math.max(2, dragging.orig.h + dy) };
      }
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const updateSpot = (id, field, value) => {
    setHotspots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSpot = (id) => {
    setHotspots(prev => prev.filter(s => s.id !== id));
    if (selected === id) setSelected(null);
  };

  const exportJson = () => {
    return JSON.stringify(hotspots.map(s => ({
      id: s.real ? s.clueKey || s.id : s.id,
      x: Math.round(s.x * 10) / 10,
      y: Math.round(s.y * 10) / 10,
      w: Math.round(s.w * 10) / 10,
      h: Math.round(s.h * 10) / 10,
      real: s.real,
      ...(s.real ? { clueKey: s.clueKey, label: s.label } : {})
    })), null, 2);
  };

  const selectedSpot = hotspots.find(s => s.id === selected);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col"
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-amber-400">HOTSPOT EDITOR</span>
          <span className="text-xs text-zinc-500 font-mono">|</span>
          <span className="text-xs text-zinc-400 font-mono">{hotspots.length} hotspots ({hotspots.filter(s=>s.real).length} reales, {hotspots.filter(s=>!s.real).length} falsos)</span>
        </div>
        <div className="flex gap-2">
          <label className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono rounded cursor-pointer transition-colors">
            📁 Cargar imagen
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <button onClick={() => setShowJson(!showJson)} className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-xs font-mono rounded transition-colors">
            {showJson ? '✕ Cerrar' : '{ } Exportar JSON'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
          {!image ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-600 font-mono text-sm mb-2">Carga una imagen de fondo para empezar</p>
                <p className="text-zinc-700 font-mono text-xs">Haz clic en la imagen para crear hotspots</p>
                <p className="text-zinc-700 font-mono text-xs">Arrastra para mover, esquina para redimensionar</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="relative w-full h-full" onClick={handleContainerClick}
              style={{ cursor: dragging ? (dragging.type === 'move' ? 'grabbing' : 'nwse-resize') : 'crosshair' }}
            >
              <div className="bg-layer absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${image})` }} />

              {hotspots.map(spot => (
                <div key={spot.id}
                  className={`absolute border transition-colors ${
                    selected === spot.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : spot.real
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                  }`}
                  style={{
                    left: `${spot.x}%`, top: `${spot.y}%`,
                    width: `${spot.w}%`, height: `${spot.h}%`,
                    borderRadius: '3px', borderWidth: '1.5px'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, spot.id, 'move')}
                  onClick={(e) => { e.stopPropagation(); setSelected(spot.id); }}
                >
                  {/* Label */}
                  <span className="absolute -top-4 left-0 text-[9px] font-mono whitespace-nowrap"
                    style={{ color: spot.real ? '#22c55e' : '#ef4444' }}
                  >
                    {spot.real ? `✓ ${spot.clueKey || spot.id}` : `✕ ${spot.id}`}
                  </span>
                  {/* Resize handle */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-zinc-400 rounded-sm cursor-nwse-resize opacity-50 hover:opacity-100"
                    onMouseDown={(e) => handleMouseDown(e, spot.id, 'resize')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 font-bold">PROPIEDADES</span>
          </div>

          {selectedSpot ? (
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-xs text-zinc-500 font-mono">ID</label>
                <input value={selectedSpot.id} onChange={e => updateSpot(selected, 'id', e.target.value)}
                  className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => updateSpot(selected, 'real', true)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${selectedSpot.real ? 'bg-emerald-800 text-emerald-200' : 'bg-zinc-800 text-zinc-500'}`}>
                  ✓ Real
                </button>
                <button onClick={() => updateSpot(selected, 'real', false)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${!selectedSpot.real ? 'bg-red-900 text-red-200' : 'bg-zinc-800 text-zinc-500'}`}>
                  ✕ Falso
                </button>
              </div>

              {selectedSpot.real && (
                <>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono">Clave (clueKey)</label>
                    <select value={selectedSpot.clueKey} onChange={e => updateSpot(selected, 'clueKey', e.target.value)}
                      className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-200 focus:outline-none">
                      <option value="">— seleccionar —</option>
                      <option value="computador">computador</option>
                      <option value="documentos">documentos</option>
                      <option value="celular">celular</option>
                      <option value="trofeos">trofeos</option>
                      <option value="organigrama">organigrama</option>
                      <option value="servidor-humeante">servidor-humeante</option>
                      <option value="computadora-bloqueada">computadora-bloqueada</option>
                      <option value="postit-teclado">postit-teclado</option>
                      <option value="carpeta-escritorio">carpeta-escritorio</option>
                      <option value="log-errores">log-errores</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono">Label</label>
                    <input value={selectedSpot.label || ''} onChange={e => updateSpot(selected, 'label', e.target.value)}
                      className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-600 font-mono">X %</label>
                  <input type="number" step="0.1" value={Math.round(selectedSpot.x*10)/10} onChange={e => updateSpot(selected, 'x', +e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-300 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 font-mono">Y %</label>
                  <input type="number" step="0.1" value={Math.round(selectedSpot.y*10)/10} onChange={e => updateSpot(selected, 'y', +e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-300 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 font-mono">W %</label>
                  <input type="number" step="0.1" value={Math.round(selectedSpot.w*10)/10} onChange={e => updateSpot(selected, 'w', +e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-300 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 font-mono">H %</label>
                  <input type="number" step="0.1" value={Math.round(selectedSpot.h*10)/10} onChange={e => updateSpot(selected, 'h', +e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-300 focus:outline-none" />
                </div>
              </div>

              <button onClick={() => deleteSpot(selected)}
                className="w-full py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 text-xs font-mono rounded transition-colors mt-2">
                🗑 Eliminar hotspot
              </button>
            </div>
          ) : (
            <div className="p-3 text-xs text-zinc-600 font-mono">
              Selecciona un hotspot o haz clic en la imagen para crear uno nuevo
            </div>
          )}

          {/* Quick add buttons */}
          <div className="p-3 border-t border-zinc-800 space-y-1">
            <p className="text-[10px] text-zinc-600 font-mono mb-1">AGREGAR RÁPIDO:</p>
            {['computador','documentos','celular','trofeos','organigrama'].map(key => {
              const exists = hotspots.some(s => s.clueKey === key);
              return (
                <button key={key} disabled={exists}
                  onClick={() => {
                    const id = key;
                    setHotspots(prev => [...prev, { id, x: 40, y: 40, w: 10, h: 10, real: true, clueKey: key, label: key }]);
                    setSelected(id);
                  }}
                  className={`w-full py-1 text-[10px] font-mono rounded transition-colors ${exists ? 'bg-zinc-800/50 text-zinc-700' : 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700'}`}>
                  {exists ? `✓ ${key}` : `+ ${key}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* JSON Export Panel */}
        {showJson && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 font-bold">JSON EXPORT</span>
              <button onClick={() => { navigator.clipboard.writeText(exportJson()); }}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono rounded transition-colors">
                📋 Copiar
              </button>
            </div>
            <pre className="flex-1 p-3 text-[10px] font-mono text-emerald-400/70 overflow-auto whitespace-pre">
              {exportJson()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
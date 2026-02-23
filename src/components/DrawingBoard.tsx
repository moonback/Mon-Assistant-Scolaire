import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Palette, Eraser, Download, Trash2, Pencil, Sparkles, Star,
  RotateCcw, RotateCw, Maximize2, Minimize2, Heart, Moon,
  Brush, MousePointer2, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tool = 'pen' | 'eraser' | 'rainbow' | 'stamp-star' | 'stamp-heart' | 'stamp-moon';

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<Tool>('pen');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();

    // If we're not at the end of history, slice it
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);

    // Limit history to 20 steps to save memory
    if (newHistory.length > 20) newHistory.shift();

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
        }
      }

      const handleResize = () => {
        if (!canvas || !canvas.parentElement) return;
        const tempImage = canvas.toDataURL();
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const img = new Image();
          img.src = tempImage;
          img.onload = () => ctx.drawImage(img, 0, 0);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, type: Tool) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    const size = lineWidth * 4;

    if (type === 'stamp-star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * size, -Math.sin((18 + i * 72) / 180 * Math.PI) * size);
        ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (size / 2), -Math.sin((54 + i * 72) / 180 * Math.PI) * (size / 2));
      }
      ctx.closePath();
      ctx.fill();
    } else if (type === 'stamp-heart') {
      ctx.beginPath();
      ctx.moveTo(0, size / 4);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 2);
      ctx.bezierCurveTo(-size / 2, size * 0.8, 0, size * 1.1, 0, size * 1.3);
      ctx.bezierCurveTo(0, size * 1.1, size / 2, size * 0.8, size / 2, size / 2);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
      ctx.fill();
    } else if (type === 'stamp-moon') {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.bezierCurveTo(size * 0.5, -size, size * 0.5, size, 0, size);
      ctx.fill();
    }
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    if (tool.startsWith('stamp-')) {
      drawStamp(ctx, x, y, tool);
      saveToHistory();
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Initial draw for pen tools
    if (tool === 'pen' || tool === 'eraser' || tool === 'rainbow') {
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
      } else if (tool === 'pen') {
        ctx.strokeStyle = color;
      }
      // Rainbow is handled in 'draw'
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool.startsWith('stamp-')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    if (tool === 'rainbow') {
      const hue = (Date.now() / 10) % 360;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
        }
      };
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
        }
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-[3rem] shadow-2xl p-6 md:p-8 border border-slate-100 relative overflow-hidden flex flex-col ${isFullscreen ? 'h-screen w-screen rounded-none p-4' : 'h-[80vh]'}`}
      >
        {/* Magic Background decorative elements */}
        {!isFullscreen && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50/50 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />
          </>
        )}

        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8 px-2 relative z-10">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-200"
            >
              <Palette className="w-8 h-8" />
            </motion.div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">Atelier Magique</h2>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px]">Espace de création infinie</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* History Controls */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm mr-2">
              <button
                onClick={undo}
                disabled={historyStep <= 0}
                className="p-3 rounded-xl hover:bg-white hover:text-indigo-600 disabled:opacity-30 text-slate-400 transition-all"
                title="Annuler"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="p-3 rounded-xl hover:bg-white hover:text-indigo-600 disabled:opacity-30 text-slate-400 transition-all"
                title="Refaire"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
              <button
                onClick={clearCanvas}
                className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all group shadow-sm"
                title="Tout effacer"
              >
                <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `art-magique-${Date.now()}.png`;
                  link.href = canvasRef.current?.toDataURL() || '';
                  link.click();
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black flex items-center gap-2.5 hover:translate-y-[-2px] hover:shadow-xl transition-all active:scale-95 shadow-lg text-sm"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 relative z-10">
          {/* Enhanced Toolbar Sidebar */}
          <aside className={`flex md:flex-col gap-4 p-4 md:p-5 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 shadow-xl flex-shrink-0 ${isFullscreen ? 'md:w-20' : 'md:w-24'}`}>

            <div className="flex-1 flex md:flex-col items-center justify-center gap-3 overflow-y-auto no-scrollbar py-2">
              {[
                { id: 'pen', icon: Pencil, label: 'Crayon', color: 'bg-indigo-600' },
                { id: 'rainbow', icon: Brush, label: 'Magie', color: 'bg-gradient-to-tr from-rose-500 via-yellow-500 to-blue-500' },
                { id: 'eraser', icon: Eraser, label: 'Gomme', color: 'bg-slate-700' },
                { id: 'stamp-star', icon: Star, label: 'Étoile', color: 'bg-amber-400' },
                { id: 'stamp-heart', icon: Heart, label: 'Cœur', color: 'bg-rose-500' },
                { id: 'stamp-moon', icon: Moon, label: 'Lune', color: 'bg-purple-600' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as Tool)}
                  className={`group relative flex flex-col items-center transition-all ${tool === t.id ? 'scale-105' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${tool === t.id ? t.color + ' ring-2 ring-white' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                    <t.icon className={`w-5.5 h-5.5 ${tool === t.id ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className={`text-[7.5px] font-black uppercase tracking-widest mt-1.5 ${tool === t.id ? 'text-indigo-600' : 'text-slate-400'}`}>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="w-px h-12 md:w-20 md:h-px bg-slate-200 mx-auto opacity-50" />

            {/* Color Palette (Magical Layout) */}
            <div className="grid grid-cols-2 gap-2.5 py-1 justify-items-center">
              {[
                '#6366f1', '#ec4899', '#f43f5e', '#f59e0b',
                '#10b981', '#06b6d4', '#8b5cf6', '#1e293b',
                '#ffffff'
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                  className={`w-6.5 h-6.5 md:w-7.5 md:h-7.5 rounded-full border-2 shadow-sm transition-all ${color === c && tool !== 'eraser' && tool !== 'rainbow' ? 'border-indigo-500 scale-110 ring-2 ring-indigo-100 z-10' : 'border-slate-100 hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="w-px h-12 md:w-20 md:h-px bg-slate-200 mx-auto opacity-50 hidden md:block" />

            {/* Brush Size Controls */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative h-40 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="vertical-range accent-indigo-600 cursor-pointer h-32"
                  style={{ writingMode: 'bt-lr' } as any}
                />
              </div>
              <div className="flex flex-col items-center opacity-70">
                <div className="rounded-full bg-slate-400 mb-1" style={{ width: Math.max(lineWidth / 2, 2), height: Math.max(lineWidth / 2, 2) }} />
                <span className="text-[10px] font-black text-slate-500">{lineWidth}px</span>
              </div>
            </div>
          </aside>

          {/* Magical Canvas Board */}
          <div className="flex-1 bg-white rounded-[2.5rem] md:rounded-[3.5rem] border-[10px] border-slate-50/50 overflow-hidden cursor-none relative shadow-xl group flex flex-col">
            {/* Interactive Canvas Overlay (Magical Cursor) */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}
              />
            </div>

            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full relative z-20 block bg-white"
            />

            {/* Visual Feedback: Current Selection Info */}
            <div className="absolute bottom-6 left-6 z-40 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <MousePointer2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{tool.includes('stamp') ? 'Tampon' : tool === 'rainbow' ? 'Magie' : 'Dessin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: tool === 'eraser' ? '#fff' : tool === 'rainbow' ? 'transparent' : color, background: tool === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' : undefined }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{lineWidth}px</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer / Instructions */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-8 mt-4"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <div className="bg-slate-100 p-1.5 rounded-lg text-[10px] font-black uppercase">Click / Touche</div>
            <span className="text-xs font-medium">Pour dessiner</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="bg-indigo-50 p-1.5 rounded-lg text-[10px] font-black uppercase text-indigo-600">F</div>
            <span className="text-xs font-medium">Mode Immersif</span>
          </div>
        </motion.div>
      )}

      <style>{`
        .vertical-range {
          -webkit-appearance: none;
          transform: rotate(-90deg);
          background: transparent;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}


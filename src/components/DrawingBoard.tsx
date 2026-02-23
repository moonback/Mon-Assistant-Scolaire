import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Palette, Eraser, Download, Trash2, Pencil, Sparkles, Star,
  Undo2, Redo2, Maximize2, Minimize2, Heart, Moon,
  Brush, MousePointer2, Type, Minus, Plus, Wand2, Loader2
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const generateColoringPage = async () => {
    if (!genPrompt) return;
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_key_here') {
      alert("S'il te plaît, ajoute ta clé API OpenRouter dans le fichier .env ! (VITE_OPENROUTER_API_KEY)");
      return;
    }

    setIsGenerating(true);
    setShowGenModal(false);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Mon Assistant Scolaire"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5-8b:free",
          messages: [
            {
              role: "system",
              content: "Tu es un artiste spécialisé dans les coloriages pour enfants. Ton but est de générer UNIQUEMENT du code SVG (sans texte explicatif) pour un coloriage en noir et blanc. Utilise des lignes noires épaisses, pas de remplissage, pas d'ombres. Le SVG doit avoir un viewBox='0 0 1024 1024' et être simple."
            },
            {
              role: "user",
              content: `Génère un coloriage SVG pour : ${genPrompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error("Pas de réponse de l'IA");

      // Extract SVG from markdown if needed
      const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/);
      const svgCode = svgMatch ? svgMatch[0] : content;

      const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const scale = Math.min(canvas.width / 1024, canvas.height / 1024) * 0.9;
          const x = (canvas.width / 2) - (1024 / 2) * scale;
          const y = (canvas.height / 2) - (1024 / 2) * scale;

          ctx.drawImage(img, x, y, 1024 * scale, 1024 * scale);
          saveToHistory();
        }
        setIsGenerating(false);
        setGenPrompt('');
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        alert("Oups ! Je n'ai pas pu charger le dessin. Réessaie avec un autre sujet !");
        setIsGenerating(false);
      };

      img.src = url;

    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la génération. Vérifie ta clé API !");
      setIsGenerating(false);
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
    <div className="max-w-screen-2xl mx-auto h-[85vh] px-4 pb-8">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col ${isFullscreen ? 'h-screen w-screen rounded-none' : 'h-full w-full'}`}
      >
        {/* Magic Background decorative elements */}
        {!isFullscreen && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50/40 rounded-full blur-[100px] -ml-64 -mb-64" />
          </div>
        )}

        {/* Floating Top Header Bar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 w-[95%] max-w-4xl">
          <div className="flex-1 bg-white/70 backdrop-blur-2xl border border-white px-6 py-3 rounded-[2rem] shadow-2xl shadow-indigo-100/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Palette className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-base font-black text-slate-800 leading-none">Atelier Magique</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-300" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Espace Créatif</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100/50 p-1 rounded-xl mr-2">
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className="p-2.5 rounded-lg hover:bg-white hover:text-indigo-600 disabled:opacity-20 text-slate-500 transition-all"
                  title="Annuler"
                >
                  <Undo2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyStep >= history.length - 1}
                  className="p-2.5 rounded-lg hover:bg-white hover:text-indigo-600 disabled:opacity-20 text-slate-500 transition-all"
                  title="Refaire"
                >
                  <Redo2 className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="w-px h-6 bg-slate-200 mx-1" />

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowGenModal(true)}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${isGenerating ? 'bg-indigo-50 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                title="Générer un coloriage magique"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Magie IA</span>
              </button>

              <button
                onClick={clearCanvas}
                className="p-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-all group"
                title="Tout effacer"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>

              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `art-${Date.now()}.png`;
                  link.href = canvasRef.current?.toDataURL() || '';
                  link.click();
                }}
                className="ml-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Immersive Canvas Area */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Canvas Component */}
          <div className="absolute inset-0 bg-[#F1F5F9] p-4 md:p-8 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[3rem] shadow-inner overflow-hidden relative cursor-none group">
              {/* Texture Layer */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

              {/* Dot Grid Layer */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-10"
                style={{ backgroundImage: 'radial-gradient(#6366f1 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />

              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full relative z-20 block bg-white"
              />

              <motion.div
                className="fixed pointer-events-none z-50 w-6 h-6 rounded-full border-2 border-indigo-500 shadow-sm mix-blend-difference hidden md:block"
                animate={{
                  x: mousePos.x - 12,
                  y: mousePos.y - 12,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 250, mass: 0.5 }}
              />
            </div>
          </div>

          {/* Brushes & Tools Floating Dock (Bottom) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40 px-6 py-4 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border-2 border-slate-100 rounded-[2.5rem] overflow-x-auto no-scrollbar max-w-[90vw]">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
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
                  className={`group relative flex flex-col items-center p-1.5 transition-all ${tool === t.id ? 'scale-110 active-tool-pop' : 'hover:scale-105'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all ${tool === t.id ? t.color + ' text-white ring-2 ring-white ring-offset-2' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                    <t.icon className={`w-6 h-6 ${tool === t.id ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${tool === t.id ? 'text-indigo-600' : 'text-slate-500'}`}>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-2 border-r border-slate-100">
              {[
                '#6366f1', '#ec4899', '#f43f5e', '#f59e0b',
                '#10b981', '#0ea5e9', '#8b5cf6', '#1e293b',
                '#ffffff'
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                  className={`w-7 h-7 rounded-full border-2 border-white shadow-sm transition-all ${color === c && tool !== 'eraser' && tool !== 'rainbow' ? 'scale-125 ring-2 ring-indigo-500 z-10' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 pl-4 min-w-[160px]">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => setLineWidth(Math.max(1, lineWidth - 2))} />
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div
                    style={{
                      width: Math.max(lineWidth / 2, 2),
                      height: Math.max(lineWidth / 2, 2),
                      backgroundColor: color
                    }}
                    className="rounded-full shadow-sm"
                  />
                </div>
                <Plus className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => setLineWidth(Math.min(50, lineWidth + 2))} />
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-24 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-full appearance-none"
                />
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Épaisseur</span>
                  <span className="text-[10px] font-black text-indigo-600">{lineWidth}px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Styles for range and animations */}
      <AnimatePresence>
        {showGenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Générateur Magique</h3>
                <p className="text-slate-500 font-medium text-sm">Que veux-tu colorier aujourd'hui ?</p>
              </div>

              <input
                autoFocus
                type="text"
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateColoringPage()}
                placeholder="Ex: Un dragon gentil, une fée, un chat..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowGenModal(false)}
                  className="py-4 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  onClick={generateColoringPage}
                  className="py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Générer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .active-tool-pop {
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.3));
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}


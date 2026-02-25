import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Eraser,
  Download,
  Trash2,
  Pencil,
  Star,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Heart,
  Moon,
  Brush,
  Minus,
  Plus,
  Wand2,
  Loader2,
  Square,
  Circle as CircleIcon,
  Triangle,
  LineChart,
  Grid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Tool =
  | 'pen'
  | 'eraser'
  | 'rainbow'
  | 'stamp-star'
  | 'stamp-heart'
  | 'stamp-moon'
  | 'line'
  | 'square'
  | 'circle'
  | 'triangle';

type Point = { x: number; y: number };

const MAX_HISTORY = 20;

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<Tool>('pen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [historyStep, setHistoryStep] = useState(-1);
  const historyRef = useRef<string[]>([]);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point>({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [generationsLeft, setGenerationsLeft] = useState(5);
  const { selectedChild } = useAuth();

  const getCtx = () => canvasRef.current?.getContext('2d') || null;

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const next = [...historyRef.current.slice(0, historyStep + 1), canvas.toDataURL('image/png')].slice(-MAX_HISTORY);
    historyRef.current = next;
    setHistoryStep(next.length - 1);
  }, [historyStep]);

  const loadSnapshot = useCallback((step: number) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || step < 0 || step >= historyRef.current.length) return;

    const img = new Image();
    img.src = historyRef.current[step];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent) return;

    const resize = () => {
      const prev = canvas.toDataURL('image/png');
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const ctx = getCtx();
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const img = new Image();
      img.src = prev;
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    setTimeout(() => saveSnapshot(), 0);

    return () => observer.disconnect();
  }, [saveSnapshot]);

  useEffect(() => {
    const checkLimit = async () => {
      if (!selectedChild) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_child_stats')
        .select('ai_generations_count')
        .eq('child_id', selectedChild.id)
        .eq('date', today)
        .maybeSingle();

      const usedCount = data?.ai_generations_count || 0;
      setGenerationsLeft(Math.max(0, 5 - usedCount));
    };

    checkLimit();
  }, [showGenModal, selectedChild]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, type: Tool) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    const size = Math.max(12, lineWidth * 3);

    if (type === 'stamp-star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        ctx.lineTo(Math.cos((18 + i * 72) * (Math.PI / 180)) * size, -Math.sin((18 + i * 72) * (Math.PI / 180)) * size);
        ctx.lineTo(Math.cos((54 + i * 72) * (Math.PI / 180)) * (size / 2), -Math.sin((54 + i * 72) * (Math.PI / 180)) * (size / 2));
      }
      ctx.closePath();
      ctx.fill();
    } else if (type === 'stamp-heart') {
      ctx.beginPath();
      ctx.moveTo(0, size / 4);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 2);
      ctx.bezierCurveTo(-size / 2, size * 0.9, 0, size * 1.2, 0, size * 1.35);
      ctx.bezierCurveTo(0, size * 1.2, size / 2, size * 0.9, size / 2, size / 2);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
      ctx.fill();
    } else if (type === 'stamp-moon') {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.bezierCurveTo(size * 0.45, -size, size * 0.45, size, 0, size);
      ctx.fill();
    }

    ctx.restore();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const point = toCanvasPoint(e);
    startPointRef.current = point;

    if (tool.startsWith('stamp-')) {
      drawStamp(ctx, point.x, point.y, tool);
      saveSnapshot();
      return;
    }

    isDrawingRef.current = true;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const point = toCanvasPoint(e);

    if (['line', 'square', 'circle', 'triangle'].includes(tool)) {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (tool === 'square') {
        ctx.strokeRect(
          startPointRef.current.x,
          startPointRef.current.y,
          point.x - startPointRef.current.x,
          point.y - startPointRef.current.y,
        );
      } else if (tool === 'circle') {
        const radius = Math.hypot(point.x - startPointRef.current.x, point.y - startPointRef.current.y);
        ctx.beginPath();
        ctx.arc(startPointRef.current.x, startPointRef.current.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(startPointRef.current.x * 2 - point.x, point.y);
        ctx.closePath();
        ctx.stroke();
      }

      return;
    }

    if (tool === 'rainbow') {
      ctx.strokeStyle = `hsl(${(Date.now() / 10) % 360}, 85%, 55%)`;
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    snapshotRef.current = null;
    saveSnapshot();
  };

  const undo = () => {
    if (historyStep <= 0) return;
    const next = historyStep - 1;
    setHistoryStep(next);
    loadSnapshot(next);
  };

  const redo = () => {
    if (historyStep >= historyRef.current.length - 1) return;
    const next = historyStep + 1;
    setHistoryStep(next);
    loadSnapshot(next);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `atelier-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const generateColoringPage = async () => {
    if (!genPrompt.trim()) return;
    if (generationsLeft <= 0) {
      alert("Tu as atteint la limite de 5 générations aujourd'hui.");
      setShowGenModal(false);
      return;
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_key_here') {
      alert('Clé OpenRouter manquante dans le fichier .env.');
      return;
    }

    setIsGenerating(true);
    setShowGenModal(false);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Mon Assistant Scolaire',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite-preview-09-2025',
          messages: [
            {
              role: 'system',
              content:
                "Tu génères uniquement un SVG de coloriage enfantin: lignes noires épaisses, fond blanc, fill='none', viewBox 0 0 1024 1024.",
            },
            { role: 'user', content: `Génère un coloriage SVG simple de : ${genPrompt}` },
          ],
        }),
      });

      if (!response.ok) throw new Error(`OpenRouter ${response.status}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Pas de réponse IA');

      const svgCode = content.match(/<svg[\s\S]*?<\/svg>/)?.[0] || content;
      const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / 1024, canvas.height / 1024) * 0.9;
        const x = canvas.width / 2 - (1024 * scale) / 2;
        const y = canvas.height / 2 - (1024 * scale) / 2;
        ctx.drawImage(img, x, y, 1024 * scale, 1024 * scale);
        saveSnapshot();

        const newCount = 5 - generationsLeft + 1;
        setGenerationsLeft(5 - newCount);

        if (selectedChild) {
          const today = new Date().toISOString().split('T')[0];
          await supabase
            .from('daily_child_stats')
            .upsert(
              {
                child_id: selectedChild.id,
                date: today,
                ai_generations_count: newCount,
              },
              { onConflict: 'child_id,date' },
            );
        }

        setIsGenerating(false);
        setGenPrompt('');
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        setIsGenerating(false);
        alert('Impossible de charger le dessin généré.');
      };

      img.src = url;
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      alert('Erreur de génération IA.');
    }
  };

  const tools = [
    { id: 'pen' as Tool, icon: Pencil, label: 'Crayon' },
    { id: 'rainbow' as Tool, icon: Brush, label: 'Rainbow' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Gomme' },
    { id: 'line' as Tool, icon: LineChart, label: 'Ligne' },
    { id: 'square' as Tool, icon: Square, label: 'Carré' },
    { id: 'circle' as Tool, icon: CircleIcon, label: 'Cercle' },
    { id: 'triangle' as Tool, icon: Triangle, label: 'Triangle' },
    { id: 'stamp-star' as Tool, icon: Star, label: 'Étoile' },
    { id: 'stamp-heart' as Tool, icon: Heart, label: 'Cœur' },
    { id: 'stamp-moon' as Tool, icon: Moon, label: 'Lune' },
  ];

  return (
    <div className="mx-auto h-[84vh] max-w-7xl pb-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 mb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Atelier d'Art 🎨</h1>
          <p className="text-slate-500 font-semibold text-sm">Libère ton imagination sur ton tableau magique !</p>
        </div>
      </header>

      <motion.section
        ref={containerRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 ${isFullscreen ? 'rounded-none' : ''
          }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4 md:p-6 bg-slate-50/30">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Outils Magiques</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Éditeur Fluide</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={undo} disabled={historyStep <= 0} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
            <button onClick={redo} disabled={historyStep >= historyRef.current.length - 1} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
            <button onClick={clearCanvas} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"><Trash2 className="h-4 w-4" /></button>
            <button onClick={downloadDrawing} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"><Download className="h-4 w-4" /></button>
            <button onClick={toggleFullscreen} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[270px_1fr]">
          <aside className="border-b border-slate-200 p-3 lg:border-b-0 lg:border-r">
            <div className="mb-3 grid grid-cols-5 gap-2 lg:grid-cols-2">
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-xs ${tool === t.id ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-3 space-y-2">
              <p className="text-xs text-slate-500">Couleurs</p>
              <div className="flex flex-wrap gap-2">
                {['#6366f1', '#0f172a', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      if (tool === 'eraser') setTool('pen');
                    }}
                    className={`h-7 w-7 rounded-full border ${color === c ? 'ring-2 ring-indigo-300' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">Épaisseur: {lineWidth}px</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setLineWidth((v) => Math.max(1, v - 1))} className="rounded-lg border border-slate-200 p-1.5 text-slate-600"><Minus className="h-3.5 w-3.5" /></button>
                <input type="range" min="1" max="40" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value, 10))} className="flex-1 accent-indigo-600" />
                <button onClick={() => setLineWidth((v) => Math.min(40, v + 1))} className="rounded-lg border border-slate-200 p-1.5 text-slate-600"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setShowGrid((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${showGrid ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                <Grid className="h-4 w-4" /> Grille
              </button>

              <button
                onClick={() => setShowGenModal(true)}
                disabled={isGenerating || generationsLeft <= 0}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} IA ({generationsLeft})
              </button>
            </div>
          </aside>

          <div
            className={`relative min-h-[360px] ${showGrid
                ? 'bg-[linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-[size:24px_24px]'
                : 'bg-white'
              }`}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="absolute inset-0 h-full w-full touch-none"
            />
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {showGenModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">Générer un coloriage IA</h3>
              <p className="mt-1 text-sm text-slate-500">Décris simplement le dessin souhaité.</p>
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Ex: un dinosaure souriant dans la jungle"
                className="mt-3 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowGenModal(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">Annuler</button>
                <button onClick={generateColoringPage} disabled={!genPrompt.trim() || isGenerating} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">Générer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}

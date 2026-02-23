import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Download, Trash2, Pencil, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          const tempImage = canvas.toDataURL();
          canvas.width = parent.offsetWidth;
          canvas.height = parent.offsetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const img = new Image();
            img.src = tempImage;
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
          }
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    // Draw a point immediately
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

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
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (confirm('Veux-tu vraiment effacer ton chef-d\'œuvre ?')) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `dessin-magique-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl p-6 md:p-8 border border-slate-100 relative overflow-hidden flex flex-col h-[75vh]"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Atelier d'Artiste</h2>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Laisse parler ton imagination</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCanvas}
              className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group shadow-sm"
              title="Tout effacer"
            >
              <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <button
              onClick={downloadDrawing}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          {/* Controls Sidebar */}
          <aside className="w-full md:w-24 bg-slate-50 rounded-[2.5rem] p-4 flex md:flex-col items-center justify-center gap-6 border border-slate-100">
            {/* Tools */}
            <div className="flex md:flex-col gap-3">
              <button
                onClick={() => setTool('pen')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${tool === 'pen' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm'
                  }`}
                title="Crayon"
              >
                <Pencil className="w-6 h-6" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm'
                  }`}
                title="Gomme"
              >
                <Eraser className="w-6 h-6" />
              </button>
            </div>

            <div className="w-px h-8 md:w-8 md:h-px bg-slate-200" />

            {/* Colors Grid */}
            <div className="flex md:grid grid-cols-2 gap-2">
              {['#6366f1', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#1e293b', '#64748b'].map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  className={`w-8 h-8 rounded-xl border-4 transition-all ${color === c && tool === 'pen' ? 'border-indigo-100 scale-125 shadow-md' : 'border-transparent hover:scale-110'
                    }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="w-px h-8 md:w-8 md:h-px bg-slate-200 hidden md:block" />

            {/* Size Slider (vertical on desktop if possible, but keep it simple) */}
            <div className="flex-1 flex flex-col justify-center gap-4 py-4 min-w-[100px] md:min-w-0">
              <input
                type="range"
                min="1"
                max="30"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-full md:h-32 md:-rotate-90 accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-400 text-center">{lineWidth}px</span>
            </div>
          </aside>

          {/* Canvas Block */}
          <div className="flex-1 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 overflow-hidden cursor-crosshair relative shadow-inner group">
            {/* Canvas Texture/Pattern background (subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full relative z-10 block"
            />

            <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Zone Créative</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

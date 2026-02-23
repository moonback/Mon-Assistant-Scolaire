import { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Download, Undo, Trash2 } from 'lucide-react';

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
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
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
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
    
    if ('touches' in e) {
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
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'mon-dessin.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-4 border-4 border-indigo-200">
        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <Palette className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Mon Tableau Magique</h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-indigo-50 rounded-2xl items-center">
          {/* Colors */}
          <div className="flex gap-2">
            {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-8 h-8 rounded-full border-2 ${color === c && tool === 'pen' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-indigo-200 mx-2" />

          {/* Tools */}
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl ${tool === 'eraser' ? 'bg-indigo-200 text-indigo-800' : 'hover:bg-indigo-100 text-slate-600'}`}
            title="Gomme"
          >
            <Eraser className="w-6 h-6" />
          </button>

          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24 accent-indigo-500"
          />

          <div className="flex-1" />

          {/* Actions */}
          <button
            onClick={clearCanvas}
            className="p-2 rounded-xl hover:bg-red-100 text-red-500 transition-colors"
            title="Tout effacer"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          
          <button
            onClick={downloadDrawing}
            className="p-2 rounded-xl hover:bg-indigo-100 text-indigo-600 transition-colors"
            title="Télécharger"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>

        <div className="relative w-full h-[500px] bg-white rounded-xl border-2 border-slate-200 overflow-hidden cursor-crosshair touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

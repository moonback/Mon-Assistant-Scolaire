import { Moon, Clock } from 'lucide-react';
import Modal from './Modal';

interface SystemModalProps {
  open: boolean;
  type: 'limit' | 'bedtime';
  message: string;
  onClose: () => void;
}

export default function SystemModal({ open, type, message, onClose }: SystemModalProps) {
  const isBedtime = type === 'bedtime';

  return (
    <Modal open={open} onClose={onClose} zIndex={200}>
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/20 text-center">
        <div className={`mx-auto w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${
          isBedtime ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
        }`}>
          {isBedtime ? <Moon className="w-12 h-12" /> : <Clock className="w-12 h-12" />}
        </div>

        <h2 className="text-3xl font-black text-slate-800 mb-4 leading-tight">
          {isBedtime ? 'Bonne nuit ! 🌙' : 'Pause nécessaire ! 🛑'}
        </h2>

        <p className="text-slate-600 font-bold text-lg mb-10 leading-relaxed">
          {message}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all ${
            isBedtime
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
          }`}
        >
          C'est compris !
        </button>
      </div>
    </Modal>
  );
}

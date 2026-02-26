import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export default function LoadingSpinner({ message, submessage }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 mb-6"
      />
      {message && (
        <h3 className="text-lg font-black text-slate-800 mb-1">{message}</h3>
      )}
      {submessage && (
        <p className="text-xs text-slate-500 font-semibold">{submessage}</p>
      )}
    </div>
  );
}

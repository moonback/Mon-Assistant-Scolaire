import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-200 transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="h-3 w-3" /> Réessayer
        </button>
      )}
    </div>
  );
}

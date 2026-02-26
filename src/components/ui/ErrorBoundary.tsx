import { Component, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            {this.props.fallbackMessage || 'Oups, quelque chose a planté !'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6 max-w-md">
            Pas de panique, ça arrive parfois. Clique sur le bouton pour réessayer.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <RefreshCcw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

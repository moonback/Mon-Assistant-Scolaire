import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { User, GraduationCap, Sparkles, Mail, Lock, ChevronRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('CE1');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              grade_level: grade,
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen magical-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.1, scale: 0.5 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [0.5, 1.2, 0.5],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute rounded-full bg-white/10 blur-3xl"
            style={{
              width: `${200 + Math.random() * 300}px`,
              height: `${200 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-[2.5rem] p-8 w-full max-w-md relative z-10 border border-white/40 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200"
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Mon École Magique</h1>
          <p className="text-slate-500 mt-2 font-medium">L'aventure de l'apprentissage commence ici !</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Ton Prénom</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
                      placeholder="Ex: Léo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Ta Classe</label>
                  <div className="relative group">
                    <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium appearance-none"
                    >
                      {['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email <span className="text-[10px] text-slate-400 uppercase tracking-wider ml-1">(Parents)</span></label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
                placeholder="parent@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mot de passe</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full magical-gradient hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <Sparkles className="animate-spin w-6 h-6" />
            ) : (
              <>
                {isSignUp ? "Créer mon compte" : "Entrer dans l'école"}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-slate-500 font-semibold text-sm hover:text-indigo-600 transition-colors"
        >
          {isSignUp ? (
            <span>Déjà un élève ? <span className="text-indigo-500">Se connecter</span></span>
          ) : (
            <span>Nouveau ici ? <span className="text-indigo-500">Créer un compte</span></span>
          )}
        </button>
      </motion.div>
    </div>
  );
}

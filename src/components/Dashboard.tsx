import { useEffect, useState } from 'react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Star, TrendingUp, Calendar, Target, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import DailyChallenges from './DailyChallenges';
import PedagogicalHub from './PedagogicalHub';
import SiblingCompetition from './SiblingCompetition';
import ParentalMissions from './ParentalMissions';

interface DashboardProps {
  onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

export default function Dashboard({ onEarnPoints }: DashboardProps) {
  const { selectedChild } = useAuth();
  const [stats, setStats] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchStats() {
      if (!selectedChild) return;

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('date', { ascending: false })
        .limit(50);

      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [selectedChild]);

  const chartData = [
    { name: 'Quiz', score: stats.filter((s) => s.activity_type === 'quiz').reduce((acc, curr) => acc + curr.score, 0) },
    { name: 'Défis', score: stats.filter((s) => s.activity_type === 'daily_challenge').reduce((acc, curr) => acc + curr.score, 0) },
    { name: 'Maths', score: stats.filter((s) => s.activity_type === 'math').reduce((acc, curr) => acc + curr.score, 0) },
    { name: 'Assistant', score: stats.filter((s) => s.activity_type === 'assistant').reduce((acc, curr) => acc + curr.score, 0) },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 p-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-slate-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bonjour, {selectedChild?.name} ! 👋</h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">Voyons tes progrès d'aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total étoiles', value: selectedChild?.stars || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Activités terminées', value: stats.length, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Niveau scolaire', value: selectedChild?.grade_level || 'N/A', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="premium-card p-6 flex items-center gap-5 border-none shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color} shadow-inner`}>
              <item.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <PedagogicalHub
        childId={selectedChild?.id || ''}
        gradeLevel={selectedChild?.grade_level || 'CM1'}
        stats={stats}
        onEarnPoints={onEarnPoints}
      />

      <SiblingCompetition />
      <ParentalMissions />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-6 border-none shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

          <div className="mb-8 relative z-10">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Répartition des points
            </h2>
            <p className="text-xs font-semibold text-slate-400">Ton investissement par matière.</p>
          </div>

          <div className="h-[280px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 10 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="score"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                  isAnimationActive={true}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-6 border-none shadow-sm"
        >
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
              <Clock className="h-5 w-5 text-indigo-600" />
              Historique des sessions
            </h2>
            <p className="text-xs font-semibold text-slate-400">Tes 5 activités les plus récentes.</p>
          </div>

          <div className="space-y-3">
            {stats.slice(0, 5).map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className="flex items-center justify-between rounded-2xl bg-slate-50/50 p-4 border border-white hover:bg-white hover:border-slate-100 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 capitalize tracking-tight">{stat.subject}</p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {new Date(stat.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600 tracking-widest">+{stat.score}</p>
                </div>
              </motion.div>
            ))}

            {stats.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Aucune aventure pour le moment !
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Commence une activité pour voir tes points ici.</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div >
  );
}

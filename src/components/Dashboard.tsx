import { useEffect, useState } from 'react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Trophy, Star, TrendingUp, Calendar, Target, Zap, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import DailyChallenges from './DailyChallenges';

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
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [selectedChild]);

  const chartData = [
    { name: 'Quiz', score: stats.filter(s => s.activity_type === 'quiz').reduce((acc, curr) => acc + curr.score, 0), color: '#8b5cf6' },
    { name: 'Maths', score: stats.filter(s => s.activity_type === 'math').reduce((acc, curr) => acc + curr.score, 0), color: '#10b981' },
    { name: 'Assistant', score: stats.filter(s => s.activity_type === 'assistant').reduce((acc, curr) => acc + curr.score, 0), color: '#0ea5e9' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse" />
        </div>
      </div>
      <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Chargement de ton univers...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Étoiles', value: selectedChild?.stars || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Défis Relevés', value: stats.length, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Niveau Actuel', value: selectedChild?.grade_level || 'N/A', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-[2.5rem] shadow-premium border ${item.border} flex items-center gap-5 interactive-card group`}
          >
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
              <p className="text-2xl font-black text-slate-800 leading-none">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily Challenges Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6 px-4">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tes Défis du Jour</h3>
        </div>
        <DailyChallenges
          childId={selectedChild?.id || ''}
          gradeLevel={selectedChild?.grade_level || 'CM1'}
          onEarnPoints={onEarnPoints}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Chart Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-3 bg-white rounded-[3rem] shadow-premium p-8 border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Ma Progression
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-2 italic">Découvre les domaines où tu brilles le plus !</p>
            </div>
          </div>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {chartData.map((item, i) => (
                    <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 16 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-premium border border-slate-100 min-w-[140px]">
                          <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">{payload[0].payload.name}</p>
                          <p className="text-2xl font-black text-slate-800">{payload[0].value} <span className="text-xs font-black text-slate-300">pts</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[16, 16, 16, 16]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGrad-${index})`} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 relative z-10">
            {chartData.map((item, i) => (
              <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 group hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="w-8 h-2 rounded-full mb-3 shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{item.name}</span>
                <span className="text-lg font-black text-slate-800">{item.score}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-[3rem] shadow-premium p-8 border border-slate-100 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              Journal de Bord
            </h3>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {stats.slice(0, 6).map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-premium rounded-3xl transition-all border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform ${stat.activity_type === 'quiz' ? 'text-violet-500' :
                    stat.activity_type === 'math' ? 'text-emerald-500' : 'text-sky-500'
                    }`}>
                    {stat.activity_type.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 capitalize text-sm">{stat.subject}</p>
                    <p className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {new Date(stat.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xl font-black text-indigo-600">+{stat.score}</div>
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">PTS</div>
                </div>
              </motion.div>
            ))}
            {stats.length === 0 && (
              <div className="text-center py-20 flex flex-col items-center flex-1 justify-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 animate-float">
                  <Trophy className="w-12 h-12 text-slate-200" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs max-w-[200px] leading-relaxed">Pas encore d'activités. C'est le moment d'apprendre !</p>
              </div>
            )}
          </div>

          {stats.length > 6 && (
            <button className="w-full mt-8 py-5 rounded-3xl bg-slate-50 text-slate-500 font-black hover:bg-indigo-600 hover:text-white hover:shadow-lg transition-all text-[10px] uppercase tracking-[0.3em] border border-slate-100 hover:border-indigo-500">
              Voir tout l'historique
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}


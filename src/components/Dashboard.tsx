import { useEffect, useState } from 'react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Trophy, Star, TrendingUp, Calendar, Target, Zap, Clock } from 'lucide-react';
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

  // Aggregate data for chart
  const chartData = [
    { name: 'Quiz', score: stats.filter(s => s.activity_type === 'quiz').reduce((acc, curr) => acc + curr.score, 0), color: '#8b5cf6', gradient: 'from-violet-500 to-purple-400' },
    { name: 'Maths', score: stats.filter(s => s.activity_type === 'math').reduce((acc, curr) => acc + curr.score, 0), color: '#10b981', gradient: 'from-emerald-500 to-teal-400' },
    { name: 'Assistant', score: stats.filter(s => s.activity_type === 'assistant').reduce((acc, curr) => acc + curr.score, 0), color: '#0ea5e9', gradient: 'from-sky-500 to-blue-400' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold">Magie en cours...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Daily Challenges */}
      <DailyChallenges
        gradeLevel={selectedChild?.grade_level || 'CM1'}
        onEarnPoints={onEarnPoints}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Étoiles', value: selectedChild?.stars || 0, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Activités', value: stats.length, icon: target => <Target className="w-6 h-6" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Niveau', value: selectedChild?.grade_level || 'N/A', icon: zap => <Zap className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 interactive-card"
          >
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
              {typeof item.icon === 'function' ? item.icon({}) : <item.icon className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-sm p-6 border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                <TrendingUp className="w-6 h-6 text-indigo-500" />
                Mon Énergie
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Répartition de tes points par matière</p>
            </div>
          </div>

          <div className="h-64 w-full">
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
                  tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[120px]">
                          <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{payload[0].payload.name}</p>
                          <p className="text-xl font-black text-slate-800">{payload[0].value} <span className="text-xs font-bold text-slate-400">pts</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGrad-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {chartData.map((item, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                <div className="w-3 h-3 rounded-full mb-2 shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.name}</span>
                <span className="text-sm font-black text-slate-700">{item.score}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] shadow-sm p-6 border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-orange-500" />
              Journal de Bord
            </h3>
          </div>

          <div className="space-y-4">
            {stats.slice(0, 5).map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-3xl transition-all border border-transparent hover:border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-base ${stat.activity_type === 'quiz' ? 'text-violet-500' :
                    stat.activity_type === 'math' ? 'text-emerald-500' : 'text-sky-500'
                    }`}>
                    {stat.activity_type.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-700 capitalize text-sm">{stat.subject}</p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                      <Calendar className="w-3 h-3" />
                      {new Date(stat.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-lg font-black text-indigo-600">+{stat.score}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</div>
                </div>
              </motion.div>
            ))}
            {stats.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold max-w-[200px]">Pas encore d'activités. C'est le moment d'apprendre !</p>
              </div>
            )}
          </div>

          {stats.length > 5 && (
            <button className="w-full mt-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-all text-sm uppercase tracking-widest">
              Voir tout l'historique
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Star, TrendingUp, Calendar, Target, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import DailyChallenges from './DailyChallenges';
import PedagogicalHub from './PedagogicalHub';

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
    { name: 'Quiz', score: stats.filter((s) => s.activity_type === 'quiz').reduce((acc, curr) => acc + curr.score, 0), color: '#6366f1' },
    { name: 'Maths', score: stats.filter((s) => s.activity_type === 'math').reduce((acc, curr) => acc + curr.score, 0), color: '#6366f1' },
    { name: 'Assistant', score: stats.filter((s) => s.activity_type === 'assistant').reduce((acc, curr) => acc + curr.score, 0), color: '#6366f1' },
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
    <div className="space-y-5">
      <DailyChallenges
        childId={selectedChild?.id || ''}
        gradeLevel={selectedChild?.grade_level || 'CM1'}
        onEarnPoints={onEarnPoints}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total points', value: selectedChild?.stars || 0, icon: Star },
          { label: 'Activités', value: stats.length, icon: Target },
          { label: 'Niveau', value: selectedChild?.grade_level || 'N/A', icon: Trophy },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900">{item.value}</p>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Répartition des points
            </h2>
            <p className="text-sm text-slate-500">Vue rapide par activité.</p>
          </div>

          <div className="h-[260px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar
                  dataKey="score"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-indigo-600" />
            Activités récentes
          </h3>

          <div className="space-y-2">
            {stats.slice(0, 5).map((stat) => (
              <div key={stat.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900 capitalize">{stat.subject}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(stat.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-indigo-700">+{stat.score}</p>
              </div>
            ))}

            {stats.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Aucune activité pour le moment.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

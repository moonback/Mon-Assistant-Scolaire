import { useEffect, useState } from 'react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Star, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!profile) return;
      
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [profile]);

  // Aggregate data for chart
  const chartData = [
    { name: 'Quiz', score: stats.filter(s => s.activity_type === 'quiz').reduce((acc, curr) => acc + curr.score, 0), color: '#8b5cf6' },
    { name: 'Maths', score: stats.filter(s => s.activity_type === 'math').reduce((acc, curr) => acc + curr.score, 0), color: '#10b981' },
    { name: 'Assistant', score: stats.filter(s => s.activity_type === 'assistant').reduce((acc, curr) => acc + curr.score, 0), color: '#0ea5e9' },
  ];

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" />
            Ma Progression
          </h2>
          <div className="bg-yellow-50 px-4 py-2 rounded-full flex items-center gap-2 border border-yellow-200">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-700">{profile?.stars || 0} étoiles</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Dernières Activités
        </h3>
        <div className="space-y-3">
          {stats.slice(0, 5).map((stat) => (
            <div key={stat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full ${
                  stat.activity_type === 'quiz' ? 'bg-violet-500' :
                  stat.activity_type === 'math' ? 'bg-emerald-500' : 'bg-sky-500'
                }`} />
                <div>
                  <p className="font-bold text-slate-700 capitalize">{stat.subject}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(stat.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="font-bold text-slate-600">+{stat.score} pts</div>
            </div>
          ))}
          {stats.length === 0 && (
            <p className="text-slate-400 text-center py-4">Pas encore d'activité. Joue pour voir tes stats !</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Star, Trophy, GraduationCap, Camera, User, Heart, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChildProfile() {
  const { selectedChild, refreshChildren } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const avatars = [
    { name: 'Aventure', seed: selectedChild?.name || 'Aventure' },
    { name: 'Magie', seed: 'Magie123' },
    { name: 'Génie', seed: 'Genius' },
    { name: 'Espace', seed: 'Space' },
    { name: 'Héros', seed: 'Hero' },
    { name: 'Artiste', seed: 'Artist' },
    { name: 'Nature', seed: 'Nature' },
    { name: 'Sport', seed: 'Sport' },
  ];

  const updateAvatar = async (seed: string) => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      const { error } = await supabase.from('children').update({ avatar_url: avatarUrl }).eq('id', selectedChild.id);

      if (error) throw error;
      setSuccess(true);
      await refreshChildren();
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-8">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <User className="h-5 w-5 text-indigo-600" /> Mon profil
        </h1>
        <p className="text-sm text-slate-500">Personnalise ton avatar et regarde ta progression.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={selectedChild?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild?.name}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{selectedChild?.name}</h2>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <GraduationCap className="h-3.5 w-3.5" /> {selectedChild?.grade_level}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Trophy className="h-4 w-4 text-indigo-600" /> Points
            </h3>
            <p className="mb-2 flex items-center gap-1 text-2xl font-semibold text-slate-900">
              {selectedChild?.stars} <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((selectedChild?.stars || 0) / 10, 100)}%` }}
                className="h-full rounded-full bg-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Camera className="h-4 w-4 text-indigo-600" /> Changer d'avatar
              </h3>
              {success && <span className="text-sm text-emerald-600">Avatar mis à jour</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {avatars.map((av) => (
                <button
                  key={av.seed}
                  onClick={() => updateAvatar(av.seed)}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-colors hover:bg-white"
                >
                  <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} />
                  </div>
                  <span className="text-xs text-slate-600">{av.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <Heart className="h-4 w-4 text-pink-500" /> Matière favorite
              </p>
              <p className="text-sm font-semibold text-slate-900">Français</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <Shield className="h-4 w-4 text-emerald-500" /> Titre
              </p>
              <p className="text-sm font-semibold text-slate-900">Apprenti Sage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

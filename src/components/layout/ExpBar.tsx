import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

interface ExpBarProps {
    stars: number;
}

export default function ExpBar({ stars }: ExpBarProps) {
    // Logic: 1 level every 200 stars
    const starsPerLevel = 200;
    const level = Math.floor(stars / starsPerLevel) + 1;
    const currentLevelStars = stars % starsPerLevel;
    const progress = (currentLevelStars / starsPerLevel) * 100;

    return (
        <div className="flex flex-col items-end gap-1.5 min-w-[140px] md:min-w-[200px]">
            <div className="flex w-full justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-sm shadow-indigo-200">
                        {level}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Niveau {level}</span>
                </div>
                <span className="text-[10px] font-black text-indigo-600">{currentLevelStars} / {starsPerLevel} EXP</span>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200/50 p-0.5 border border-white shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress_1s_linear_infinite]" />
                    <motion.div
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-sm"
                    />
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes progress {
                    from { background-position: 0 0; }
                    to { background-position: 40px 0; }
                }
            `}} />
        </div>
    );
}

interface ProgressPillProps {
  label: string;
  value: string;
  tone?: 'indigo' | 'emerald' | 'amber' | 'slate';
}

const toneClasses = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ProgressPill({ label, value, tone = 'indigo' }: ProgressPillProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneClasses[tone]}`}>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      <span className="text-sm font-extrabold">{value}</span>
    </div>
  );
}

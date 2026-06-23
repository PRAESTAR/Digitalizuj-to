'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
  moduleName?: string;
}

export default function ProgressBar({ current, total, percentage, moduleName }: ProgressBarProps) {
  return (
    <div className="w-full mb-8">
      {moduleName && (
        <div className="text-sm font-semibold text-indigo-600 mb-1.5 animate-fade-in">
          {moduleName}
        </div>
      )}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm text-slate-500">
          Otázka <span className="font-bold text-slate-800">{current + 1}</span> z {total}
        </span>
        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {percentage} %
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 progress-striped transition-all duration-700 ease-out"
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
  moduleName?: string;
}

export default function ProgressBar({ current, total, percentage, moduleName }: ProgressBarProps) {
  // Kľúč quiz.questionOf existoval od začiatku i18n, ale nikto ho nečítal —
  // text tu bol natvrdo po slovensky, takže nemecký používateľ videl
  // „Otázka 3 z 15". Našiel to verifikačný agent ako mŕtvy kľúč.
  const t = useTranslations('quiz');
  return (
    <div className="w-full mb-8">
      {moduleName && (
        <div className="text-sm font-semibold text-indigo-600 mb-1.5 animate-fade-in">
          {moduleName}
        </div>
      )}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm text-slate-500">
          {t.rich('questionOf', {
            current: current + 1,
            total,
            b: (chunks) => (
              <span className="font-bold text-slate-800">{chunks}</span>
            ),
          })}
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

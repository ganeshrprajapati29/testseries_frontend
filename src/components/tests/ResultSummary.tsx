import { Award, CheckCircle2, Clock, Crosshair, MinusCircle, Percent, Target, Trophy, Users, XCircle } from 'lucide-react';
import { formatDuration, formatScore } from '@/lib/formatters';
import type { ResultData } from '@/types';

function Ring({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${pct}% score`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/20" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 60 60)" className="text-accent-400" />
      <text x="60" y="58" textAnchor="middle" className="fill-white text-2xl font-bold">
        {formatScore(pct)}%
      </text>
      <text x="60" y="78" textAnchor="middle" className="fill-brand-100 text-[10px]">
        score
      </text>
    </svg>
  );
}

export function ResultSummary({ result }: { result: Required<Pick<ResultData, 'totalScore' | 'maximumMarks' | 'percentage'>> & ResultData }) {
  const cards = [
    { icon: CheckCircle2, label: 'Correct', value: result.correctCount, cls: 'text-emerald-600 bg-emerald-50' },
    { icon: XCircle, label: 'Incorrect', value: result.incorrectCount, cls: 'text-red-600 bg-red-50' },
    { icon: MinusCircle, label: 'Unanswered', value: result.unansweredCount, cls: 'text-slate-600 bg-slate-100' },
    { icon: Crosshair, label: 'Accuracy', value: `${formatScore(result.accuracy)}%`, cls: 'text-brand-600 bg-brand-50' },
    { icon: Clock, label: 'Time taken', value: formatDuration(result.timeTakenSeconds ?? 0), cls: 'text-violet-600 bg-violet-50' },
    { icon: Percent, label: 'Percentile', value: formatScore(result.percentile), cls: 'text-accent-600 bg-accent-50' },
  ];
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm text-brand-100">Your score</p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight">
              {formatScore(result.totalScore)}
              <span className="text-2xl font-semibold text-brand-200"> / {formatScore(result.maximumMarks)}</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-accent-300" /> Rank <b>{result.rank}</b> / {result.totalCandidates}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-accent-300" /> Topper {formatScore(result.topperScore)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent-300" /> Average {formatScore(result.averageScore)}
              </span>
            </div>
          </div>
          <Ring value={result.percentage} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className="card p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${cls}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      {result.subjectBreakdown && result.subjectBreakdown.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <Target className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold">Subject-wise analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Questions</th>
                  <th>Attempted</th>
                  <th>Correct</th>
                  <th>Incorrect</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.subjectBreakdown.map((s) => (
                  <tr key={s.subject}>
                    <td className="font-medium">{s.subject}</td>
                    <td>{s.total}</td>
                    <td>{s.attempted}</td>
                    <td className="text-emerald-700">{s.correct}</td>
                    <td className="text-red-600">{s.incorrect}</td>
                    <td className="font-semibold">{formatScore(s.score)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${s.accuracy}%` }} />
                        </div>
                        {formatScore(s.accuracy)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Cpu, DollarSign, Clock, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { SourcingMatrixData, SourcingCandidate } from '../types';

interface SourcingMatrixProps {
  data: SourcingMatrixData;
  onSelectCandidate?: (candidate: SourcingCandidate) => void;
  onAskAboutSourcing?: (query: string) => void;
}

export const SourcingMatrix: React.FC<SourcingMatrixProps> = ({
  data,
  onSelectCandidate,
  onAskAboutSourcing,
}) => {
  return (
    <div className="my-3 p-4 rounded-xl bg-[#080d17] border border-cyan-500/30 shadow-xl arc-glow-sm">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
            Comparative Sourcing Trade-Off Matrix
          </span>
          <h4 className="text-sm font-bold text-slate-100 mt-0.5">{data.categoryTitle}</h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">{data.engineeringStandard}</span>
      </div>

      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{data.tradeOffSummary}</p>

      {/* Side-by-side Grid of Candidates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {data.candidates.map((cand, idx) => {
          const isRec = cand.status === 'recommended';
          const isBudget = cand.status === 'budget';

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                isRec
                  ? 'bg-cyan-950/30 border-cyan-400/50 shadow-sm'
                  : isBudget
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      isRec
                        ? 'bg-cyan-400 text-slate-950'
                        : isBudget
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {cand.status.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{cand.manufacturer}</span>
                </div>

                <h5 className="text-xs font-bold text-slate-100">{cand.name}</h5>
                <span className="text-[11px] font-mono text-cyan-300 block">{cand.mpn}</span>

                {/* Key Electrical / Physical Metric */}
                <div className="mt-2.5 p-2 rounded bg-black/40 border border-slate-800/80 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{cand.keyMetricLabel}</span>
                    <span className="text-slate-200 font-bold">{cand.keyMetricValue}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1">
                    <span>Thermal Rating</span>
                    <span className="text-amber-300">{cand.thermalRating}</span>
                  </div>
                </div>

                {/* Supplier Pricing & Lead Time */}
                <div className="flex items-center justify-between mt-2.5 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold tabular-nums">${cand.unitPrice1k.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500">@1k</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{cand.leadTimeDays}d lead</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                  <div className="text-emerald-400/90 font-sans">
                    <strong>+</strong> {cand.pros}
                  </div>
                  <div className="text-amber-400/90 font-sans">
                    <strong>-</strong> {cand.cons}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">{cand.supplier}</span>
                {onSelectCandidate && (
                  <button
                    onClick={() => onSelectCandidate(cand)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Select</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onAskAboutSourcing && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() =>
              onAskAboutSourcing(
                `Can you run a deeper sensitivity analysis between these 3 parts in the ${data.categoryTitle} matrix? Which has lowest total cost of ownership under high temperature?`
              )
            }
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Dive Sourcing Trade-Offs</span>
          </button>
        </div>
      )}
    </div>
  );
};

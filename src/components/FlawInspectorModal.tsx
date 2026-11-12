import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Wrench, ArrowRight } from 'lucide-react';
import { CADProduct } from '../types';

interface FlawInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CADProduct;
  onSelectFlawPart: (componentName: string) => void;
  onConsultMentor: (query: string) => void;
}

export const FlawInspectorModal: React.FC<FlawInspectorModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectFlawPart,
  onConsultMentor,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [drcReport, setDrcReport] = useState<any>(null);

  if (!isOpen) return null;

  const runCloudDRC = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/cad/drc-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: product.name,
          params: {
            voltage: product.voltageRating,
            current: product.currentRating,
            dimensions: product.dimensions,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrcReport(data);
      }
    } catch (e) {
      console.warn('DRC run error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const flaws = drcReport?.flaws || product.knownFlaws;

  return (
    <div className="fixed inset-0 z-50 bg-[#05080e]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-[#0a101d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-cyan-500/20 bg-[#0e1726]/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="font-display text-lg font-bold text-slate-100 uppercase tracking-wider">
                DRC Flaw Simulation & Failure Analysis
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              IPC Standards · Thermal Dissipation Limits · Mechanical Collision Verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runCloudDRC}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Simulating Physics...' : 'Run Cloud DRC'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="p-4 bg-[#070c14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Inspection Verdict:</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-red-950/80 border border-red-500/40 text-red-300">
              {drcReport?.overallStatus || 'CRITICAL DESIGN FLAWS DETECTED (2)'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Thermal: <strong className="text-amber-400 tabular-nums">72/100</strong></span>
            <span>Machinability: <strong className="text-cyan-400 tabular-nums">84/100</strong></span>
          </div>
        </div>

        {/* Flaws List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {flaws.map((flaw: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                flaw.severity === 'critical'
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      flaw.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {flaw.component}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {flaw.rule || flaw.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    flaw.severity === 'critical'
                      ? 'bg-red-900/40 text-red-300 border border-red-500/30'
                      : 'bg-amber-900/40 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {flaw.severity}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {flaw.description}
              </p>

              <div className="mt-3 p-3 rounded-lg bg-[#070c14]/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Verified Remediation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {flaw.remediation || flaw.fixInstruction}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onConsultMentor(
                      `Let's solve the flaw on ${flaw.component}: "${flaw.description}". How do we implement the fix in CAD/PCB layout?`
                    );
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Consult Mentor on Fix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

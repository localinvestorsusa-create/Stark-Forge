import React, { useState } from 'react';
import { Maximize2, X, Compass, Shield, Gauge, Thermometer, CheckCircle2, Sparkles } from 'lucide-react';
import { ScenarioCardData } from '../types';

interface ScenarioCardProps {
  data: ScenarioCardData;
  onAskAboutScenario?: (query: string) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ data, onAskAboutScenario }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // High-fidelity procedural SVG graphics for real-world scenarios
  const renderScenarioVisual = (isFull: boolean = false) => {
    if (data.visualType === 'drone_arm') {
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full ${isFull ? 'h-80 md:h-96' : 'h-48'} rounded-lg object-cover bg-gradient-to-br from-slate-950 via-[#0a1220] to-[#050b14]`}
        >
          {/* Background blurred motion lines (prop wash) */}
          <defs>
            <linearGradient id="cf_weave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
            <radialGradient id="arc_pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
            </radialGradient>
          </defs>

          {/* 5mm 3K Carbon Fiber Arm */}
          <rect x="60" y="140" width="480" height="60" rx="6" fill="url(#cf_weave)" stroke="#334155" strokeWidth="2" />
          {/* Carbon weave pattern */}
          <path d="M 60 140 L 540 200 M 100 140 L 540 185 M 60 160 L 500 200" stroke="#1e293b" strokeWidth="1" opacity="0.6" />

          {/* Brushless Motor Bell at End of Arm */}
          <circle cx="500" cy="170" r="45" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
          <circle cx="500" cy="170" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="500" cy="170" r="8" fill="#e2e8f0" />
          {/* Propeller Blade Blur */}
          <ellipse cx="500" cy="170" rx="90" ry="12" fill="rgba(56, 189, 248, 0.15)" transform="rotate(-25 500 170)" />
          <ellipse cx="500" cy="170" rx="90" ry="12" fill="rgba(56, 189, 248, 0.15)" transform="rotate(65 500 170)" />

          {/* The Apex ESC Mounted on Arm */}
          <rect x="180" y="130" width="160" height="80" rx="4" fill="#090e17" stroke="#00f0ff" strokeWidth="2" />
          {/* Aluminum Heatsink fins */}
          <rect x="190" y="136" width="140" height="68" rx="2" fill="#1a2433" stroke="#0284c7" strokeWidth="1" />
          <line x1="210" y1="136" x2="210" y2="204" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
          <line x1="235" y1="136" x2="235" y2="204" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
          <line x1="260" y1="136" x2="260" y2="204" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
          <line x1="285" y1="136" x2="285" y2="204" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
          <line x1="310" y1="136" x2="310" y2="204" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />

          {/* 3-Phase Heavy Silicone Motor Leads to Motor */}
          <path d="M 340 150 Q 410 140 460 160" fill="none" stroke="#f59e0b" strokeWidth="4" />
          <path d="M 340 170 Q 410 165 460 170" fill="none" stroke="#0284c7" strokeWidth="4" />
          <path d="M 340 190 Q 410 195 460 180" fill="none" stroke="#ef4444" strokeWidth="4" />

          {/* Battery DC Input Leads with Low-ESR Capacitor */}
          <path d="M 180 150 L 100 145" fill="none" stroke="#ef4444" strokeWidth="5" />
          <path d="M 180 190 L 100 195" fill="none" stroke="#0f172a" strokeWidth="5" />
          {/* Electrolytic Capacitor */}
          <rect x="140" y="148" width="30" height="44" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="145" y1="148" x2="145" y2="192" stroke="#ef4444" strokeWidth="2" />

          {/* Transparent Silicone Heatshrink Shroud */}
          <rect x="170" y="124" width="180" height="92" rx="8" fill="rgba(56, 189, 248, 0.08)" stroke="rgba(0, 240, 255, 0.4)" strokeDasharray="4 4" />

          {/* Overlay Hologram Telemetry Reticle */}
          <circle cx="260" cy="170" r="45" fill="url(#arc_pulse)" />
          <circle cx="260" cy="170" r="45" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" />
          <text x="215" y="105" fill="#00f0ff" fontSize="12" fontFamily="monospace" fontWeight="bold">REAL-LIFE SCENARIO // DRONE ARM</text>
        </svg>
      );
    } else if (data.visualType === 'robotic_joint') {
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full ${isFull ? 'h-80 md:h-96' : 'h-48'} rounded-lg object-cover bg-gradient-to-br from-slate-950 via-[#0a1220] to-[#050b14]`}
        >
          {/* Robotic Joint Gimbal Axis */}
          <rect x="120" y="80" width="360" height="180" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Center Direct Drive Motor */}
          <circle cx="300" cy="170" r="70" fill="#1e293b" stroke="#00f0ff" strokeWidth="2.5" />
          <circle cx="300" cy="170" r="45" fill="#0a101d" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="300" cy="170" r="18" fill="#334155" />
          {/* Wiring Slip Ring Tube */}
          <circle cx="300" cy="170" r="8" fill="#00f0ff" />
          {/* Gimbal Arm Bracket */}
          <path d="M 160 80 L 160 260 M 440 80 L 440 260" stroke="#0284c7" strokeWidth="6" />
          <text x="180" y="60" fill="#00f0ff" fontSize="12" fontFamily="monospace" fontWeight="bold">REAL-LIFE SCENARIO // 2-AXIS ACTUATOR JOINT</text>
        </svg>
      );
    } else {
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full ${isFull ? 'h-80 md:h-96' : 'h-48'} rounded-lg object-cover bg-gradient-to-br from-slate-950 via-[#0a1220] to-[#050b14]`}
        >
          {/* Concentric Power Arc Rack */}
          <circle cx="300" cy="170" r="110" fill="#090e17" stroke="#00f0ff" strokeWidth="3" />
          <circle cx="300" cy="170" r="80" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="300" cy="170" r="45" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
          <text x="180" y="45" fill="#00f0ff" fontSize="12" fontFamily="monospace" fontWeight="bold">REAL-LIFE SCENARIO // POWER DISTRIBUTION BUS</text>
        </svg>
      );
    }
  };

  return (
    <>
      {/* Embedded Chat Card */}
      <div className="my-3 overflow-hidden rounded-xl bg-[#090e17] border border-cyan-400/40 shadow-xl arc-glow-sm">
        {/* Visual Canvas */}
        <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
          {renderScenarioVisual(false)}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-mono font-bold text-cyan-300">
            <Maximize2 className="w-4 h-4" />
            <span>Click to Inspect Full Scenario</span>
          </div>
        </div>

        {/* Telemetry & Spec Summary */}
        <div className="p-3.5 bg-[#0a1220]/95 border-t border-cyan-500/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Real-World Deployment Scenario
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-0.5">{data.title}</h4>
            </div>
            <button
              onClick={() => setIsZoomed(true)}
              className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Expand view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{data.description}</p>

          {/* Environmental Badges */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>{data.operatingTemp}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{data.vibrationRating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data.ipRating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal Zoom */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[#090e17] border border-cyan-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#0e1726]">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display text-base font-bold text-slate-100 uppercase tracking-wider">
                  Real-World Deployment Inspection: {data.title}
                </h3>
              </div>
              <button
                onClick={() => setIsZoomed(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {renderScenarioVisual(true)}

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Operating Environment & Field Installation Tips
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {data.assemblyTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {onAskAboutScenario && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setIsZoomed(false);
                      onAskAboutScenario(
                        `What are the critical assembly clearances and thermal adhesive requirements for the ${data.title} scenario?`
                      );
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Mentor About This Installation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

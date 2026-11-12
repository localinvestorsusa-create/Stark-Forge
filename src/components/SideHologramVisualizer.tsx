import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Wind,
  Shield,
  Activity,
  Layers,
  Volume2,
  Compass,
  ArrowRight,
  Info,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { ScenarioCardData } from '../types';

interface SideHologramVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData: ScenarioCardData;
  onAskClarification: (query: string) => void;
  onSpeakExplanation?: (text: string) => void;
}

export const SideHologramVisualizer: React.FC<SideHologramVisualizerProps> = ({
  isOpen,
  onClose,
  scenarioData,
  onAskClarification,
  onSpeakExplanation,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWindSim = scenarioData.scenarioSubtype === 'aerodynamic_wind_shear';
  const isUnderneath = scenarioData.scenarioSubtype === 'underneath_chassis';

  return (
    <>
      {/* Floating Side Holographic Panel (Desktop / Tablet: right dock; Mobile: bottom card) */}
      <div className="fixed top-16 right-3 bottom-20 z-30 w-[340px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-[#070c14]/95 border border-cyan-400/40 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.25)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-3.5 border-b border-cyan-500/20 bg-[#0a101d]/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              {isWindSim ? <Wind className="w-4 h-4 animate-pulse" /> : isUnderneath ? <Layers className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                {isWindSim
                  ? 'Aero Wind & Gravity Simulation'
                  : isUnderneath
                  ? 'Underneath Chassis View'
                  : 'Real-Life Scenario Visual'}
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate max-w-[210px]">
                {scenarioData.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onSpeakExplanation && (
              <button
                onClick={() => onSpeakExplanation(scenarioData.description)}
                className="p-1.5 rounded-lg text-cyan-300 hover:bg-cyan-950 border border-cyan-500/30 transition-colors"
                title="Hear mentor explain visual"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setZoomOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              title="Full screen view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ONE SINGLE PICTURE DISPLAY */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Main Visual Picture Area with High-Tech Holographic Styling & Overlays */}
          <div className="relative w-full h-56 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#02050a] shadow-inner group">
            {/* Background SVG Holographic Graphic Representation */}
            {isWindSim ? (
              // Aerodynamic Wind Simulation Visual
              <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
                <defs>
                  <linearGradient id="windStream" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="gravityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* Dark atmospheric wind-tunnel chamber */}
                <rect width="400" height="240" fill="#040812" />

                {/* Drone Silhouette on Carbon Arm */}
                <g transform="translate(180, 110)">
                  {/* Central Hub */}
                  <rect x="-35" y="-15" width="70" height="30" rx="8" fill="#1e293b" stroke="#00f0ff" strokeWidth="2" />
                  <text x="-25" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">APEX ESC</text>

                  {/* Motor & Propeller Wash */}
                  <circle cx="85" cy="0" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <ellipse cx="85" cy="0" rx="42" ry="6" fill="#f59e0b" opacity="0.3" className="animate-spin" />
                  <line x1="35" y1="0" x2="71" y2="0" stroke="#475569" strokeWidth="6" />

                  {/* Left Motor */}
                  <circle cx="-85" cy="0" r="14" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
                  <ellipse cx="-85" cy="0" rx="42" ry="6" fill="#00f0ff" opacity="0.3" className="animate-spin" />
                  <line x1="-35" y1="0" x2="-71" y2="0" stroke="#475569" strokeWidth="6" />
                </g>

                {/* Streamlines of 45-Knot Crosswind entering from left */}
                {[30, 60, 90, 120, 150, 180, 210].map((y, i) => (
                  <path
                    key={i}
                    d={`M 10 ${y} Q 140 ${y + (i > 3 ? 15 : -15)} 240 ${y + (i > 3 ? 35 : -35)} T 390 ${y + (i > 3 ? 45 : -45)}`}
                    fill="none"
                    stroke="url(#windStream)"
                    strokeWidth="2.5"
                    strokeDasharray={i % 2 === 0 ? '6 3' : '10 4'}
                    opacity={0.75}
                  />
                ))}

                {/* Wind Force Vector Arrow */}
                <g transform="translate(30, 40)">
                  <line x1="0" y1="0" x2="65" y2="15" stroke="#00f0ff" strokeWidth="3" markerEnd="url(#arrow)" />
                  <polygon points="65,15 55,9 58,19" fill="#00f0ff" />
                  <text x="0" y="-8" fill="#00f0ff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    45-KT CROSSWIND (8.6N)
                  </text>
                </g>

                {/* Gravity Downward Pull Vector */}
                <g transform="translate(180, 145)">
                  <line x1="0" y1="0" x2="0" y2="55" stroke="url(#gravityGrad)" strokeWidth="3.5" />
                  <polygon points="0,55 -5,45 5,45" fill="#ef4444" />
                  <text x="10" y="35" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    GRAVITY 1G (9.81 m/s²)
                  </text>
                </g>

                {/* Compensating Upward Thrust Vector on Port Motor */}
                <g transform="translate(265, 80)">
                  <line x1="0" y1="40" x2="0" y2="0" stroke="#f59e0b" strokeWidth="3.5" />
                  <polygon points="0,0 -5,10 5,10" fill="#f59e0b" />
                  <text x="-40" y="-8" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    COUNTER-THRUST (+24%)
                  </text>
                </g>
              </svg>
            ) : isUnderneath ? (
              // Underneath Chassis View Visual
              <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
                <rect width="400" height="240" fill="#050a14" />

                {/* Milled CNC Aluminum 6061 Bottom Plate */}
                <rect x="70" y="30" width="260" height="180" rx="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />

                {/* Thermal Dissipation Channel Grooves */}
                {[55, 75, 95, 115, 135, 155, 175].map((y, i) => (
                  <line key={i} x1="90" y1={y} x2="310" y2={y} stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                ))}

                {/* Silicone Thermal Gap Pad (6.0 W/mK) Inset */}
                <rect x="120" y="60" width="160" height="120" rx="8" fill="#0284c7" fillOpacity="0.3" stroke="#00f0ff" strokeWidth="2" strokeDasharray="4 2" />
                <text x="140" y="105" fill="#00f0ff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  6.0 W/m·K THERMAL PAD
                </text>
                <text x="145" y="122" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  0.5mm Compression @ 25 PSI
                </text>

                {/* Matrix of 16 Soldered Thermal Vias */}
                {[80, 100, 120, 140].map((y) =>
                  [150, 180, 210, 240].map((x) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y + 15} r="3" fill="#f59e0b" stroke="#ef4444" strokeWidth="1" />
                  ))
                )}

                {/* M3 Counterbore Mounting Holes */}
                <circle cx="85" cy="45" r="7" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
                <circle cx="315" cy="45" r="7" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
                <circle cx="85" cy="195" r="7" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
                <circle cx="315" cy="195" r="7" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />

                <text x="110" y="222" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  CNC 6061-T6 HEATSINK BASEPLATE
                </text>
              </svg>
            ) : (
              // Operational Field Installation Visual (Drone Arm / Robot)
              <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
                <rect width="400" height="240" fill="#050811" />

                {/* Matte 3K Carbon-Fiber Arm */}
                <rect x="30" y="80" width="340" height="80" rx="8" fill="#18181b" stroke="#334155" strokeWidth="2" />

                {/* Carbon Weave Texture Lines */}
                {[40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((x) => (
                  <line key={x} x1={x} y1="80" x2={x + 20} y2="160" stroke="#27272a" strokeWidth="2" />
                ))}

                {/* Mounted ESC Controller */}
                <rect x="120" y="90" width="160" height="60" rx="6" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
                <text x="135" y="125" fill="#e2e8f0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  APEX 40A ESC
                </text>

                {/* Propeller Wash Downward Airflow */}
                {[130, 160, 190, 220, 250].map((x) => (
                  <path key={x} d={`M ${x} 20 L ${x} 85`} stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
                ))}
                <text x="150" y="15" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  PROPELLER WASH (~18 m/s)
                </text>

                {/* 14AWG Silicone Motor Leads */}
                <path d="M 280 105 Q 310 95 350 100" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                <path d="M 280 120 Q 310 120 350 120" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                <path d="M 280 135 Q 310 145 350 140" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

                {/* 35V Low-ESR Filter Capacitor */}
                <rect x="75" y="100" width="35" height="40" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="80" y="125" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">470µF</text>
              </svg>
            )}

            {/* Interactive Pinpoint Annotations on the Single Image */}
            {scenarioData.visualAnnotations?.map((annot, idx) => (
              <div
                key={idx}
                style={{ left: `${annot.xPct}%`, top: `${annot.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                onClick={() => setActiveMarker(activeMarker === annot.label ? null : annot.label)}
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full bg-cyan-400/30 border border-cyan-400 animate-ping absolute" />
                  <span className="w-4 h-4 rounded-full bg-cyan-400 border border-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-950 shadow-md">
                    {idx + 1}
                  </span>
                </div>

                {activeMarker === annot.label && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 p-2 rounded-lg bg-[#070c14] border border-cyan-400/80 text-[10px] font-mono text-cyan-200 shadow-xl z-20 backdrop-blur-md">
                    <span className="font-bold text-white block mb-0.5">{annot.label}</span>
                    {annot.note}
                  </div>
                )}
              </div>
            ))}

            {/* Fullscreen Magnifier Overlay button */}
            <button
              onClick={() => setZoomOpen(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-md bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
              title="Inspect high-res visual"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spoken Mentor Story Quote */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 to-[#0a101d] border border-cyan-500/30">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold mb-1">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Mentor Field Briefing</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              "{scenarioData.description}"
            </p>
          </div>

          {/* Physics Telemetry & Ratings Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {scenarioData.physicsVectors ? (
              <>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Crosswind Velocity:</span>
                  <span className="text-cyan-300 font-bold">{scenarioData.physicsVectors.windSpeedKnots} Knots</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Downforce & Gravity:</span>
                  <span className="text-purple-300 font-bold">{scenarioData.physicsVectors.gravityVector}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2">
                  <span className="text-slate-500 block text-[10px]">ESC Dynamic Response:</span>
                  <span className="text-amber-300 font-bold">{scenarioData.physicsVectors.thrustVector}</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Vibration Rating:</span>
                  <span className="text-slate-200 font-bold">{scenarioData.vibrationRating}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Enclosure Rating:</span>
                  <span className="text-emerald-400 font-bold">{scenarioData.ipRating}</span>
                </div>
              </>
            )}
          </div>

          {/* Interactive 'Do you want to see this in another scenario?' Prompt Section */}
          <div className="p-3 rounded-xl bg-[#09111e] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 font-display">
                Do you want to see this in another scenario?
              </span>
              <span className="text-[10px] font-mono text-slate-500">Voice-controlled</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Control with your words: just say <span className="text-cyan-300 font-bold">"I want to see it in another scenario"</span> or choose below:
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              {!isUnderneath && (
                <button
                  onClick={() => onAskClarification('Can you show me more of the underneath view of this material on this device?')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-400/50 hover:bg-cyan-950/40 text-left text-xs font-mono text-cyan-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    "Show underneath chassis view"
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}

              {!isWindSim && (
                <button
                  onClick={() => onAskClarification('In a situation that there is a lot of wind, can you show me how the drone will react with wind and gravity?')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-400/50 hover:bg-cyan-950/40 text-left text-xs font-mono text-cyan-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    "Simulate 45-knot wind & gravity"
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}

              {isWindSim && (
                <button
                  onClick={() => onAskClarification('Can you show me how the ESC looks installed in the real-life drone arm?')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-400/50 hover:bg-cyan-950/40 text-left text-xs font-mono text-cyan-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    "Back to operational field view"
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Fullscreen Zoom Modal */}
      {zoomOpen && (
        <div className="fixed inset-0 z-50 bg-[#05080e]/98 backdrop-blur-2xl p-4 sm:p-8 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-4xl bg-[#070c14] border border-cyan-400/50 rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
              <h3 className="font-display font-bold text-slate-100 text-lg">
                {scenarioData.title}
              </h3>
              <button
                onClick={() => setZoomOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#02050a] flex items-center justify-center">
              <p className="text-sm font-mono text-slate-400 text-center max-w-md p-4">
                {scenarioData.description}
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setZoomOpen(false)}
                className="px-4 py-2 text-xs font-mono font-bold bg-cyan-400 text-slate-950 rounded-lg"
              >
                Close Zoom View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

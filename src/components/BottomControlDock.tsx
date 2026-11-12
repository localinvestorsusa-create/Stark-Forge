import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  Camera,
  Flame,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CADProduct, MechanicalPart, ProductId } from '../types';
import { CAD_PRODUCTS } from '../cad/products';

interface BottomControlDockProps {
  currentProduct: CADProduct;
  onSelectProduct: (id: ProductId) => void;
  explodedProgress: number;
  onChangeExploded: (val: number) => void;
  simulationActive: boolean;
  onToggleSimulation: () => void;
  cameraPreset: 'iso' | 'top' | 'front' | 'cross' | 'underneath' | 'macro';
  onChangeCameraPreset: (preset: 'iso' | 'top' | 'front' | 'cross' | 'underneath' | 'macro') => void;
  selectedPart: MechanicalPart | null;
  onClearSelectedPart: () => void;
  onAskAboutPart: (part: MechanicalPart) => void;
  onOpenSchematic?: () => void;
  xrayMode?: boolean;
  onToggleXray?: () => void;
  hiddenPartIds?: string[];
  onRestoreParts?: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  currentProduct,
  onSelectProduct,
  explodedProgress,
  onChangeExploded,
  simulationActive,
  onToggleSimulation,
  cameraPreset,
  onChangeCameraPreset,
  selectedPart,
  onClearSelectedPart,
  onAskAboutPart,
  onOpenSchematic,
  xrayMode = false,
  onToggleXray,
  hiddenPartIds = [],
  onRestoreParts,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-none">
      {/* Selected Part Floating Telemetry Card */}
      {selectedPart && !isCollapsed && (
        <div className="mb-3 p-4 bg-[#0a101d]/95 border border-cyan-400/40 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto arc-glow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <span>Selected Sub-Component</span>
                <span aria-hidden="true">·</span>
                <span>{selectedPart.manufacturingProcess}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedPart.toleranceGrade}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100 mt-0.5">{selectedPart.name}</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                {selectedPart.description}
              </p>
              {selectedPart.flawNotice && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedPart.flawNotice}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Estimated Lead</span>
                <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                  {selectedPart.estimatedLeadDays} Days · ${selectedPart.unitCostUsd.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onAskAboutPart(selectedPart)}
                  className="px-3 py-1 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap"
                >
                  Ask Mentor
                </button>
                <button
                  onClick={onClearSelectedPart}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Unified Bottom Dock */}
      <div className="relative pointer-events-auto">
        {/* Collapse / Expand Toggle Button */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-4 py-1 text-[11px] font-mono uppercase tracking-wider text-cyan-300 bg-[#0a101d]/90 border border-b-0 border-cyan-500/30 rounded-t-lg hover:text-cyan-200 hover:bg-[#0e1726] transition-colors"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3 bg-[#0a101d]/95 border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Product Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
                {(Object.keys(CAD_PRODUCTS) as ProductId[]).map((pid) => (
                  <button
                    key={pid}
                    onClick={() => onSelectProduct(pid)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      currentProduct.id === pid
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pid === 'clean_slate'
                      ? 'Clean Slate'
                      : pid === 'esc_controller'
                      ? 'Drone ESC 40A'
                      : pid === 'micro_gimbal'
                      ? 'Titan Gimbal'
                      : 'Arc Power Bus'}
                  </button>
                ))}
              </div>

              {/* Exploded View Slider */}
              <div className="flex items-center gap-3 min-w-[220px] max-w-xs flex-1">
                <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>EXPLODED VIEW</span>
                    <span className="text-cyan-300 font-bold tabular-nums">
                      {Math.round(explodedProgress * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explodedProgress}
                    onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
                {explodedProgress > 0 && (
                  <button
                    onClick={() => onChangeExploded(0)}
                    title="Reset assembly"
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
                <button
                  onClick={() => onChangeCameraPreset('iso')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'iso'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ISO
                </button>
                <button
                  onClick={() => onChangeCameraPreset('top')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'top'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PCB TOP
                </button>
                <button
                  onClick={() => onChangeCameraPreset('front')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'front'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  FRONT
                </button>
                <button
                  onClick={() => onChangeCameraPreset('cross')}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'cross'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CROSS
                </button>
                <button
                  onClick={() => onChangeCameraPreset('underneath')}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'underneath'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="View underneath chassis & thermal pad"
                >
                  UNDER
                </button>
                <button
                  onClick={() => {
                    onChangeCameraPreset('macro');
                    if (onOpenSchematic) onOpenSchematic();
                  }}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                    cameraPreset === 'macro'
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'text-cyan-300 hover:text-white bg-cyan-950/40'
                  }`}
                  title="Zoom into macroscopic circuitry & schematics"
                >
                  MACRO
                </button>
              </div>

              {/* X-Ray See-Through Enclosure Mode Toggle */}
              {onToggleXray && (
                <button
                  onClick={onToggleXray}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all border whitespace-nowrap ${
                    xrayMode
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-cyan-400/50'
                  }`}
                  title="Toggle see-through translucent enclosure to inspect internal circuitry"
                >
                  <Eye className={`w-3.5 h-3.5 ${xrayMode ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{xrayMode ? 'X-Ray: ON' : 'X-Ray View'}</span>
                </button>
              )}

              {/* Restore Hidden Components Button */}
              {hiddenPartIds && hiddenPartIds.length > 0 && onRestoreParts && (
                <button
                  onClick={onRestoreParts}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-950 border border-amber-500/50 rounded-lg transition-colors whitespace-nowrap"
                  title="Restore all hidden components to 3D design"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore ({hiddenPartIds.length})</span>
                </button>
              )}

              {/* Thermal / Stress Simulation Toggle */}
              <button
                onClick={onToggleSimulation}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${
                  simulationActive
                    ? 'bg-red-950/60 text-red-300 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-cyan-300'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${simulationActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{simulationActive ? 'Thermal Sim: Active' : 'Thermal Map'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

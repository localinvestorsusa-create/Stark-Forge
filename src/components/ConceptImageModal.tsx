import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Wind, Flame, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { ScenarioCardData } from '../types';

interface ConceptImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onImageGenerated: (data: ScenarioCardData) => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Extreme Wind Shear & Turbulence',
    icon: Wind,
    type: 'aerodynamic_wind_shear',
    prompt:
      'Quadcopter drone encountering 50-knot severe crosswind and aerodynamic turbulence, high-speed camera capture with visible wind streamlines, prop wash vortices, and telemetry HUD overlay.',
  },
  {
    title: 'Underneath Chassis & Thermal Interface',
    icon: Flame,
    type: 'underneath_chassis',
    prompt:
      'Underneath view of custom CNC 6061 aluminum motor controller enclosure showing thermal gap pad, 16x soldered via matrix, and silicone wire relief bracket mounted to carbon fiber.',
  },
  {
    title: 'Field Installation & Heavy Silicone Leads',
    icon: Eye,
    type: 'field_installation',
    prompt:
      'Commercial close-up photograph of 40A brushless motor controller strapped to 3K matte weave carbon fiber drone arm, high-flex 14AWG silicone wires soldered to gold-plated pads, workshop lighting.',
  },
  {
    title: 'Microscopic GaN Transistor Cross-Section',
    icon: Sparkles,
    type: 'custom',
    prompt:
      'Scanning electron microscope style macro inspection of Gallium-Nitride power FET showing aluminum bond wires, direct bonded copper ceramic substrate, and micro-via thermal heat dissipation.',
  },
];

export const ConceptImageModal: React.FC<ConceptImageModalProps> = ({
  isOpen,
  onClose,
  productName,
  onImageGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>('field_installation');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPromptToUse?: string, scenarioType?: string) => {
    const finalPrompt = customPromptToUse || prompt;
    if (!finalPrompt.trim() && !scenarioType) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/scenario/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productName,
          scenarioType: scenarioType || selectedScenarioType,
          customPrompt: finalPrompt.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onImageGenerated(data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to generate visual concept:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl flex flex-col bg-[#070c14] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#0a121e]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-slate-100 uppercase">
                Real-Life Scenario & Concept Visualizer
              </h2>
              <p className="text-xs text-slate-400">
                Generate high-fidelity hardware photography and operational physics scenarios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Presets */}
          <div>
            <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2">
              Instant Engineering Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_PROMPTS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setPrompt(p.prompt);
                      setSelectedScenarioType(p.type);
                      handleGenerate(p.prompt, p.type);
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0a121e]/90 border border-cyan-500/20 hover:border-cyan-400 text-left transition-all group disabled:opacity-50"
                  >
                    <div className="p-1.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                        {p.prompt}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1.5">
              Or Describe A Specific Scenario / Teardown
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Show this ESC installed under the high-pressure water spray of an agricultural drone, showing IP67 silicone conformal seal protection..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-slate-300">
              Renders exactly one picture in your side visualizer with interactive specs
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading || !prompt.trim()}
                onClick={() => handleGenerate()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Scenario</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

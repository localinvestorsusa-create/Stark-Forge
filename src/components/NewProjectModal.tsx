import React, { useState } from 'react';
import { X, Sparkles, Plus, Zap, Cpu, Compass, Waves, CheckCircle2, ArrowRight } from 'lucide-react';
import { CADProduct, ProductId } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: {
    name: string;
    category: string;
    voltage: string;
    current: string;
    dimensions: string;
    summary: string;
  }) => void;
  onClearWorkbench: () => void;
}

const PROJECT_TEMPLATES = [
  {
    id: 'heavy_vtol',
    title: 'Heavy-Lift VTOL Drone Avionics',
    category: 'Autonomous Avionics & High-Current Distribution',
    voltage: '44.4V - 50.4V (12S LiPo)',
    current: '120A Continuous / 200A Burst',
    dimensions: '65.0mm × 48.0mm × 14.5mm',
    icon: Zap,
    summary:
      'High-reliability dual-redundant power distribution and FOC motor control designed for harsh agricultural and industrial delivery drones with active gate-loop transient suppression.',
    recommendedTags: ['12S LiPo', '120A Cont', 'IP67 Enclosure', 'CAN-FD Bus'],
  },
  {
    id: 'gan_inverter',
    title: 'GaN Solid-State Dual Inverter',
    category: 'High-Frequency Power Electronics',
    voltage: '60V - 100V DC Bus',
    current: '200A Phase Peak',
    dimensions: '52.0mm × 36.0mm × 11.0mm',
    icon: Cpu,
    summary:
      'Ultra-compact Gallium-Nitride power stage switching at 100kHz with near-zero reverse recovery losses and direct aluminum-nitride ceramic thermal heat-sinking.',
    recommendedTags: ['100kHz PWM', 'EPC GaN FETs', 'Direct Copper Bond', 'Low ESL'],
  },
  {
    id: 'robotic_joint',
    title: 'High-Torque Robotic Joint Actuator',
    category: 'Robotics & Precision Motion',
    voltage: '24V - 48V Industrial',
    current: '35A Continuous',
    dimensions: 'Ø72.0mm × 38.0mm Cylindrical',
    icon: Compass,
    summary:
      'Integrated cycloidal speed reducer with high-pole outrunner brushless stator and 18-bit magnetic on-axis absolute angle encoder for collaborative robotics.',
    recommendedTags: ['Cycloidal 30:1', 'FOC Sine Wave', '18-Bit Absolute', 'Zero Backlash'],
  },
  {
    id: 'marine_thruster',
    title: 'Submersible Autonomous Thruster',
    category: 'Marine Robotics & Sub-Aquatic ROV',
    voltage: '14.8V - 25.2V (4S-6S LiPo)',
    current: '50A Continuous',
    dimensions: 'Ø85.0mm × 110.0mm Shrouded',
    icon: Waves,
    summary:
      'Pressure-compensated magnetic drive thruster with potted stator electronics and hydrodynamic nozzle for underwater search-and-rescue ROVs.',
    recommendedTags: ['IP68 Submersible', 'Magnetic Coupler', 'Potted Stator', '300m Depth'],
  },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onClearWorkbench,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Power Electronics & Robotics');
  const [customVoltage, setCustomVoltage] = useState('24V - 48V DC');
  const [customCurrent, setCustomCurrent] = useState('40A Continuous');
  const [customDimensions, setCustomDimensions] = useState('50.0mm × 35.0mm × 12.0mm');
  const [customSummary, setCustomSummary] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSelectTemplate({
      name: customName.trim(),
      category: customCategory.trim(),
      voltage: customVoltage.trim(),
      current: customCurrent.trim(),
      dimensions: customDimensions.trim(),
      summary: customSummary.trim() || 'Custom hardware prototyping architecture initialized on Stark Forge optical breadboard.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#070c14] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#0a121e]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-slate-100 uppercase">
                New Project Build Studio · Clean Slate
              </h2>
              <p className="text-xs text-slate-400">
                Wipe the workbench clean and initialize a brand-new certified engineering project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearWorkbench();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-mono font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 rounded-lg transition-colors"
            >
              Wipe Bench Only
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-[#070c14] gap-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 text-xs font-mono font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              activeTab === 'templates'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            Certified Starter Architectures (4)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 text-xs font-mono font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              activeTab === 'custom'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            Custom Hardware Spec
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
          {activeTab === 'templates' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROJECT_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <div
                    key={tmpl.id}
                    className="flex flex-col justify-between p-5 rounded-lg bg-[#0a121e]/80 border border-cyan-500/20 hover:border-cyan-400/60 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] group text-left"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {tmpl.title}
                            </h3>
                            <span className="text-[11px] font-mono text-cyan-400/80">
                              {tmpl.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {tmpl.summary}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800 mb-3">
                        <div>
                          <span className="text-slate-300">Voltage:</span>{' '}
                          <span className="text-cyan-300 font-bold">{tmpl.voltage}</span>
                        </div>
                        <div>
                          <span className="text-slate-300">Current:</span>{' '}
                          <span className="text-cyan-300 font-bold">{tmpl.current}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-300">Envelope:</span>{' '}
                          <span className="text-slate-300">{tmpl.dimensions}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tmpl.recommendedTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/60 text-cyan-300 rounded border border-cyan-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTemplate({
                          name: tmpl.title,
                          category: tmpl.category,
                          voltage: tmpl.voltage,
                          current: tmpl.current,
                          dimensions: tmpl.dimensions,
                          summary: tmpl.summary,
                        });
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                    >
                      <span>Initialize Build</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                  Project / Device Name *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Apex Falcon 80A Brushless ESC or High-Torque Cycloidal Drive"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-cyan-500/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                    Engineering Category
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                    Operating Voltage Rating
                  </label>
                  <input
                    type="text"
                    value={customVoltage}
                    onChange={(e) => setCustomVoltage(e.target.value)}
                    placeholder="e.g., 22.2V - 33.6V (6S-8S LiPo)"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                    Continuous Current
                  </label>
                  <input
                    type="text"
                    value={customCurrent}
                    onChange={(e) => setCustomCurrent(e.target.value)}
                    placeholder="e.g., 60A Cont / 100A Burst"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                    Physical Envelope (L × W × H)
                  </label>
                  <input
                    type="text"
                    value={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.value)}
                    placeholder="e.g., 42.0mm × 28.0mm × 8.5mm"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                  Design Brief & Engineering Requirements
                </label>
                <textarea
                  rows={3}
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  placeholder="Describe electrical specs, thermal targets, mechanical load constraints, or target operating environments..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Initialize Custom Build</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

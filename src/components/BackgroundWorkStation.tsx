import React, { useState, useEffect } from 'react';
import {
  Activity,
  Square,
  Play,
  Sliders,
  RotateCcw,
  Plus,
  Terminal,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BackgroundTask, CADProduct } from '../types';

interface BackgroundWorkStationProps {
  tasks: BackgroundTask[];
  onStopTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onModifyTask: (taskId: string, newParams: any) => void;
  onStartNewTask: (title: string, params: any) => void;
  currentProduct: CADProduct;
  onAskMentorAboutWork: (query: string) => void;
}

export const BackgroundWorkStation: React.FC<BackgroundWorkStationProps> = ({
  tasks,
  onStopTask,
  onResumeTask,
  onModifyTask,
  onStartNewTask,
  currentProduct,
  onAskMentorAboutWork,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [isEditingParams, setIsEditingParams] = useState(false);

  // Edit parameters state
  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const [editCurrent, setEditCurrent] = useState<number>(activeTask?.parameters.continuousCurrentA || 40);
  const [editTemp, setEditTemp] = useState<number>(activeTask?.parameters.ambientTempC || 25);
  const [editCopper, setEditCopper] = useState<number>(activeTask?.parameters.copperOunces || 2.0);
  const [editAirflow, setEditAirflow] = useState<number>(activeTask?.parameters.airflowVelocityMs || 0.5);
  const [editVias, setEditVias] = useState<number>(activeTask?.parameters.thermalViaCount || 12);

  // Sync edits when active task changes
  useEffect(() => {
    if (activeTask) {
      setEditCurrent(activeTask.parameters.continuousCurrentA || 40);
      setEditTemp(activeTask.parameters.ambientTempC || 25);
      setEditCopper(activeTask.parameters.copperOunces || 2.0);
      setEditAirflow(activeTask.parameters.airflowVelocityMs || 0.5);
      setEditVias(activeTask.parameters.thermalViaCount || 12);
    }
  }, [activeTask?.id]);

  const handleApplyModifiedPast = () => {
    if (!activeTask) return;
    onModifyTask(activeTask.id, {
      continuousCurrentA: editCurrent,
      ambientTempC: editTemp,
      copperOunces: editCopper,
      airflowVelocityMs: editAirflow,
      thermalViaCount: editVias,
    });
    setIsEditingParams(false);
  };

  if (!activeTask) {
    return (
      <div className="p-8 text-center bg-[#070c14] border border-slate-800 rounded-2xl">
        <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-200">Engineering Work Engine Idle</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No background computation tasks currently running. Launch a simulation below.
        </p>
        <button
          onClick={() =>
            onStartNewTask('IPC-2152 Thermal & Current Carrying Simulation', {
              continuousCurrentA: 40,
              ambientTempC: 25,
              copperOunces: 2.0,
            })
          }
          className="mt-4 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
        >
          Launch Thermal Simulation
        </button>
      </div>
    );
  }

  const isRunning = activeTask.status === 'running';

  return (
    <div className="bg-[#070c14] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Top Banner: Work vs Communication separation announcement */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
              isRunning
                ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-400'
                : 'bg-amber-950/60 border-amber-400/50 text-amber-400'
            }`}
          >
            <Activity className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span className="text-cyan-400 font-bold">Autonomous Work Station</span>
              <span aria-hidden="true">·</span>
              <span>Independent of Chat</span>
              <span aria-hidden="true">·</span>
              <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {activeTask.status.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">{activeTask.title}</h3>
          </div>
        </div>

        {/* Task Control Buttons */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={() => onStopTask(activeTask.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all"
              title="Stop mentor from continuing work"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Working</span>
            </button>
          ) : (
            <button
              onClick={() => onResumeTask(activeTask.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Work</span>
            </button>
          )}

          <button
            onClick={() => setIsEditingParams(!isEditingParams)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isEditingParams
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Modify Past</span>
          </button>

          <button
            onClick={() =>
              onAskMentorAboutWork(
                `Regarding the active work task "${activeTask.title}" (${activeTask.phase}): What are the critical risks at current progress ${activeTask.progress}%?`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask About This Work</span>
          </button>
        </div>
      </div>

      {/* Progress & Current Phase */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
          <span className="text-cyan-300 font-semibold">{activeTask.phase}</span>
          <span className="font-bold text-slate-100 tabular-nums">{activeTask.progress}%</span>
        </div>

        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isRunning
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                : 'bg-amber-400'
            }`}
            style={{ width: `${activeTask.progress}%` }}
          />
        </div>
      </div>

      {/* Parameter Reconfiguration / "Modify the Past" Drawer */}
      {isEditingParams && (
        <div className="mt-4 p-4 rounded-xl bg-[#0a101d] border border-cyan-400/40 arc-glow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                Modify Past Task Baseline & Recalculate
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Editing historical boundary conditions
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Continuous Load (A)
              </label>
              <input
                type="number"
                value={editCurrent}
                onChange={(e) => setEditCurrent(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Ambient Temp (°C)
              </label>
              <input
                type="number"
                value={editTemp}
                onChange={(e) => setEditTemp(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Copper Weight (oz)
              </label>
              <input
                type="number"
                step="0.5"
                value={editCopper}
                onChange={(e) => setEditCopper(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Airflow (m/s)
              </label>
              <input
                type="number"
                step="0.1"
                value={editAirflow}
                onChange={(e) => setEditAirflow(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Thermal Vias
              </label>
              <input
                type="number"
                value={editVias}
                onChange={(e) => setEditVias(parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditingParams(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyModifiedPast}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Apply Parameters & Recalculate</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Telemetry Calculation Logs */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Background Calculation Log Feed</span>
          </div>
          <span>Updated in Real-Time</span>
        </div>

        <div className="bg-[#05080e] p-3 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
          {activeTask.telemetryLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-400">
              <span className="text-cyan-500 select-none">&gt;</span>
              <span className={log.includes('USER') ? 'text-amber-300 font-bold' : ''}>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

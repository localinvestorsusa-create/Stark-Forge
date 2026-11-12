import React from 'react';
import { Sparkles, Video, Layers, Cpu, Zap, Plus, Image as ImageIcon, History, Cloud, Download, Check } from 'lucide-react';

export type ActiveViewMode = 'cad' | 'schematic' | 'visualizer' | 'vision' | 'work' | 'bom' | 'drc';

interface TopBarProps {
  activeView: ActiveViewMode;
  onChangeView: (view: ActiveViewMode) => void;
  onOpenMentor: () => void;
  onOpenNewProject?: () => void;
  onOpenConceptVisualizer?: () => void;
  onOpenHistory?: () => void;
  cloudSyncStatus?: 'synced' | 'saving' | 'offline';
  lastSavedTime?: string;
  mentorUnread?: boolean;
  activeTaskRunning?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onChangeView,
  onOpenMentor,
  onOpenNewProject,
  onOpenConceptVisualizer,
  onOpenHistory,
  cloudSyncStatus = 'synced',
  lastSavedTime,
  mentorUnread = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5 bg-[#05080e]/95 border-b border-cyan-500/20 backdrop-blur-md">
      {/* Zone 1: Wordmark & Cloud Sync Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onChangeView('cad');
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-400/40 arc-glow-sm transition-all group-hover:border-cyan-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div className="absolute inset-0 rounded-lg bg-cyan-400/10 pointer-events-none" />
          </div>
          <span className="font-display text-base sm:text-lg font-bold tracking-wider text-slate-100 uppercase whitespace-nowrap">
            STARK <span className="text-cyan-400">FORGE</span>
          </span>
        </a>

        {/* Zero Data Loss Cloud Status Indicator */}
        <div
          title={
            cloudSyncStatus === 'synced'
              ? `0% Data Loss Guaranteed: State continuously auto-saved to cloud & local disk (${lastSavedTime || 'Just now'})`
              : 'Auto-saving state...'
          }
          className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/25 text-[10px] font-mono select-none"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-slate-300 font-medium">Cloud Synced</span>
          <span className="text-cyan-400 font-bold">· 0% Loss</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links — The 4 Crucial Modes */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider">
        {/* 1. 3D CAD */}
        <button
          onClick={() => onChangeView('cad')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
            activeView === 'cad' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D CAD</span>
        </button>

        {/* 2. Circuit Schematics */}
        <button
          onClick={() => onChangeView('schematic')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
            activeView === 'schematic' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Circuit Schematics</span>
        </button>

        {/* 3. Visualizer */}
        <button
          onClick={() => onChangeView('visualizer')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
            activeView === 'visualizer' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Visualizer</span>
        </button>

        {/* 4. Camera Vision */}
        <button
          onClick={() => onChangeView('vision')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
            activeView === 'vision' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera Vision</span>
        </button>
      </nav>

      {/* Zone 3: Actions (New Project, Revert History, Consult Mentor) */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            title="Project History & Revert Checkpoints (Zero Data Loss)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-md transition-all whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">History</span>
          </button>
        )}

        {onOpenNewProject && (
          <button
            onClick={onOpenNewProject}
            title="Start New Project Build (Clean Slate)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-md transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}

        <button
          onClick={onOpenMentor}
          className="relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold tracking-wide uppercase text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          <span className="hidden sm:inline">Consult Mentor</span>
          <span className="sm:hidden">Mentor</span>
          {mentorUnread && (
            <span className="w-2 h-2 rounded-full bg-amber-400" aria-label="New message" />
          )}
        </button>
      </div>
    </header>
  );
};

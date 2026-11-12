import React from 'react';
import { X, History, CheckCircle2, RotateCcw, HardDriveDownload, FileText, ArrowRight } from 'lucide-react';
import { ProjectCheckpoint, ProjectFileAttachment } from '../types';

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  version: number;
  lastSavedAt: number;
  checkpoints: ProjectCheckpoint[];
  attachments: ProjectFileAttachment[];
  onRevertToCheckpoint: (checkpoint: ProjectCheckpoint) => void;
  onExportProject: () => void;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectId,
  version,
  lastSavedAt,
  checkpoints,
  attachments,
  onRevertToCheckpoint,
  onExportProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl flex flex-col bg-[#070c14] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#0a121e]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-slate-100 uppercase">
                  Project Version & History Timeline
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  0% Data Loss Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous auto-save synced to cloud & local storage · Revert to any state
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

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Project:</span>
            <span className="text-cyan-300 font-bold">{projectName}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Build Version:</span>
            <span className="text-emerald-400 font-bold">v{version}</span>
          </div>

          <button
            onClick={onExportProject}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-950 border border-cyan-500/40 rounded transition-colors"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            <span>Export Backup JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Checkpoints Timeline */}
          <div>
            <h3 className="text-xs font-mono text-cyan-300 uppercase tracking-wider mb-3">
              Recorded Milestones & State Checkpoints ({checkpoints.length})
            </h3>

            {checkpoints.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono italic">
                Initial baseline recorded. New checkpoints are automatically logged on every design modification.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
                {checkpoints.map((chk, idx) => (
                  <div key={chk.id || idx} className="relative group">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950 group-hover:scale-125 transition-transform" />
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#0a121e]/80 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{chk.label}</span>
                          <span className="text-[10px] font-mono text-slate-300">
                            {new Date(chk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {chk.details}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onRevertToCheckpoint(chk);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Files & Uploaded Research */}
          {attachments && attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2">
                Attached Files & Verified Research ({attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800"
                  >
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-200 truncate">{att.name}</div>
                      <div className="text-[10px] font-mono text-slate-300">
                        {att.type.toUpperCase()} · {att.uploadedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

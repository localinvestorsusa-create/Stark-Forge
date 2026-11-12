import React, { useState, useEffect, useRef } from 'react';
import { CAD_PRODUCTS } from './cad/products';
import {
  CADProduct,
  MechanicalPart,
  ProductId,
  BackgroundTask,
  ScenarioCardData,
  VoiceCommandResult,
  ProjectCheckpoint,
  CloudProjectRecord,
  ProjectFileAttachment,
} from './types';
import { ThreeViewport } from './cad/ThreeViewport';
import { TopBar, ActiveViewMode } from './components/TopBar';
import { BottomControlDock } from './components/BottomControlDock';
import { WorkshopVisionGuide } from './components/WorkshopVisionGuide';
import { MentorDrawer } from './components/MentorDrawer';
import { BackgroundWorkStation } from './components/BackgroundWorkStation';
import { BOMExplorerModal } from './components/BOMExplorerModal';
import { FlawInspectorModal } from './components/FlawInspectorModal';
import { MacroscopicSchematicModal } from './components/MacroscopicSchematicModal';
import { SideHologramVisualizer } from './components/SideHologramVisualizer';
import { GlobalVoiceCompanion } from './components/GlobalVoiceCompanion';
import { NewProjectModal } from './components/NewProjectModal';
import { ConceptImageModal } from './components/ConceptImageModal';
import { ProjectHistoryModal } from './components/ProjectHistoryModal';
import { Activity, Square, Play, Sliders, Sparkles, Zap, Layers, Video, ShieldAlert, Cpu, Plus, Image as ImageIcon, History } from 'lucide-react';

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState<ProductId>('esc_controller');
  const [activeView, setActiveView] = useState<ActiveViewMode>('cad');
  const [explodedProgress, setExplodedProgress] = useState(0);
  const [simulationActive, setSimulationActive] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front' | 'cross' | 'underneath' | 'macro'>('iso');
  const [selectedPart, setSelectedPart] = useState<MechanicalPart | null>(null);

  // CAD Manipulation & X-Ray See-Through state
  const [hiddenPartIds, setHiddenPartIds] = useState<string[]>([]);
  const [xrayMode, setXrayMode] = useState<boolean>(false);

  // Zero Data Loss & Cloud Storage History
  const [projectRecord, setProjectRecord] = useState<CloudProjectRecord | null>(null);
  const [checkpoints, setCheckpoints] = useState<ProjectCheckpoint[]>([]);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Macroscopic Schematic Modal state
  const [isSchematicOpen, setIsSchematicOpen] = useState(false);

  // Side Holographic Visualizer state (EXACTLY ONE PICTURE AT A TIME)
  const [activeScenarioData, setActiveScenarioData] = useState<ScenarioCardData | null>(null);

  // Mentor Drawer state
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [mentorQuery, setMentorQuery] = useState<string | undefined>(undefined);

  // New Project Build Studio & Concept Visualizer Modal state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isConceptImageOpen, setIsConceptImageOpen] = useState(false);

  // Background Engineering Tasks (Only populated when explicitly running)
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const currentProduct: CADProduct = CAD_PRODUCTS[selectedProductId] || CAD_PRODUCTS.esc_controller;
  const activeTask = tasks.find((t) => t.status === 'running') || null;

  const isInitialLoadedRef = useRef(false);

  // 1. Initial Load: Sync persistent project and checkpoints from server
  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch('/api/projects/proj_esc_apex40');
        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            setProjectRecord(data.project);
            if (data.project.checkpoints) {
              setCheckpoints(data.project.checkpoints);
            }
            if (data.project.cadState) {
              if (data.project.cadState.hiddenPartIds) setHiddenPartIds(data.project.cadState.hiddenPartIds);
              if (typeof data.project.cadState.xrayMode === 'boolean') setXrayMode(data.project.cadState.xrayMode);
              if (typeof data.project.cadState.explodedProgress === 'number') setExplodedProgress(data.project.cadState.explodedProgress);
            }
          }
        }
      } catch (err) {
        // Fallback to local storage for 0% data loss
        try {
          const cached = localStorage.getItem('stark_cad_state');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.hiddenPartIds) setHiddenPartIds(parsed.hiddenPartIds);
            if (typeof parsed.xrayMode === 'boolean') setXrayMode(parsed.xrayMode);
          }
        } catch (e) {}
      } finally {
        isInitialLoadedRef.current = true;
      }
    };
    loadProject();
  }, []);

  // 2. Zero Data Loss Auto-Save: Continuous background sync to server & disk (only after load)
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (!isInitialLoadedRef.current) return;

    setCloudSyncStatus('saving');

    // Immediate local storage backup
    try {
      localStorage.setItem(
        'stark_cad_state',
        JSON.stringify({
          selectedProductId,
          hiddenPartIds,
          xrayMode,
          explodedProgress,
          cameraPreset,
          timestamp: Date.now(),
        })
      );
    } catch (e) {}

    // Debounced cloud disk persistence
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          id: projectRecord?.id || 'proj_esc_apex40',
          name: currentProduct.name,
          currentProductId: selectedProductId,
          cadState: {
            explodedProgress,
            cameraPreset,
            hiddenPartIds,
            xrayMode,
          },
          summary: currentProduct.summary,
        };

        const res = await fetch('/api/projects/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            setProjectRecord(data.project);
            if (data.project.checkpoints) setCheckpoints(data.project.checkpoints);
          }
          setCloudSyncStatus('synced');
          setLastSavedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        } else {
          setCloudSyncStatus('offline');
        }
      } catch (err) {
        setCloudSyncStatus('offline');
      }
    }, 700);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [selectedProductId, hiddenPartIds, xrayMode, explodedProgress, cameraPreset, currentProduct.name]);

  // Handle Clean New Project directly without template modals or friction
  const handleStartCleanNewProject = async () => {
    try {
      const res = await fetch('/api/projects/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Custom Hardware Build',
          subtitle: 'Clean Canvas · Ready for Concept Brainstorming',
          category: 'Custom Architecture Prototyping',
          productId: 'clean_slate',
          hiddenPartIds: [],
          xrayMode: false,
          explodedProgress: 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProjectRecord(data.project);
          if (data.project.checkpoints) setCheckpoints(data.project.checkpoints);
        }
      }
    } catch (e) {
      console.warn('Failed to register new cloud project:', e);
    }

    setSelectedProductId('clean_slate');
    setSelectedPart(null);
    setHiddenPartIds([]);
    setXrayMode(false);
    setExplodedProgress(0);
    setActiveScenarioData(null);
    setActiveView('cad');
    setTasks([]);
    setIsNewProjectOpen(false);

    const welcomeMsg = "Clean workbench ready! What are we designing today? Tell me your concept or what you want to build—let's brainstorm the specifications, components, and materials together.";
    setMentorQuery(welcomeMsg);
    setIsMentorOpen(true);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(welcomeMsg);
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  };

  // Revert to any historical checkpoint
  const handleRevertToCheckpoint = (checkpoint: ProjectCheckpoint) => {
    if (checkpoint.snapshot) {
      const snap = checkpoint.snapshot;
      if (snap.hiddenPartIds) setHiddenPartIds(snap.hiddenPartIds);
      if (typeof snap.xrayMode === 'boolean') setXrayMode(snap.xrayMode);
      if (typeof snap.explodedProgress === 'number') setExplodedProgress(snap.explodedProgress);
      if (snap.currentProductId && snap.currentProductId !== selectedProductId) {
        setSelectedProductId(snap.currentProductId as ProductId);
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(`Reverted to milestone: ${checkpoint.label}`);
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  // Export full project JSON archive for Google Drive or local storage
  const handleExportProject = () => {
    const projId = projectRecord?.id || 'proj_esc_apex40';
    window.open(`/api/projects/${projId}/export`, '_blank');
  };

  // Poll tasks from server periodically
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/mentor/tasks');
        if (res.ok) {
          const data = await res.json();
          if (data.tasks && data.tasks.length > 0) {
            setTasks(data.tasks);
          }
        }
      } catch (err) {
        // Silently keep local state if fetch fails
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  // Stop / Interrupt a background task
  const handleStopTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/mentor/task/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action: 'pause' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'paused', telemetryLogs: [...t.telemetryLogs, '[USER STOPPED WORK]'] }
            : t
        )
      );
    }
  };

  // Resume a background task
  const handleResumeTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/mentor/task/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, updatedParameters: {}, resume: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'running' } : t))
      );
    }
  };

  // Modify past task parameters and recalculate
  const handleModifyTask = async (taskId: string, newParams: any) => {
    try {
      const res = await fetch('/api/mentor/task/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, updatedParameters: newParams, resume: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'running',
                parameters: { ...t.parameters, ...newParams },
                progress: 15,
                telemetryLogs: [
                  ...t.telemetryLogs,
                  `[USER MODIFIED PAST] Recalculating with: ${JSON.stringify(newParams)}`,
                ],
              }
            : t
        )
      );
    }
  };

  // Start a new engineering task
  const handleStartNewTask = async (title: string, params: any) => {
    try {
      const res = await fetch('/api/mentor/task/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetProduct: currentProduct.name, parameters: params }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        setActiveView('work');
      }
    } catch (e) {
      console.warn('Start task error:', e);
    }
  };

  const handleOpenMentorWithQuery = (query: string) => {
    setMentorQuery(query);
    setIsMentorOpen(true);
  };

  // Handle project template selection from NewProjectModal
  const handleSelectProjectTemplate = (template: {
    name: string;
    category: string;
    voltage: string;
    current: string;
    dimensions: string;
    summary: string;
  }) => {
    CAD_PRODUCTS.clean_slate.name = template.name;
    CAD_PRODUCTS.clean_slate.category = template.category;
    CAD_PRODUCTS.clean_slate.voltageRating = template.voltage;
    CAD_PRODUCTS.clean_slate.currentRating = template.current;
    CAD_PRODUCTS.clean_slate.dimensions = template.dimensions;
    CAD_PRODUCTS.clean_slate.summary = template.summary;
    CAD_PRODUCTS.clean_slate.subtitle = `${template.voltage} · ${template.current} · ${template.dimensions}`;
    CAD_PRODUCTS.clean_slate.specs = {
      'Project Status': 'Active Prototyping',
      'Target Voltage': template.voltage,
      'Continuous Current': template.current,
      'Physical Envelope': template.dimensions,
    };

    setSelectedProductId('clean_slate');
    setSelectedPart(null);
    setExplodedProgress(0);
    setActiveScenarioData(null);

    // Start engineering verification task
    handleStartNewTask(`${template.name} Architecture & Rule Check`, {
      voltage: template.voltage,
      current: template.current,
      category: template.category,
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(
        `Workbench initialized for ${template.name}. Let's get to work on the electrical architecture and component sourcing.`
      );
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  const handleClearWorkbench = () => {
    setSelectedProductId('clean_slate');
    setSelectedPart(null);
    setExplodedProgress(0);
    setActiveScenarioData(null);
    tasks.forEach((t) => {
      if (t.status === 'running') {
        handleStopTask(t.id);
      }
    });
  };

  // Voice Command Execution Handler (Seamless Hands-Free Voice Control)
  const handleVoiceCommand = async (result: VoiceCommandResult) => {
    if (result.targetProductId && result.targetProductId !== selectedProductId) {
      setSelectedProductId(result.targetProductId);
      setSelectedPart(null);
      setExplodedProgress(0);
    }

    if (result.targetView) {
      setActiveView(result.targetView);
    }

    if (result.cameraPreset) {
      setCameraPreset(result.cameraPreset);
    }

    // 1. Clear Workspace / New Project Build
    if (result.action === 'clear_workspace') {
      handleStartCleanNewProject();
      return;
    }

    // 2. Background Task Stop / Resume Control
    if (result.action === 'task_control') {
      if (result.taskAction === 'stop') {
        tasks.forEach((t) => {
          if (t.status === 'running') {
            handleStopTask(t.id);
          }
        });
      } else if (result.taskAction === 'resume') {
        const paused = tasks.find((t) => t.status === 'paused');
        if (paused) {
          handleResumeTask(paused.id);
        }
      }
    }

    // 3. Image Generation Trigger
    if (result.action === 'generate_image') {
      try {
        const res = await fetch('/api/scenario/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: currentProduct.name,
            customPrompt: result.imagePrompt,
            scenarioType: 'field_installation',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setActiveScenarioData(data);
        }
      } catch (e) {
        console.warn('Image generation error:', e);
      }
    }

    // 4. Circuit Schematics
    if (result.action === 'open_schematic') {
      setIsSchematicOpen(true);
      setActiveView('schematic');
      setCameraPreset('macro');
    }

    // 5. Scenario Simulation Display / Another Scenario
    if (result.action === 'show_scenario' || result.targetView === 'visualizer') {
      setActiveView('visualizer');
      if (result.scenarioData) {
        setActiveScenarioData(result.scenarioData);
      } else {
        try {
          const res = await fetch('/api/scenario/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product: currentProduct.name,
              scenarioType: (result as any).scenarioSubtype || 'underneath_chassis',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setActiveScenarioData(data);
          }
        } catch (e) {
          console.warn('Scenario fetch error:', e);
        }
      }
    }

    // 6. CAD Manipulation by Voice (Remove Circuitry, See-Through Enclosure, Explode Assembly)
    if (result.action === 'cad_manipulation' && result.cadOperation) {
      const op = result.cadOperation;
      const targetId = op.partId || op.targetPartId;
      if (op.type === 'hide_part' && targetId) {
        setHiddenPartIds((prev) => Array.from(new Set([...prev, targetId])));
      } else if (op.type === 'isolate_part' && targetId) {
        const others = currentProduct.parts.filter((p) => p.id !== targetId).map((p) => p.id);
        setHiddenPartIds(others);
      } else if (op.type === 'restore_all') {
        setHiddenPartIds([]);
      } else if (op.type === 'set_xray') {
        const enabled = typeof op.enabled === 'boolean' ? op.enabled : Boolean(op.xrayEnabled);
        setXrayMode(enabled);
      } else if (op.type === 'explode_materials') {
        const amount = typeof op.progress === 'number' ? op.progress : typeof op.explodeAmount === 'number' ? op.explodeAmount : 0.85;
        setExplodedProgress(amount);
      }
    }

    // 7. Critical Trade-Off Risk Advisory (Consult Mentor Before Risky Action)
    if (result.tradeoffRisk) {
      setMentorQuery(`Let's discuss the trade-off regarding: ${result.tradeoffRisk.description}`);
      setIsMentorOpen(true);
    }
  };

  const isAnyTaskRunning = tasks.some((t) => t.status === 'running');

  return (
    <div className="relative w-screen h-screen bg-[#05080e] text-slate-100 overflow-hidden font-sans">
      {/* 1. Top HUD Navigation Bar — Streamlined to 4 Crucial Modes */}
      <TopBar
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          if (view === 'schematic') setIsSchematicOpen(true);
          if (view === 'visualizer') setIsConceptImageOpen(true);
        }}
        onOpenMentor={() => {
          setMentorQuery(undefined);
          setIsMentorOpen(true);
        }}
        onOpenNewProject={handleStartCleanNewProject}
        onOpenConceptVisualizer={() => setIsConceptImageOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        cloudSyncStatus={cloudSyncStatus}
        lastSavedTime={lastSavedTime}
        activeTaskRunning={isAnyTaskRunning}
      />

      {/* 1b. Responsive Mobile & iPad Navigation Strip (The 4 Crucial Modes) */}
      <div className="fixed top-14 left-0 right-0 z-30 lg:hidden flex items-center gap-2 px-3 py-1.5 bg-[#070c14]/95 border-b border-cyan-500/20 backdrop-blur-md overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveView('visualizer');
            setIsConceptImageOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
            activeView === 'visualizer' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visualizer</span>
        </button>

        <button
          onClick={() => setActiveView('cad')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
            activeView === 'cad' ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D CAD</span>
        </button>

        <button
          onClick={() => {
            setActiveView('schematic');
            setIsSchematicOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
            activeView === 'schematic' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Circuit Schematics</span>
        </button>

        <button
          onClick={() => setActiveView('vision')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
            activeView === 'vision' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Camera Vision</span>
        </button>

        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
          title="Project History & Checkpoints"
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>

        <button
          onClick={handleStartCleanNewProject}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap bg-cyan-950/90 text-cyan-300 border border-cyan-500/40"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Build</span>
        </button>
      </div>

      {/* 2. Central 3D Holographic CAD / PCB Viewport */}
      <main className="absolute inset-0 pt-14 lg:pt-14 pb-0 z-0">
        <ThreeViewport
          product={currentProduct}
          explodedProgress={explodedProgress}
          selectedPartId={selectedPart?.id || null}
          onSelectPart={(part) => setSelectedPart(part)}
          simulationActive={simulationActive}
          activeLayerFilter="all"
          cameraPreset={cameraPreset}
          hiddenPartIds={hiddenPartIds}
          xrayMode={xrayMode}
        />

        {/* Ambient Project Status Header (Top-Left) */}
        <div className="absolute top-18 left-6 z-10 pointer-events-none hidden sm:block">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>{currentProduct.category}</span>
            <span aria-hidden="true">·</span>
            <span>{currentProduct.dimensions}</span>
          </div>
          <h1 className="text-xl font-display font-extrabold text-slate-100 mt-0.5 tracking-tight">
            {selectedProductId === 'clean_slate' ? 'Custom Hardware Build' : currentProduct.name}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
            {selectedProductId === 'clean_slate'
              ? 'Clean build plate ready · Brainstorming requirements, components, materials, and BOM with mentor'
              : currentProduct.subtitle}
          </p>
        </div>
      </main>

      {/* 3. Collapsible Bottom Control Dock */}
      {activeView === 'cad' && (
        <BottomControlDock
          currentProduct={currentProduct}
          onSelectProduct={(pid) => {
            setSelectedProductId(pid);
            setSelectedPart(null);
            setExplodedProgress(0);
            setHiddenPartIds([]);
          }}
          explodedProgress={explodedProgress}
          onChangeExploded={(val) => setExplodedProgress(val)}
          simulationActive={simulationActive}
          onToggleSimulation={() => setSimulationActive(!simulationActive)}
          cameraPreset={cameraPreset}
          onChangeCameraPreset={(preset) => setCameraPreset(preset)}
          selectedPart={selectedPart}
          onClearSelectedPart={() => setSelectedPart(null)}
          onAskAboutPart={(part) => {
            handleOpenMentorWithQuery(
              `I'm inspecting ${part.name} (${part.materialName}, ${part.dimensionsMm}). How should we optimize its ${part.manufacturingProcess} manufacturing process and mitigate ${part.flawNotice || 'wear and thermal fatigue'}?`
            );
          }}
          onOpenSchematic={() => {
            setIsSchematicOpen(true);
            setActiveView('schematic');
          }}
          xrayMode={xrayMode}
          onToggleXray={() => setXrayMode(!xrayMode)}
          hiddenPartIds={hiddenPartIds}
          onRestoreParts={() => setHiddenPartIds([])}
        />
      )}

      {/* 4. Autonomous Background Work Station View */}
      {activeView === 'work' && (
        <div className="fixed inset-0 z-40 pt-16 p-6 bg-[#05080e]/95 backdrop-blur-xl flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Stark Forge Autonomous Work Station · Independent Computation Pipeline
              </span>
              <button
                onClick={() => setActiveView('cad')}
                className="px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
              >
                Back to 3D Viewport
              </button>
            </div>

            <BackgroundWorkStation
              tasks={tasks}
              onStopTask={handleStopTask}
              onResumeTask={handleResumeTask}
              onModifyTask={handleModifyTask}
              onStartNewTask={handleStartNewTask}
              currentProduct={currentProduct}
              onAskMentorAboutWork={(query) => handleOpenMentorWithQuery(query)}
            />
          </div>
        </div>
      )}

      {/* 5. Real-World Workshop Vision & Camera Guidance Overlay */}
      {activeView === 'vision' && (
        <WorkshopVisionGuide
          onClose={() => setActiveView('cad')}
          activeModelName={currentProduct.name}
        />
      )}

      {/* 6. Teardown & Sourcing BOM Modal */}
      {activeView === 'bom' && (
        <BOMExplorerModal
          isOpen={true}
          onClose={() => setActiveView('cad')}
          product={currentProduct}
          onConsultMentor={(query) => handleOpenMentorWithQuery(query)}
        />
      )}

      {/* 7. DRC Flaw Simulation Modal */}
      {activeView === 'drc' && (
        <FlawInspectorModal
          isOpen={true}
          onClose={() => setActiveView('cad')}
          product={currentProduct}
          onSelectFlawPart={(componentName) => {
            const part = currentProduct.parts.find((p) =>
              p.name.toLowerCase().includes(componentName.toLowerCase())
            );
            if (part) setSelectedPart(part);
          }}
          onConsultMentor={(query) => handleOpenMentorWithQuery(query)}
        />
      )}

      {/* 8. Pragmatic Senior Engineer Mentor Drawer (Fluid Real-Time Communication) */}
      <MentorDrawer
        isOpen={isMentorOpen}
        onClose={() => {
          setIsMentorOpen(false);
          setMentorQuery(undefined);
        }}
        currentProduct={currentProduct}
        selectedPart={selectedPart}
        initialQuery={mentorQuery}
        activeTask={activeTask || undefined}
        onStopActiveTask={handleStopTask}
        onResumeActiveTask={handleResumeTask}
        projectId={projectRecord?.id || 'proj_esc_apex40'}
        attachments={projectRecord?.attachments || []}
        onAttachFileToProject={(att) => {
          setProjectRecord((prev) => (prev ? { ...prev, attachments: [...prev.attachments, att] } : null));
        }}
        onExecuteCadOp={(op) => {
          if (op.type === 'hide_part' && op.partId) {
            setHiddenPartIds((prev) => Array.from(new Set([...prev, op.partId])));
          } else if (op.type === 'set_xray') {
            setXrayMode(Boolean(op.enabled));
          } else if (op.type === 'restore_all') {
            setHiddenPartIds([]);
          } else if (op.type === 'explode_materials') {
            setExplodedProgress(typeof op.progress === 'number' ? op.progress : 0.85);
          }
        }}
        onOpenVisualizer={() => setActiveView('visualizer')}
      />

      {/* 8b. Zero Data Loss Project History & Checkpoints Modal */}
      <ProjectHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projectName={currentProduct.name}
        projectId={projectRecord?.id || 'proj_esc_apex40'}
        version={projectRecord?.version || 1}
        lastSavedAt={projectRecord?.lastSavedAt || Date.now()}
        checkpoints={checkpoints}
        attachments={projectRecord?.attachments || []}
        onRevertToCheckpoint={handleRevertToCheckpoint}
        onExportProject={handleExportProject}
      />

      {/* 9. Macroscopic Schematics & Circuitry Inspector Modal */}
      <MacroscopicSchematicModal
        isOpen={isSchematicOpen}
        onClose={() => setIsSchematicOpen(false)}
        product={currentProduct}
        onConsultMentor={(query) => handleOpenMentorWithQuery(query)}
        onSpeakExplanation={(desc) => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
            const u = new SpeechSynthesisUtterance(desc);
            u.pitch = 1.05;
            window.speechSynthesis.speak(u);
          }
        }}
      />

      {/* 10. Side Hologram Visualizer (Displays exactly ONE picture at a time on screen) */}
      {activeScenarioData && (
        <SideHologramVisualizer
          isOpen={!!activeScenarioData}
          onClose={() => setActiveScenarioData(null)}
          scenarioData={activeScenarioData}
          onAskClarification={async (query) => {
            try {
              const res = await fetch('/api/scenario/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product: currentProduct.name,
                  customPrompt: query,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                setActiveScenarioData(data);
              }
            } catch (e) {
              console.warn('Failed to update scenario:', e);
            }
          }}
          onSpeakExplanation={(desc) => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.resume();
              const u = new SpeechSynthesisUtterance(desc);
              u.pitch = 1.05;
              window.speechSynthesis.speak(u);
            }
          }}
        />
      )}

      {/* 11. Always-On Live Voice Companion & Top-Right Live Captions */}
      <GlobalVoiceCompanion
        activeView={activeView}
        currentProductId={selectedProductId}
        onExecuteCommand={handleVoiceCommand}
        onOpenFullChat={(initialQuery) => handleOpenMentorWithQuery(initialQuery || '')}
      />

      {/* 12. New Project Build Studio Modal (Clean Slate) */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSelectTemplate={handleSelectProjectTemplate}
        onClearWorkbench={handleClearWorkbench}
      />

      {/* 13. Instant Real-Life Scenario & Hardware Concept Visualizer Modal */}
      <ConceptImageModal
        isOpen={isConceptImageOpen}
        onClose={() => setIsConceptImageOpen(false)}
        productName={currentProduct.name}
        onImageGenerated={(data) => {
          setActiveScenarioData(data);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
            const u = new SpeechSynthesisUtterance(
              `Generated hardware visual for ${data.title}. Check your side holographic display.`
            );
            u.pitch = 1.05;
            window.speechSynthesis.speak(u);
          }
        }}
      />
    </div>
  );
}

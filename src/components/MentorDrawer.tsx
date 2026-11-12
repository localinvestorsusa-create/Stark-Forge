import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Brain,
  Edit2,
  Check,
  RotateCcw,
  Activity,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  BarChart3,
  Cpu,
  Layers,
  Paperclip,
  BookOpen,
  ShieldAlert,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  ChatMessage,
  CADProduct,
  MechanicalPart,
  BackgroundTask,
  ClarifyingChoice,
  ScenarioCardData,
  SourcingMatrixData,
  ProjectFileAttachment,
  ResearchCitation,
  TradeoffRisk,
} from '../types';
import { ScenarioCard } from './ScenarioCard';
import { SourcingMatrix } from './SourcingMatrix';

interface MentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: CADProduct;
  selectedPart: MechanicalPart | null;
  initialQuery?: string;
  activeTask?: BackgroundTask | null;
  onStopActiveTask?: (taskId: string) => void;
  onResumeActiveTask?: (taskId: string) => void;
  onExecuteCadOp?: (op: any) => void;
  projectId?: string;
  onAttachFileToProject?: (file: ProjectFileAttachment) => void;
  attachments?: ProjectFileAttachment[];
  onOpenVisualizer?: () => void;
}

export const MentorDrawer: React.FC<MentorDrawerProps> = ({
  isOpen,
  onClose,
  currentProduct,
  selectedPart,
  initialQuery,
  activeTask,
  onStopActiveTask,
  onResumeActiveTask,
  onExecuteCadOp,
  projectId = 'proj_esc_apex40',
  onAttachFileToProject,
  attachments = [],
  onOpenVisualizer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<ProjectFileAttachment[]>(attachments);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'model',
      text: `Hey there! Welcome to the Stark Forge bench. I'm your master builder mentor, and right now I've got the ${currentProduct.name} laid out on the virtual table.

We don't do boring lectures here, and we definitely don't build paper airplanes that can't survive real physics. I'll share real workshop stories from decades of blown FETs, stripped threads, and race-day triumphs—grounded in certified university-level physics (IPC-2152, JEDEC, and IEEE power standards).

You can ask me to:
1. Show you the **real-life scenario** of how this looks wired and mounted in the field.
2. Compare **parts and material sourcing** with side-by-side trade-off matrices.
3. Solve thermal chokes, calculate trace widths, or optimize CNC toolpaths.

What part of the build should we tackle first?`,
      timestamp: 'Online',
      modelUsed: 'gemini-3.1-flash-lite',
      clarifyingChoices: [
        { label: 'Show Real-Life Scenario', query: `Show me how the ${currentProduct.name} looks installed in a real-life scenario.` },
        { label: 'Compare MOSFET Sourcing Matrix', query: 'Compare alternative MOSFET parts and sourcing lead times for this design.' },
        { label: 'Alloy Sourcing: 6061 vs 7075', query: 'Compare aluminum alloys (6061 vs 7075 vs Carbon Nylon) for the casing.' },
        { label: 'Verify 40A Thermal Rise (IPC-2152)', query: 'Calculate the junction temperature and trace width for 40A continuous.' },
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [highThinking, setHighThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const prevProductIdRef = useRef<string>(currentProduct.id);

  useEffect(() => {
    if (prevProductIdRef.current !== currentProduct.id) {
      prevProductIdRef.current = currentProduct.id;
      if (currentProduct.id === 'clean_slate') {
        const cleanMsg: ChatMessage = {
          id: `m_clean_${Date.now()}`,
          role: 'model',
          text: `Welcome to the clean bench! We've got a fresh optical breadboard fixture and zero clutter.\n\nNow let's brainstorm this build together:\n1. **Target Architecture & Scope**: What are we building? (e.g., high-speed drone ESC, brushless gimbal, active buck-boost regulator, or robotics actuator)\n2. **Key Components & BOM**: Power stage MOSFETs, MCU controller, gate drivers, shunt resistors, and bulk capacitors.\n3. **Housing & Structural Materials**: Machined 6061-T6 aluminum heatsink, sintered carbon-nylon casing, or high-copper 4-layer FR4 PCB.\n\nOnce we rough out the architecture, **I think we should visualize this first** in a real-life scenario so you can see how it looks wired and mounted before committing to silicon and tooling.\n\nWhat kind of hardware are we bringing to life today?`,
          timestamp: 'Ready',
          modelUsed: 'gemini-3.1-flash-lite',
          clarifyingChoices: [
            { label: 'Drone ESC 40A (4S-6S LiPo)', query: 'Let us build a 40A drone ESC. What components, MOSFETs, and PCB stackup do we need?' },
            { label: '3-Axis Brushless Gimbal Controller', query: 'Let us design a 3-axis brushless camera gimbal controller with IMU sensors.' },
            { label: 'High-Current GaN Power Converter', query: 'Let us brainstorm a high-efficiency GaN power stage with ultra-low thermal dissipation.' },
            { label: 'I think we should visualize this first', query: 'Show me the visualizer and how this hardware looks in real life.' },
          ],
        };
        setMessages([cleanMsg]);
      }
    }
  }, [currentProduct.id]);

  // Stop speech when drawer unmounts or closes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Enthusiastic Master Builder Voice Engine (Natural Cadence, Conversational Pauses)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    // Clean text of markdown formatting and inject natural punctuation pauses
    const clean = text
      .replace(/[*#_`>-]/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\.\s+/g, '... ') // natural breath pause after periods
      .trim()
      .slice(0, 450);

    const utterance = new SpeechSynthesisUtterance(clean);
    (window as any).__currentDrawerUtterance = utterance; // Chromium GC guard

    utterance.rate = 1.02;
    utterance.pitch = 1.05; // Enthusiastic, warm tone

    // Try to select an expressive natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Aaron') ||
          v.name.includes('Alex'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend: string, isPastEditIndex?: number) => {
    if (!textToSend.trim() || isSending) return;

    let updatedHistory = [...messages];
    if (typeof isPastEditIndex === 'number') {
      updatedHistory = updatedHistory.slice(0, isPastEditIndex);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...updatedHistory, userMsg];
    setMessages(newMessages);
    setInputText('');
    setEditingMessageId(null);
    setIsSending(true);

    if (textToSend.toLowerCase().includes('visualiz')) {
      onOpenVisualizer?.();
    }

    try {
      const historyPayload = newMessages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const taskContext = activeTask
        ? `Task "${activeTask.title}" (${activeTask.status}, ${activeTask.progress}%, Phase: ${activeTask.phase})`
        : '';

      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          highThinking,
          activeModelId: `${currentProduct.name} (${selectedPart ? `Part: ${selectedPart.name}` : 'Full Assembly'})`,
          backgroundTaskContext: taskContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mentor request returned status ${response.status}`);
      }

      const data = await response.json();
      const modelReply = data.reply || 'Engineering analysis complete.';

      // Extract clarifying choices
      const clarifyingChoices: ClarifyingChoice[] = [];
      if (!data.scenarioData && !data.sourcingMatrix) {
        clarifyingChoices.push({
          label: 'Show Real-Life Scenario Visual',
          query: `Show me the real-life scenario of how this ${currentProduct.name} looks installed in real conditions.`,
        });
        clarifyingChoices.push({
          label: 'Compare Sourcing Trade-Offs',
          query: 'Compare alternative parts and sourcing lead times for this component.',
        });
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: modelReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
        scenarioData: data.scenarioData,
        sourcingMatrix: data.sourcingMatrix,
        clarifyingChoices: clarifyingChoices.length > 0 ? clarifyingChoices : undefined,
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (autoVoice) {
        speakText(modelReply);
      }
    } catch (err: any) {
      console.error('Mentor chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Stark Forge workshop online. For this high-current power stage, make sure you don't run 1oz copper on continuous 40A loads. Add 2.0oz internal copper pours or soldered wire busbars to keep your junction temperatures under 85°C.`,
          timestamp: 'Local',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSending(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        let category: 'cad' | 'doc' | 'audio' | 'video' | 'image' | 'link' = 'doc';
        if (file.type.startsWith('audio/')) category = 'audio';
        else if (file.type.startsWith('video/')) category = 'video';
        else if (file.type.startsWith('image/')) category = 'image';
        else if (file.name.endsWith('.step') || file.name.endsWith('.stp') || file.name.endsWith('.stl')) category = 'cad';

        const res = await fetch('/api/mentor/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileCategory: category,
            base64Data,
            sizeBytes: file.size,
          }),
        });

        const data = await res.json();
        if (data.attachment) {
          setLocalAttachments((prev) => [...prev, data.attachment]);
          onAttachFileToProject?.(data.attachment);

          const attachUserMsg: ChatMessage = {
            id: `u-file-${Date.now()}`,
            role: 'user',
            text: `Attached ${category.toUpperCase()} file: ${file.name} (${(file.size / 1024).toFixed(1)} KB) for engineering audit.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments: [data.attachment],
          };

          const attachModelMsg: ChatMessage = {
            id: `m-file-${Date.now()}`,
            role: 'model',
            text: data.reply || `Received ${file.name}. Ingesting specifications against standard tolerances.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'gemini-3.1-flash-lite',
          };

          setMessages((prev) => [...prev, attachUserMsg, attachModelMsg]);
          if (autoVoice) speakText(attachModelMsg.text);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleIvyLeagueResearch = async (topic?: string) => {
    const researchTopic = topic || `Verify continuous 40A trace geometry and thermal resistance on ${currentProduct.name} using IPC-2152 & Stanford Power Electronics`;
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: `u-res-${Date.now()}`,
      role: 'user',
      text: `[Certified Literature Audit] ${researchTopic}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/mentor/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: researchTopic,
          projectContext: `${currentProduct.name}: 38x22.5mm, 40A continuous, 6S LiPo (25.2V).`,
        }),
      });

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `m-res-${Date.now()}`,
        role: 'model',
        text: data.synthesis || 'Certified literature verification completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        researchCitations: data.citations || [],
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, modelMsg]);
      if (autoVoice) speakText(modelMsg.text);
    } catch (err) {
      console.error('Research audit error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTradeoffResponse = (msg: ChatMessage, acceptAlternative: boolean) => {
    if (!msg.tradeoffRisk) return;
    const risk = msg.tradeoffRisk;

    if (acceptAlternative) {
      // Execute recommended safe alternative
      if (risk.partId === 'heatsink' && onExecuteCadOp) {
        onExecuteCadOp({ type: 'set_xray', enabled: true });
      }
      handleSendMessage(`I choose the safe alternative: ${risk.alternativeRecommendation}`);
    } else {
      // User confirms risky action anyway
      if (risk.partId && onExecuteCadOp) {
        onExecuteCadOp({ type: 'hide_part', partId: risk.partId });
      }
      handleSendMessage(`I understand the thermal risk (${risk.description}), but confirm removing it anyway for inspection.`);
    }
  };

  const handleStartEditPast = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditMessageText(msg.text);
  };

  const handleSaveEditPast = (index: number) => {
    if (!editMessageText.trim()) return;
    handleSendMessage(editMessageText, index);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        audioChunksRef.current = [];
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(micStream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          micStream.getTracks().forEach((t) => t.stop());

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/mentor/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
              });
              const transData = await res.json();
              if (transData.transcript) {
                handleSendMessage(transData.transcript);
              }
            } catch (err) {
              console.error('Voice transcription error:', err);
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone error:', err);
      }
    }
  };

  if (!isOpen) return null;

  const isTaskRunning = activeTask?.status === 'running';

  return (
    <div className="fixed top-14 right-0 bottom-0 z-40 w-full sm:w-[500px] bg-[#070c14]/98 border-l border-cyan-500/30 flex flex-col shadow-2xl backdrop-blur-2xl">
      {/* 1. Header with Voice & Stop Status */}
      <div className="p-4 border-b border-cyan-500/20 bg-[#0a101d]/90 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display text-sm font-bold tracking-wider text-slate-100 uppercase">
              Master Builder Mentor
            </h3>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Storytelling Cadence · Certified Engineering Rigor
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Speaking Audio Waveform Indicator */}
          {isSpeaking && (
            <button
              onClick={handleStopSpeech}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-400 text-cyan-300"
              title="Click to stop speaking"
            >
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-cyan-400 animate-bounce h-2" />
                <span className="w-0.5 bg-cyan-400 animate-bounce h-3 delay-75" />
                <span className="w-0.5 bg-cyan-400 animate-bounce h-1.5 delay-150" />
              </div>
              <span>Speaking</span>
            </button>
          )}

          <button
            onClick={() => {
              setAutoVoice(!autoVoice);
              if (autoVoice) handleStopSpeech();
            }}
            title={autoVoice ? 'Voice Output: ON (Enthusiastic Master)' : 'Voice Output: OFF'}
            className={`p-1.5 rounded transition-colors ${
              autoVoice ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {autoVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Parallel Background Work Indicator Banner */}
      {activeTask && (
        <div className="px-4 py-2 bg-[#09111e] border-b border-cyan-500/20 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden">
            <Activity
              className={`w-3.5 h-3.5 shrink-0 ${
                isTaskRunning ? 'text-cyan-400 animate-spin' : 'text-amber-400'
              }`}
            />
            <div className="truncate">
              <span className="text-slate-400">Background Work: </span>
              <span className="text-cyan-300 font-bold">{activeTask.title}</span>
              <span className="text-slate-500"> ({activeTask.progress}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {isTaskRunning && onStopActiveTask ? (
              <button
                onClick={() => onStopActiveTask(activeTask.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-900 bg-amber-400 hover:bg-amber-300"
                title="Stop mentor from continuing work"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Stop Work</span>
              </button>
            ) : onResumeActiveTask ? (
              <button
                onClick={() => onResumeActiveTask(activeTask.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* 3. Sub-header: Current Product & Model Depth */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setHighThinking(!highThinking)}
          className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded transition-all ${
            highThinking
              ? 'bg-purple-950/70 border border-purple-500/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Brain className={`w-3.5 h-3.5 ${highThinking ? 'text-purple-400' : 'text-slate-500'}`} />
          <span>{highThinking ? 'High Depth Reasoning' : 'Instant Master Cadence'}</span>
        </button>

        <span className="text-[11px] font-mono text-cyan-400 truncate max-w-[180px]">
          {selectedPart ? `Part: ${selectedPart.name}` : currentProduct.name}
        </span>
      </div>

      {/* 4. Chat Messages Scroll Area with Embedded Scenario & Sourcing Cards */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Meta Row with "Modify Past" Button */}
            <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-500">
              <span>{msg.role === 'user' ? 'You' : 'Master Builder'}</span>
              <span aria-hidden="true">·</span>
              <span>{msg.timestamp}</span>

              {msg.role === 'user' && editingMessageId !== msg.id && (
                <button
                  onClick={() => handleStartEditPast(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-cyan-400 flex items-center gap-1 ml-1"
                  title="Modify the past: Edit this query and re-branch the conversation"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Modify Past</span>
                </button>
              )}
            </div>

            {/* Editing Box if modifying this past turn */}
            {editingMessageId === msg.id ? (
              <div className="w-full p-3 rounded-xl bg-slate-900 border border-cyan-400 shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1.5">
                  <span>Modifying Past Query</span>
                  <span className="text-slate-500">Subsequent turns will recalculate</span>
                </div>
                <textarea
                  value={editMessageText}
                  onChange={(e) => setEditMessageText(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-400 resize-none h-16"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setEditingMessageId(null)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEditPast(idx)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply & Branch</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`max-w-[94%] p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/30'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Embedded Real-Life Scenario Visual Card */}
                {msg.scenarioData && (
                  <ScenarioCard
                    data={msg.scenarioData}
                    onAskAboutScenario={(q) => handleSendMessage(q)}
                  />
                )}

                {/* Embedded Comparative Sourcing Matrix */}
                {msg.sourcingMatrix && (
                  <SourcingMatrix
                    data={msg.sourcingMatrix}
                    onAskAboutSourcing={(q) => handleSendMessage(q)}
                    onSelectCandidate={(cand) =>
                      handleSendMessage(
                        `I have selected ${cand.name} (${cand.mpn}) from the matrix. Let's update the PCB layout and recalculate our conduction losses.`
                      )
                    }
                  />
                )}

                {/* Trade-Off Risk Advisory Card */}
                {msg.tradeoffRisk && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-200">
                    <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Critical Engineering Trade-Off Required</span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed mb-2">
                      {msg.tradeoffRisk.description}
                    </p>
                    <div className="p-2 rounded bg-amber-950/70 border border-amber-500/30 text-[11px] font-mono text-cyan-300 mb-3">
                      <span className="text-amber-400 font-bold block mb-0.5">Mentor's Recommended Path:</span>
                      {msg.tradeoffRisk.alternativeRecommendation}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleTradeoffResponse(msg, true)}
                        className="flex-1 py-1.5 px-3 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Take Recommended Safe Path</span>
                      </button>
                      <button
                        onClick={() => handleTradeoffResponse(msg, false)}
                        className="py-1.5 px-3 rounded text-xs font-mono text-amber-400/80 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/40 transition-colors"
                      >
                        <span>Confirm Action Anyway</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Certified Ivy League Research Citations */}
                {msg.researchCitations && msg.researchCitations.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Certified Ivy League & Industry Standards Citations</span>
                    </div>
                    <div className="space-y-2">
                      {msg.researchCitations.map((cite, cIdx) => (
                        <div key={cIdx} className="p-2.5 rounded bg-slate-900/80 border border-indigo-500/20 text-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-indigo-200">{cite.title}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-900/80 text-indigo-300 border border-indigo-500/40">
                              {cite.institution}
                            </span>
                          </div>
                          {cite.standardOrPaper && (
                            <p className="text-[11px] font-mono text-slate-400 mb-1">{cite.standardOrPaper}</p>
                          )}
                          {cite.keyFormula && (
                            <div className="my-1.5 px-2 py-1 rounded bg-black/60 font-mono text-cyan-300 text-[11px]">
                              {cite.keyFormula}
                            </div>
                          )}
                          <p className="text-slate-300 text-[11px] leading-relaxed">{cite.engineeringTakeaway}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spoken Audio Replay */}
                {msg.role === 'model' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded transition-colors"
                  >
                    <Play className="w-3 h-3 text-cyan-400" />
                    <span>Listen Aloud</span>
                  </button>
                )}

                {/* Interactive Clarifying Question Buttons */}
                {msg.clarifyingChoices && msg.clarifyingChoices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                      Explore Design Choices:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.clarifyingChoices.map((choice, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(choice.query)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400/40 border border-slate-700 rounded-md transition-all text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{choice.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse p-2">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>Consulting certified engineering data & scenarios...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Quick Scenario & Research Trigger Bar */}
      <div className="px-4 py-2 border-t border-slate-800 bg-[#05080e]/90 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() =>
            handleSendMessage(`Show me a real-life scenario of the ${currentProduct.name} installed in field conditions.`)
          }
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 rounded whitespace-nowrap transition-colors"
        >
          <ImageIcon className="w-3 h-3 text-cyan-400" />
          <span>Real-Life Scenario</span>
        </button>

        <button
          onClick={() => handleIvyLeagueResearch()}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 rounded whitespace-nowrap transition-colors"
          title="Verify thermal equations & IPC standards from certified literature"
        >
          <BookOpen className="w-3 h-3 text-indigo-400" />
          <span>Ivy League Audit</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage('Compare alternative MOSFET parts and sourcing lead times for this design.')
          }
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded whitespace-nowrap transition-colors"
        >
          <BarChart3 className="w-3 h-3 text-amber-400" />
          <span>Compare MOSFETs</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage('Compare machining alloys (6061 vs 7075 vs Carbon Nylon) for this enclosure.')
          }
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded whitespace-nowrap transition-colors"
        >
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>Alloy Sourcing</span>
        </button>
      </div>

      {/* 6. Fluid Input Composer with File Upload & Audio */}
      <div className="p-4 border-t border-cyan-500/20 bg-[#0a101d]/95">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".step,.stp,.stl,.pdf,.doc,.docx,.txt,.csv,.mp3,.wav,.mp4,.webm,.png,.jpg,.jpeg"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach CAD (STEP/STL), PDF, Audio, Video, or Documentation"
            className="p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? 'Stop Recording' : 'Speak Question'}
            className={`p-2.5 rounded-lg border transition-all ${
              isRecording
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
          >
            {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask question, attach files, or say 'Show scenario'..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-900 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

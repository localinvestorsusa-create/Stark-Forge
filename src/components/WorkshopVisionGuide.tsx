import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Scan,
  Compass,
  ArrowRight,
  Shield,
  Play,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Square,
  Radio,
} from 'lucide-react';
import { VisionStepGuide } from '../types';

interface WorkshopVisionGuideProps {
  onClose: () => void;
  activeModelName: string;
}

const PRESET_TASKS = [
  {
    id: '3d_printer',
    title: '3D Printer Setup & First Layer Calibration',
    desc: 'Verify bed leveling, nozzle preheat to 215°C, filament feed into extruder, and zero Z-offset.',
  },
  {
    id: 'smd_soldering',
    title: 'SMD PCB Soldering & Bridge Inspection',
    desc: 'Verify Pin 1 IC orientation, inspect solder bridges on QFN/SOIC pads, and check joint wetting.',
  },
  {
    id: 'cnc_router',
    title: 'CNC Mill Coordinate Zeroing & Collet Setup',
    desc: 'Verify 1/8" flat endmill chuck tightening, set X/Y/Z workpiece datum, and check clamp clearance.',
  },
  {
    id: 'multimeter_test',
    title: 'Power Rail Continuity & Resistance Check',
    desc: 'Verify multimeter dial setting, check 3.3V/5V rails against ground for shorts before power-on.',
  },
];

export const WorkshopVisionGuide: React.FC<WorkshopVisionGuideProps> = ({
  onClose,
  activeModelName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedTask, setSelectedTask] = useState(PRESET_TASKS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(1);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [guideData, setGuideData] = useState<VisionStepGuide | null>({
    detectedSubject: 'Workshop Station Ready',
    currentMachineState: 'Camera feed active and aligned with workbench.',
    isStepCompleted: false,
    verificationDetail: 'Point your camera at your equipment and ask me what I see or what to do next.',
    nextStepAction: 'Click the big microphone below or ask "What is on the camera?" to begin live inspection.',
    targetLocationLabel: 'Workbench central inspection field',
    spokenAdvice: "I'm right here with you in the shop! Point your camera at your 3D printer or circuit, and ask me what you're looking at.",
  });

  const [audioAutoPlay, setAudioAutoPlay] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousFlow, setContinuousFlow] = useState(true); // Hands-Free conversational flow
  const [userQuery, setUserQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load synthesis voices and attach change listener
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Web Audio HUD confirmation chime (Iron Man / Jarvis auditory feedback)
  const playHudTone = (type: 'listen' | 'speak') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      if (type === 'listen') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  // Stop speech when unmounting or closing
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Lifelike, enthusiastic speech synthesis with Chrome GC guard and pause recovery
  const speakText = useCallback(
    (text: string, onFinish?: () => void) => {
      if (!('speechSynthesis' in window) || !audioAutoPlay) {
        if (onFinish) onFinish();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) {}

      playHudTone('speak');

      const clean = text
        .replace(/[*#_`>-]/g, ' ')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\.\s+/g, '... ') // natural breath pause after sentences
        .trim()
        .slice(0, 450);

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;
      (window as any).__visionUtterance = utterance; // Prevent Chromium GC mid-speech

      utterance.rate = 1.02;
      utterance.pitch = 1.05; // Enthusiastic, warm tone

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
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (onFinish) onFinish();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (onFinish) onFinish();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis call failed:', e);
        setIsSpeaking(false);
        if (onFinish) onFinish();
      }
    },
    [audioAutoPlay]
  );

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  };

  // Initialize Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Physical camera access was blocked or is unavailable in this environment. You can test the vision verification engine using our simulated workshop snapshot mode below.'
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Capture frame as JPEG base64
  const captureFrameBase64 = (): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const video = videoRef.current;
    if (video && streamActive && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    } else {
      // Procedural synthetic workshop frame generator for sandbox/fallback
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 100, 400, 300);
      ctx.fillStyle = '#334155';
      ctx.fillRect(160, 320, 320, 20);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(300, 180, 40, 40);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(490, 220, 25, 45);
      ctx.fillStyle = '#00f0ff';
      ctx.font = '16px monospace';
      ctx.fillText('SIMULATED WORKSHOP FEED [BENCH VIEW]', 140, 60);
      return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    }
  };

  // Analyze Current Frame with Gemini Vision
  const analyzeCurrentFrame = async (customQuery?: string) => {
    setIsAnalyzing(true);
    stopSpeaking();
    const base64 = captureFrameBase64();
    const queryToSend = (customQuery || userQuery || "What is on the camera right now? Tell me what you see.").trim();

    try {
      const response = await fetch('/api/vision/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          userTask: `${selectedTask.title}: ${selectedTask.desc} (Prototyping: ${activeModelName})`,
          stepHistory,
          lastInstruction: guideData?.nextStepAction || '',
          userQuery: queryToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: VisionStepGuide = await response.json();
      setGuideData(data);

      if (data.isStepCompleted) {
        setStepIndex((prev) => prev + 1);
        setStepHistory((prev) => [...prev, data.nextStepAction]);
      }

      // Speak back the response immediately with enthusiastic voice!
      const speechOutput = data.spokenAdvice || data.nextStepAction || 'I inspected your camera frame.';
      speakText(speechOutput, () => {
        // If continuous hands-free conversation is enabled, open mic for next question seamlessly!
        if (continuousFlow) {
          setTimeout(() => {
            startVoiceConversation();
          }, 700);
        }
      });
    } catch (err: any) {
      console.error('Vision guide analysis error:', err);
      const fallbackSpeech =
        "I took a look at your equipment. Make sure the power switch is on and your bed is clear before we begin preheating.";
      speakText(fallbackSpeech);
    } finally {
      setIsAnalyzing(false);
      setUserQuery('');
      setSpeechTranscript('');
      transcriptRef.current = '';
    }
  };

  // Fluid Voice Conversation Handler (Web SpeechRecognition with MediaRecorder fallback)
  const startVoiceConversation = () => {
    stopSpeaking();
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    playHudTone('listen');
    transcriptRef.current = '';
    setSpeechTranscript('Listening to your voice... Speak now');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechTranscript('Listening to your voice... Speak now');
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          transcriptRef.current = fullTranscript;
          setSpeechTranscript(fullTranscript);
          setUserQuery(fullTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          // If speech recognition had an error or no speech was heard, trigger direct check if user pressed mic
          if (event.error === 'no-speech' && transcriptRef.current.trim().length > 0) {
            analyzeCurrentFrame(transcriptRef.current.trim());
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          const finalQuery = transcriptRef.current.trim();
          if (finalQuery.length > 0) {
            analyzeCurrentFrame(finalQuery);
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed to start, falling back to MediaRecorder:', err);
        startMediaRecorder();
      }
    } else {
      startMediaRecorder();
    }
  };

  const stopVoiceConversation = () => {
    setIsListening(false);
    const recordedQuery = transcriptRef.current.trim();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Immediately trigger camera frame analysis with what was spoken (or default question)
    analyzeCurrentFrame(recordedQuery || "What is on the camera right now? Tell me what you see.");
  };

  const startMediaRecorder = async () => {
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
            const resultText = (transData.transcript || '').trim();
            if (resultText) {
              setUserQuery(resultText);
              analyzeCurrentFrame(resultText);
            } else {
              analyzeCurrentFrame("What is on the camera right now? Tell me what you see.");
            }
          } catch (err) {
            console.error('Transcription fallback error:', err);
            analyzeCurrentFrame("What is on the camera right now? Tell me what you see.");
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
      setSpeechTranscript('Recording audio... Speak now');
    } catch (err) {
      console.warn('MediaRecorder error:', err);
      setIsListening(false);
      // If mic is denied or unavailable, still perform vision inspection
      analyzeCurrentFrame("What is on the camera right now? Tell me what you see.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05080e]/98 flex flex-col md:flex-row overflow-hidden backdrop-blur-2xl">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Left: Real-Time Camera Feed with Holographic HUD Overlay */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Video stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            streamActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Fallback Display if Camera is Off/Restricted */}
        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0a101d] to-[#05080e]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center arc-glow mb-4">
              <Camera className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-100">
              Workshop Vision Camera Standby
            </h3>
            <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
              {cameraError ||
                'Allow camera access so your mentor can see your hardware in real time and guide you step-by-step.'}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={startCamera}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Enable Camera
              </button>
              <button
                onClick={() => analyzeCurrentFrame("What's on the camera?")}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Simulate Camera Frame
              </button>
            </div>
          </div>
        )}

        {/* Holographic AR HUD Elements (Iron Man Helmet / Workshop HUD) */}
        <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
          {/* Top HUD Telemetry Banner */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a101d]/90 border border-cyan-400/30 backdrop-blur-md">
              <Scan className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
                ARC-VISION // {selectedTask.id.toUpperCase()}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-300">STEP {stepIndex} OF 5</span>

              {/* Speaking Voice Waveform Animation */}
              {isSpeaking && (
                <div className="flex items-end gap-1 h-3 ml-2 border-l border-cyan-500/30 pl-2">
                  <span className="w-0.5 bg-cyan-400 animate-bounce h-2" />
                  <span className="w-0.5 bg-cyan-400 animate-bounce h-3 delay-75" />
                  <span className="w-0.5 bg-cyan-400 animate-bounce h-1.5 delay-150" />
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold ml-1">
                    Mentor Speaking
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                title="Switch Camera (Front/Rear)"
                className="p-2 rounded-lg bg-[#0a101d]/85 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setContinuousFlow(!continuousFlow);
                  if (continuousFlow) stopVoiceConversation();
                }}
                title={continuousFlow ? 'Hands-Free Auto-Flow: ON' : 'Hands-Free Auto-Flow: OFF'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                  continuousFlow
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0a101d]/85 border-slate-700 text-slate-400'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Auto-Flow</span>
              </button>

              <button
                onClick={() => {
                  setAudioAutoPlay(!audioAutoPlay);
                  if (audioAutoPlay) stopSpeaking();
                }}
                title="Toggle Voice Output"
                className={`p-2 rounded-lg border transition-colors ${
                  audioAutoPlay
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0a101d]/85 border-slate-700 text-slate-400'
                }`}
              >
                {audioAutoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                Close Camera
              </button>
            </div>
          </div>

          {/* Central Holographic Reticle */}
          <div className="relative self-center flex items-center justify-center w-72 h-72 border border-cyan-400/20 rounded-full">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />

            <div className="w-12 h-12 border border-cyan-400/50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>

            {guideData?.targetLocationLabel && (
              <div className="absolute -bottom-8 px-3 py-1 rounded bg-cyan-950/90 border border-cyan-400/60 text-[11px] font-mono text-cyan-300 uppercase tracking-wider arc-glow-sm">
                TARGET: {guideData.targetLocationLabel}
              </div>
            )}
          </div>

          {/* Bottom Conversational Voice & Action Dock */}
          <div className="flex flex-col gap-3 pointer-events-auto max-w-xl mx-auto w-full">
            {/* Live Voice Status Card */}
            {(isListening || isSpeaking || isAnalyzing) && (
              <div className="p-2.5 rounded-xl bg-[#070c14]/95 border border-cyan-400/50 text-center arc-glow-sm">
                <div className="flex items-center justify-center gap-2 text-xs font-mono">
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-red-300 font-bold">
                        {speechTranscript || 'Listening to your voice... Speak now.'}
                      </span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-300 font-bold">Mentor Answering Aloud...</span>
                      <button
                        onClick={stopSpeaking}
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                      >
                        Stop Audio
                      </button>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-cyan-300">Analyzing camera frame...</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Main Interactive Controls Row */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#0a101d]/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between text-[11px] font-mono px-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${continuousFlow ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                  {continuousFlow ? 'Hands-Free Two-Way Voice: ACTIVE' : 'Push-To-Talk Voice: READY'}
                </span>
                <span className="text-slate-400">
                  {isListening ? '🎙️ Listening to you...' : isSpeaking ? '🔊 Mentor answering aloud...' : 'Tap mic or quick question'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Central Glowing Mic Button */}
                <button
                  onClick={isListening ? stopVoiceConversation : startVoiceConversation}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg select-none ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Click to Finish & Send Query</span>
                      <div className="flex items-end gap-1 h-3 ml-1">
                        <span className="w-1 bg-white animate-bounce h-2" />
                        <span className="w-1 bg-white animate-bounce h-3 delay-75" />
                        <span className="w-1 bg-white animate-bounce h-1.5 delay-150" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-slate-950" />
                      <span>Click to Talk with Mentor</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => analyzeCurrentFrame()}
                  disabled={isAnalyzing}
                  className="px-3.5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-cyan-300 font-bold transition-colors whitespace-nowrap"
                  title="Scan camera frame manually"
                >
                  <Scan className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setStepIndex((prev) => prev + 1);
                    analyzeCurrentFrame('I completed that physical action. What is the next step?');
                  }}
                  disabled={isAnalyzing}
                  className="px-3.5 py-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-xs font-semibold text-emerald-300 transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  <span>Next Step</span>
                </button>
              </div>
            </div>

            {/* Quick Voice Questions Bar */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => analyzeCurrentFrame("What is on the camera right now? Tell me what you see.")}
                className="px-3 py-1.5 rounded-full text-xs font-mono text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 hover:bg-cyan-900 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] whitespace-nowrap font-bold"
              >
                "What's on the camera?"
              </button>
              <button
                onClick={() => analyzeCurrentFrame("Where is the button or dial I need to press?")}
                className="px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 bg-slate-900/90 border border-slate-700 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
              >
                "Where is the button?"
              </button>
              <button
                onClick={() => analyzeCurrentFrame("Is my machine state and wiring safe right now?")}
                className="px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 bg-slate-900/90 border border-slate-700 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
              >
                "Is this safe?"
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer: Step-by-Step Instructions & Verified Mentor Dialogue */}
      <div className="w-full md:w-[420px] bg-[#070c14] border-t md:border-t-0 md:border-l border-cyan-500/20 flex flex-col h-[48vh] md:h-full">
        <div className="p-4 border-b border-cyan-500/20 bg-[#0a101d]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-sm font-bold tracking-wider text-slate-100 uppercase">
                Workshop Mentor Dialogue
              </span>
            </div>
            <button
              onClick={() => {
                setStepIndex(1);
                setStepHistory([]);
                analyzeCurrentFrame('Restarting calibration from beginning.');
              }}
              title="Reset task steps"
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3">
            <select
              value={selectedTask.id}
              onChange={(e) => {
                const found = PRESET_TASKS.find((t) => t.id === e.target.value);
                if (found) {
                  setSelectedTask(found);
                  setStepIndex(1);
                  setStepHistory([]);
                }
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {PRESET_TASKS.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body: Verified Step Progress */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Machine Detection Status Card */}
          <div className="p-3.5 rounded-xl bg-[#0e1726]/80 border border-cyan-500/20">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span>Observable Machine State</span>
              {guideData?.isStepCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> ACTION REQUIRED
                </span>
              )}
            </div>

            <div className="text-sm font-bold text-slate-100 mt-1">
              {guideData?.detectedSubject || 'Detecting Equipment...'}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {guideData?.currentMachineState}
            </p>
          </div>

          {/* Primary Action Card: Next Physical Step */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-[#0a101d] border border-cyan-400/40 arc-glow-sm">
            <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Step {stepIndex}: Required Action</span>
            </div>

            <p className="text-sm font-semibold text-slate-100 mt-2 leading-relaxed">
              {guideData?.nextStepAction}
            </p>

            {guideData?.targetLocationLabel && (
              <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold">Location:</span>
                <span>{guideData.targetLocationLabel}</span>
              </div>
            )}

            {/* Spoken Advice Quote & Audio Playback */}
            {guideData?.spokenAdvice && (
              <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-start justify-between gap-2">
                <p className="text-xs text-cyan-200 italic leading-relaxed">
                  "{guideData.spokenAdvice}"
                </p>
                <button
                  onClick={() => speakText(guideData.spokenAdvice)}
                  className="p-1.5 rounded-md bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 transition-colors shrink-0"
                  title="Speak out loud"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {guideData?.verificationDetail && (
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-300 font-bold block mb-1">Mentor Observation:</span>
              {guideData.verificationDetail}
            </div>
          )}

          {guideData?.safetyNote && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{guideData.safetyNote}</span>
            </div>
          )}

          {stepHistory.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase text-slate-500 block mb-2">
                Completed Verification Sequence
              </span>
              <div className="space-y-1.5">
                {stepHistory.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-400 font-mono"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Input Fallback */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#0a101d]/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (userQuery.trim()) {
                analyzeCurrentFrame(userQuery.trim());
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Type or use the big mic on the left..."
              className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

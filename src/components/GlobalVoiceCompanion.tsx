import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  Sparkles,
  Zap,
  MessageSquare,
  X,
  Play,
  ArrowRight,
} from 'lucide-react';
import { VoiceCommandResult, ScenarioCardData, ProductId } from '../types';
import { ActiveViewMode } from './TopBar';

interface GlobalVoiceCompanionProps {
  activeView: ActiveViewMode;
  currentProductId: ProductId;
  onExecuteCommand: (result: VoiceCommandResult) => void;
  onOpenFullChat: (initialQuery?: string) => void;
}

export const GlobalVoiceCompanion: React.FC<GlobalVoiceCompanionProps> = ({
  activeView,
  currentProductId,
  onExecuteCommand,
  onOpenFullChat,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [continuousFlow, setContinuousFlow] = useState(true); // Hands-Free conversational flow
  const [liveTranscript, setLiveTranscript] = useState('');
  const [captionText, setCaptionText] = useState<string | null>(null);
  const [captionSource, setCaptionSource] = useState<'mentor' | 'user'>('mentor');
  const [audioMuted, setAudioMuted] = useState(false);

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

  // Web Audio HUD confirmation chimes
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

  // Lifelike Master Builder Speech Synthesis with Chrome GC guard and pause recovery
  const speakText = useCallback(
    (text: string, onFinish?: () => void) => {
      if (!('speechSynthesis' in window) || audioMuted) {
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
        .slice(0, 480);

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;
      (window as any).__globalUtterance = utterance;

      utterance.rate = 1.02;
      utterance.pitch = 1.05; // Warm, enthusiastic tone

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

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCaptionSource('mentor');
        setCaptionText(clean);
      };

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
        console.warn('Global speech synthesis call failed:', e);
        setIsSpeaking(false);
        if (onFinish) onFinish();
      }
    },
    [audioMuted]
  );

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  };

  // Process User Spoken Voice Query
  const processSpokenQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setIsAnalyzing(true);
    stopSpeaking();
    setCaptionSource('user');
    setCaptionText(trimmed);

    try {
      const response = await fetch('/api/voice/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: trimmed,
          activeProductId: currentProductId,
          activeView,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice intent API returned status ${response.status}`);
      }

      const result: VoiceCommandResult = await response.json();

      // Execute client-side view, schematic, camera, or scenario updates
      onExecuteCommand(result);

      // Mentor speaks response aloud and updates top-right captions
      if (result.spokenResponse) {
        speakText(result.spokenResponse, () => {
          // If hands-free continuous flow is active, re-open mic after brief breath pause!
          if (continuousFlow) {
            setTimeout(() => {
              startListening();
            }, 800);
          }
        });
      }
    } catch (err: any) {
      console.warn('Voice intent error, executing local fallback:', err);
      const fallbackMsg =
        "Stark Forge mentor tracking! I can zoom into the schematics, rotate the 3D model, show the underneath view, or simulate 45-knot wind.";
      speakText(fallbackMsg);
    } finally {
      setIsAnalyzing(false);
      setLiveTranscript('');
      transcriptRef.current = '';
    }
  };

  // Start Speech Recognition
  const startListening = () => {
    stopSpeaking();
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    playHudTone('listen');
    transcriptRef.current = '';
    setLiveTranscript('Listening... Speak now');
    setCaptionSource('user');
    setCaptionText('Listening to your voice... Speak now');

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
          setLiveTranscript('Listening... Speak now');
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          transcriptRef.current = fullTranscript;
          setLiveTranscript(fullTranscript);
          setCaptionText(fullTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          setIsListening(false);
          if (event.error === 'no-speech' && transcriptRef.current.trim().length > 0) {
            processSpokenQuery(transcriptRef.current.trim());
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          const finalQuery = transcriptRef.current.trim();
          if (finalQuery.length > 0) {
            processSpokenQuery(finalQuery);
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed, falling back to MediaRecorder:', err);
        startMediaRecorder();
      }
    } else {
      startMediaRecorder();
    }
  };

  const stopListening = () => {
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

    if (recordedQuery.length > 0) {
      processSpokenQuery(recordedQuery);
    } else {
      setLiveTranscript('');
      setCaptionText(null);
    }
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
              processSpokenQuery(resultText);
            } else {
              setCaptionText(null);
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setCaptionText(null);
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
      setLiveTranscript('Recording audio... Speak now');
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setIsListening(false);
      setCaptionText('Microphone access unavailable. Check browser permissions.');
    }
  };

  const handleVoiceButtonClick = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  return (
    <>
      {/* 1. TOP-RIGHT LIVE CAPTION CHIP (Positioned right underneath 'Consult Mentor') */}
      {captionText && (
        <div className="fixed top-15 right-4 z-40 max-w-sm sm:max-w-md bg-[#070c14]/95 border border-cyan-400/50 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-cyan-500/20 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-ping' : isListening ? 'bg-red-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-300">
                {captionSource === 'user' ? 'You Said (Voice Input)' : 'Mentor Spoken Briefing'}
              </span>
            </div>

            {/* Speaking audio wave animation */}
            {isSpeaking && (
              <div className="flex items-end gap-1 h-2.5">
                <span className="w-0.5 bg-cyan-400 animate-bounce h-2" />
                <span className="w-0.5 bg-cyan-400 animate-bounce h-2.5 delay-75" />
                <span className="w-0.5 bg-cyan-400 animate-bounce h-1.5 delay-150" />
              </div>
            )}

            <button
              onClick={() => {
                stopSpeaking();
                setCaptionText(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Close caption and stop audio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-100 font-sans leading-relaxed">
            {captionText}
          </p>

          {/* Quick Contextual Dialogue Chips */}
          {captionSource === 'mentor' && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-cyan-500/20">
              <button
                onClick={() => processSpokenQuery('I want to see it in another scenario')}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
              >
                "Show another scenario"
              </button>
              <button
                onClick={() => processSpokenQuery('Make enclosure see-through')}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
              >
                "See-through X-Ray"
              </button>
              <button
                onClick={() => processSpokenQuery('Split the materials open')}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
              >
                "Split materials"
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-cyan-500/15">
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(captionText)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                title="Replay mentor voice"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Replay</span>
              </button>

              <button
                onClick={() => onOpenFullChat(captionText)}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>Open Chat</span>
              </button>
            </div>

            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/40 hover:bg-red-900 transition-colors"
              >
                🛑 Stop Audio
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. PERSISTENT FLOATING IRON MAN ARC-VOICE CONTROLLER (Optimized for Mobile, iPad, and Laptop) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 pointer-events-auto">
        {/* Tactile Flick Switch: Hands-Free vs Hands-Controlled */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#070c14]/95 border border-cyan-500/40 backdrop-blur-xl shadow-xl">
          <button
            type="button"
            role="switch"
            aria-checked={continuousFlow}
            onClick={() => {
              const next = !continuousFlow;
              setContinuousFlow(next);
              if (!next) {
                stopListening();
                stopSpeaking();
              }
            }}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-cyan-400/30 transition-colors duration-200 ease-in-out focus:outline-none ${
              continuousFlow ? 'bg-cyan-500/90 shadow-[0_0_12px_rgba(0,240,255,0.4)]' : 'bg-slate-800'
            }`}
            title={continuousFlow ? 'Flick to turn Hands-Free OFF (Switch to Hands-Controlled push-to-talk)' : 'Flick to turn Hands-Free ON (Auto conversational flow)'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
                continuousFlow ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>

          <span className="text-[11px] font-mono font-bold select-none whitespace-nowrap">
            {continuousFlow ? (
              <span className="text-cyan-300 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Hands-Free: ON
              </span>
            ) : (
              <span className="text-slate-400">
                Hands-Controlled
              </span>
            )}
          </span>
        </div>

        {/* Central Luminous Arc-Voice Activator / Stop Button */}
        <div className="relative">
          {isListening && (
            <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping" />
          )}

          <button
            onClick={handleVoiceButtonClick}
            className={`relative flex items-center gap-2 px-4 py-3 sm:py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all select-none shadow-2xl ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.7)]'
                : isSpeaking
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)]'
            }`}
            title={isSpeaking ? 'Click to stop mentor speaking' : isListening ? 'Click to stop & send query' : 'Click to talk with mentor'}
          >
            {isListening ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Sending Query...</span>
                <span className="sm:hidden">Send</span>
              </>
            ) : isSpeaking ? (
              <>
                <Square className="w-4 h-4 fill-current animate-pulse" />
                <span className="hidden sm:inline">Stop Speaking</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Talk With Mentor</span>
                <span className="sm:hidden">Talk</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

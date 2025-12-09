import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Mic, MicOff, X, Zap, Loader2, Volume2, HelpCircle, MessageSquare, Check, BrainCircuit } from 'lucide-react';
import { MediaFile } from '../types';
import { audioContextOptions, outputSampleRate, float32ToInt16, arrayBufferToBase64, int16ToFloat32, base64ToUint8Array } from '../services/audioUtils';

interface VoiceTutorProps {
  files: MediaFile[];
}

interface LiveQuizItem {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

const displayQuestionTool: FunctionDeclaration = {
  name: "displayQuestion",
  description: "Display a multiple choice question on the user's screen. Use this tool whenever you ask a quiz question to show the text to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The question text" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of 3-4 options"
      },
      answer: { type: Type.STRING, description: "The correct answer text (for reference)" }
    },
    required: ["question", "options", "answer"]
  }
};

const VoiceTutor: React.FC<VoiceTutorProps> = ({ files }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [volume, setVolume] = useState(0); 
  const [showHelp, setShowHelp] = useState(false);
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);
  const [currentQuizItem, setCurrentQuizItem] = useState<LiveQuizItem | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null); // Input (Mic)
  const outputAudioContextRef = useRef<AudioContext | null>(null); // Output (Speaker)
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0); // For gapless playback
  const currentSessionRef = useRef<any>(null);

  // Animation frame for volume visualizer
  useEffect(() => {
    let animationFrame: number;
    const updateVolume = () => {
      if (isActive && !isSpeaking) {
        // Mock volume jitter when idle/listening
        setVolume(prev => Math.max(0.1, prev * 0.9)); 
      }
      animationFrame = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, isSpeaking]);

  useEffect(() => {
    // Show tooltip after a delay if not active
    const timer = setTimeout(() => {
      if (!isActive) setHasSeenTooltip(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isActive]);

  const stopSession = () => {
    if (currentSessionRef.current) {
      // There isn't a direct close method on the session object in this SDK version usually,
      // but we can stop sending data and close contexts.
      try {
         // @ts-ignore
        currentSessionRef.current.close?.(); 
      } catch (e) { /* ignore */ }
      currentSessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setCurrentQuizItem(null);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    try {
      if (files.length === 0) {
        alert("Please upload some study material first!");
        return;
      }

      setIsConnecting(true);
      setIsActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: audioContextOptions.sampleRate 
      });
      audioContextRef.current = audioCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: outputSampleRate 
      });
      outputAudioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are Quiz Master, an energetic, friendly, and helpful AI tutor. 
          Your goal is to quiz the user on the study material they have uploaded.
          1. Start by briefly acknowledging the content (e.g., "I see you're studying [Topic]").
          2. Ask the user if they want a quiz or a summary.
          3. If they want a quiz, ask questions one by one.
          4. IMPORTANT: When you ask a multiple-choice question, YOU MUST call the 'displayQuestion' tool with the question text and options so the user can see it.
          5. Wait for the user's answer, then provide feedback.
          6. Keep it conversational and encouraging.`,
          tools: [{ functionDeclarations: [displayQuestionTool] }]
        },
        callbacks: {
          onopen: () => {
            console.log("Session connected");
            setIsConnecting(false);
            
            // Send Initial Visual Context (Images)
            sessionPromise.then(session => {
              files.forEach(file => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: file.mimeType,
                    data: file.data.split(',')[1] // Remove data URL header
                  }
                });
              });

              // Start Audio Streaming
              const source = audioCtx.createMediaStreamSource(stream);
              inputSourceRef.current = source;
              
              const processor = audioCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;
              
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Simple volume meter logic
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(rms * 5); // Scale up for visualizer

                // Convert to PCM and Send
                const pcmData = float32ToInt16(inputData);
                const base64Data = arrayBufferToBase64(pcmData.buffer);
                
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              };
              
              source.connect(processor);
              processor.connect(audioCtx.destination);
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Tool Calls (Display Question)
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'displayQuestion') {
                  const args = fc.args as any;
                  setCurrentQuizItem({
                    id: fc.id,
                    question: args.question,
                    options: args.options,
                    answer: args.answer
                  });
                  
                  // Must respond to tool call
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "displayed" }
                    }
                  }));
                }
              }
            }

            // Handle Audio Output - Raw PCM Decoding
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setIsSpeaking(true);
              
              // 1. Decode Base64 to Uint8Array
              const bytes = base64ToUint8Array(audioData);
              
              // 2. Convert PCM 16-bit to Float32
              // Ensure we are working with complete 16-bit samples
              const int16 = new Int16Array(bytes.buffer);
              const float32 = int16ToFloat32(int16);
              
              // 3. Create Audio Buffer
              const ctx = outputAudioContextRef.current;
              const buffer = ctx.createBuffer(1, float32.length, outputSampleRate);
              buffer.getChannelData(0).set(float32);
              
              // 4. Schedule Playback (Gapless)
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              // Sync next start time
              if (nextStartTimeRef.current < ctx.currentTime) {
                nextStartTimeRef.current = ctx.currentTime;
              }
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              // Visualizer logic (approximate)
              source.onended = () => {
                if (ctx.currentTime >= nextStartTimeRef.current) {
                  setIsSpeaking(false);
                }
              };
            }
          },
          onclose: () => {
            console.log("Session closed");
            stopSession();
          },
          onerror: (err) => {
            console.error("Session error:", err);
            stopSession();
          }
        }
      });
      
      currentSessionRef.current = await sessionPromise;

    } catch (e) {
      console.error("Failed to start session:", e);
      setIsConnecting(false);
      setIsActive(false);
      alert("Microphone access is required for Voice Tutor.");
    }
  };

  return (
    <>
      {/* Active Voice Overlay */}
      {isActive && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 flex flex-col items-end z-[100] space-y-4">
          
          {/* Live Question Card */}
          {currentQuizItem && (
            <div className="w-full bg-white/90 backdrop-blur-xl border border-white/50 p-5 rounded-3xl shadow-2xl shadow-indigo-200/50 animate-fade-in-up">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">
                  Live Question
                </span>
                <button 
                  onClick={() => setCurrentQuizItem(null)} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
              <h4 className="font-bold text-slate-800 leading-snug mb-4">{currentQuizItem.question}</h4>
              <div className="space-y-2">
                {currentQuizItem.options.map((opt, i) => (
                  <div key={i} className="text-sm p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Status Card */}
          <div className="bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-[28px] shadow-2xl flex items-center gap-4 border border-white/10 w-full">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center border border-white/20">
                <BrainCircuit size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-white">Quiz Master</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {isConnecting ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Connecting...
                  </span>
                ) : isSpeaking ? (
                   <div className="flex items-center gap-1 h-3">
                     <span className="w-0.5 h-2 bg-indigo-400 animate-pulse"></span>
                     <span className="w-0.5 h-3 bg-indigo-400 animate-pulse delay-75"></span>
                     <span className="w-0.5 h-2 bg-indigo-400 animate-pulse delay-150"></span>
                     <span className="text-xs text-indigo-300 font-medium ml-1">Speaking...</span>
                   </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Listening...</span>
                )}
              </div>
            </div>

            {/* Visualizer */}
            <div className="flex items-center gap-0.5 h-8">
               {[1,2,3,4,5].map(i => (
                 <div 
                   key={i} 
                   className="w-1 bg-white/40 rounded-full transition-all duration-75"
                   style={{ height: `${Math.max(4, Math.min(24, volume * 10 * i)) }px` }}
                 />
               ))}
            </div>

            <button 
              onClick={stopSession}
              className="p-2 bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-full transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Inactive State) */}
      {!isActive && (
        <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end space-y-2">
          
          {/* Tooltip */}
          {(!hasSeenTooltip && files.length > 0) && (
             <div className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg mb-2 mr-1 shadow-lg animate-bounce origin-bottom-right">
               Try Voice Mode!
               <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-900 rotate-45"></div>
             </div>
          )}

          {/* Help Bubble */}
          {showHelp && (
            <div className="mb-2 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 w-64 text-sm text-slate-600 animate-fade-in origin-bottom-right">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-slate-900 flex items-center gap-2">
                   <Zap size={14} className="text-amber-500 fill-amber-500" />
                   Voice Commands
                 </h4>
                 <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>"Quiz me on this chapter"</li>
                <li>"Explain the diagram on page 2"</li>
                <li>"Why is option A incorrect?"</li>
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="w-10 h-10 bg-white text-slate-500 rounded-full shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={startSession}
              className={`group flex items-center gap-3 pl-5 pr-2 py-2 rounded-full shadow-2xl transition-all duration-300 ${
                files.length === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:scale-105 hover:bg-slate-800'
              }`}
            >
              <span className="font-bold text-sm hidden group-hover:inline-block">Talk to Quiz Master</span>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                files.length > 0 ? 'bg-gradient-to-tr from-indigo-500 to-violet-500' : 'bg-slate-300'
              }`}>
                <Mic size={20} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceTutor;
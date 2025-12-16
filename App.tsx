import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, Lock, ArrowRight, ArrowLeft, Eye, Loader2, Volume2, VolumeX, UnlockKeyhole, Unlock } from 'lucide-react';
import { getMissionData } from './services/geminiService'; // Renomeado conceitualmente, arquivo mantido
import { AppStep, GeneratedContent, TargetData } from './types';
import { Button } from './components/Button';
import { GlitchText } from './components/GlitchText';
import { soundService } from './services/soundService';

// --- CONFIGURAÇÃO DO ALVO ---
// Edite estas informações para a pessoa que será revelada
const TARGET_PROFILE: TargetData = {
  name: "THAMIRYS", 
  description: "Alvo civil. Características marcantes: Silêncio, vício em salgadinhos de milho e vestuário de alta cobertura.",
  
  // ENIGMA: Poético e paradoxal. Não entrega "Salgadinho" ou "Manga comprida" diretamente.
  fixedEnigma: "Carrego o inverno nos braços, mesmo quando o sol queima lá fora. Meu silêncio é estratégico, mas a crocância me trai. Minha expressão é uma pergunta permanente, desenhada em arcos altos acima do olhar. Quem sou eu?",
  
  // DICAS CRIPTOGRAFADAS (DIFÍCEIS - NÍVEL PROTOCOLO SOMBRA)
  // Devem soar como um relatório alienígena ou de espionagem sobre um comportamento humano estranho.
  hardClues: [
    "TOPOGRAFIA FACIAL: O horizonte do alvo apresenta curvaturas parabólicas permanentes. O nível de ceticismo do sujeito é mensurável pela altitude dessas estruturas acima da linha visual.",
    "ADAPTAÇÃO AMBIENTAL NEGADA: O sujeito opera em um microclima isolado. A superfície dos membros superiores é classificada como 'CONFIDENCIAL' e nunca foi capturada pelos sensores ópticos da base.",
    "PADRÃO DE CONSUMO: O combustível primário do alvo é geométrico, triangular e acústico. A manipulação do material deixa marcadores químicos de pigmentação intensa nas extremidades digitais."
  ],
  
  // DICAS DE BAIXA SEGURANÇA (FÁCEIS - A REVELAÇÃO)
  easyClues: [
    "A DIETA DO ALVO É BASEADA EM TRIÂNGULOS DE MILHO.",
    "A EMBALAGEM VERMELHA É SUA MARCA REGISTRADA.",
    "SUA SOBRANCELHA É TÃO ARQUEADA QUE QUASE TOCA O CABELO.",
    "SEMPRE, ABSOLUTAMENTE SEMPRE, ESTÁ DE MANGA COMPRIDA.",
    "SONHO DE CONSUMO: TER UM TROLÉBUS DE ESTIMAÇÃO."
  ]
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.TITLE);
  const [missionContent, setMissionContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealedClues, setRevealedClues] = useState<number>(-1);
  const [isMuted, setIsMuted] = useState(false);
  
  // State for Typewriter effect on Reveal
  const [displayedName, setDisplayedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Initialize mission on mount
  useEffect(() => {
    const initMission = async () => {
      setIsLoading(true);
      // Agora usa apenas dados estáticos
      const content = await getMissionData(TARGET_PROFILE);
      setMissionContent(content);
      setIsLoading(false);
    };
    initMission();
  }, []);

  // Global Audio Unlocker
  useEffect(() => {
    const unlockAudio = () => {
      soundService.initialize();
      // Se estiver na tela inicial, já tenta dar o play na trilha
      if (step === AppStep.TITLE) {
        soundService.startAmbient();
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    return () => window.removeEventListener('click', unlockAudio);
  }, [step]);

  // Handle Sounds based on Steps
  useEffect(() => {
    // Para qualquer mudança de etapa, tenta inicializar o áudio se ainda não tiver sido feito
    soundService.initialize();

    if (step === AppStep.TITLE) {
      soundService.stopCelebration(); // Garante que a celebração para ao reiniciar
      soundService.startAmbient();
    }

    if (step === AppStep.WARNING) {
      soundService.stopAmbient(); // Pausa o ambient para dar lugar ao alarme
      soundService.stopCelebration();
      soundService.startAlarm();
    } else {
      soundService.stopAlarm();
      
      // Lógica de trilhas
      if (step === AppStep.REVEAL) {
        soundService.stopAmbient();
        soundService.playSuccess(); // Toca o som de impacto
        soundService.startCelebration(); // Toca a música alegre em loop
      } else if (step !== AppStep.TITLE) {
        // Nas outras telas (Dicas, Enigma) volta o ambiente dark se não for título (já tratado) ou reveal
        soundService.stopCelebration();
        soundService.startAmbient();
      }
    }

    // Cleanup: parar alarme se sair do componente (não acontece aqui, mas boa prática)
    return () => {
      soundService.stopAlarm();
    };
  }, [step]);

  // Clean displayedName when NOT in REVEAL to prevent flash of old name
  useEffect(() => {
    if (step !== AppStep.REVEAL) {
      setDisplayedName('');
    }
  }, [step]);

  // Typewriter Effect Logic for Reveal
  useEffect(() => {
    if (step === AppStep.REVEAL) {
      // Ensure we start fresh regardless of previous state
      setDisplayedName('');
      
      const fullName = TARGET_PROFILE.name;
      let index = 0;
      
      // Small delay to ensure render cycle catches up with empty state before typing starts
      const startTimeout = setTimeout(() => {
        const typingInterval = setInterval(() => {
          if (index < fullName.length) {
            index++;
            setDisplayedName(fullName.substring(0, index));
            // Optional: soundService.playKeystroke(); 
          } else {
            clearInterval(typingInterval);
          }
        }, 250); // Velocidade da digitação (ms)
        
        // Cleanup interval if component unmounts during typing
        return () => clearInterval(typingInterval);
      }, 100);

      return () => clearTimeout(startTimeout);
    }
  }, [step]);

  // Cursor Blinking Effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const nextStep = () => {
    if (step === AppStep.TITLE) {
      soundService.playTransition();
      // Adiciona um delay para permitir que o som de transição "Warp" toque antes do alerta começar
      setTimeout(() => {
        setStep(prev => prev + 1);
      }, 800);
    } else if (step === AppStep.EASY_CLUES) {
      soundService.playClick();
      setStep(AppStep.REVEAL);
    } else {
      soundService.playClick();
      if (step < AppStep.REVEAL) {
        setStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    soundService.playCancel();
    if (step === AppStep.EASY_CLUES) {
      setStep(AppStep.ENIGMA);
      return;
    }
    if (step > AppStep.TITLE) {
      setStep(prev => prev - 1);
    }
  };

  const handleRevealClue = () => {
    soundService.playDataReveal();
    setRevealedClues(prev => prev + 1);
  };

  const handleGoToEasyClues = () => {
    soundService.playClick();
    setStep(AppStep.EASY_CLUES);
  };

  // Reset clues reveal when entering CLUES step
  useEffect(() => {
    if (step === AppStep.CLUES) {
      setRevealedClues(-1);
    }
  }, [step]);

  // Audio effect simulation (visual only)
  useEffect(() => {
    const flicker = document.querySelector('.crt-flicker') as HTMLElement;
    if(flicker) {
        flicker.style.animationDuration = Math.random() * 0.2 + 0.1 + 's';
    }
  }, [step]);


  const renderContent = () => {
    switch (step) {
      case AppStep.TITLE:
        return (
          <div className="text-center animate-in fade-in duration-1000 cursor-pointer" onClick={() => soundService.initialize()}>
            <div className="mb-4 flex justify-center">
              <Fingerprint className="w-24 h-24 text-terminal-green animate-pulse" />
            </div>
            <GlitchText 
              text="PROTOCOLO SOMBRA" 
              as="h1" 
              className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-white tracking-widest mb-4 uppercase" 
            />
            <p className="font-mono text-terminal-green text-sm md:text-xl tracking-widest typing-effect border-r-2 border-terminal-green pr-2 animate-pulse inline-block">
              INICIANDO SEQUÊNCIA DE REVELAÇÃO...
            </p>
            <p className="mt-4 text-xs text-gray-600 animate-pulse">// Clique na tela para iniciar o áudio //</p>
          </div>
        );

      case AppStep.WARNING:
        return (
          <div className="max-w-3xl text-center border-4 border-alert-red p-6 md:p-8 bg-alert-red bg-opacity-10 relative overflow-hidden my-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-alert-red animate-pulse-fast"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-alert-red animate-pulse-fast"></div>
            
            <ShieldAlert className="w-24 h-24 text-alert-red mx-auto mb-6 animate-bounce" />
            
            <h2 className="text-4xl md:text-5xl font-display font-bold text-alert-red mb-6 uppercase tracking-widest">
              ALERTA DE SEGURANÇA
            </h2>
            
            <p className="font-mono text-xl md:text-2xl text-white leading-relaxed mt-4">
              ATENÇÃO, AGENTES. SE VOCÊ FOR UM GRANDE INVESTIGADOR E DESCOBRIR QUEM É O ALVO ANTES QUE O APRESENTADOR PERGUNTE...
            </p>
            
            <div className="mt-6 text-alert-red font-mono text-sm animate-pulse">
              // MANTENHA O SILÊNCIO OPERACIONAL //
            </div>
          </div>
        );

      case AppStep.CLUES:
        if (!missionContent && isLoading) {
          return (
             <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 text-terminal-green animate-spin" />
                <p className="font-mono text-xl text-terminal-green animate-pulse">DECODIFICANDO ARQUIVOS CRIPTOGRAFADOS...</p>
             </div>
          );
        }

        return (
          <div className="w-full max-w-4xl p-6 h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4 border-b border-terminal-green pb-4 shrink-0">
              <Eye className="w-8 h-8 text-terminal-green" />
              <h2 className="text-3xl font-display text-white uppercase">DICAS CRIPTOGRAFADAS</h2>
            </div>
            
            <div className="space-y-4 flex-grow flex flex-col justify-center relative min-h-[300px]">
              {missionContent?.clues.map((clue, index) => (
                <div 
                  key={index} 
                  className={`border border-gray-700 bg-black p-4 transition-all duration-500 transform w-full ${
                    index <= revealedClues 
                      ? 'opacity-100 translate-x-0 relative' 
                      : 'opacity-0 -translate-x-10 pointer-events-none absolute top-0'
                  }`}
                >
                  <div className="flex items-start gap-4">
                     <span className="text-cyber-cyan font-mono font-bold text-xl">0{index + 1} //</span>
                     <p className="font-mono text-lg md:text-xl text-terminal-green">{clue}</p>
                  </div>
                </div>
              ))}
            </div>

            {missionContent && revealedClues < (missionContent.clues.length || 0) - 1 && (
               <div className="mt-8 text-center shrink-0 pb-4">
                 <Button onClick={handleRevealClue} variant="secondary" className="text-sm">
                   {revealedClues === -1 ? "DECODIFICAR PRIMEIRA DICA" : "DECODIFICAR PRÓXIMA DICA"}
                 </Button>
               </div>
            )}
          </div>
        );

      case AppStep.ENIGMA:
        return (
          <div className="w-full max-w-3xl text-center my-8">
            <Lock className="w-16 h-16 text-cyber-cyan mx-auto mb-4" />
            <h2 className="text-4xl font-display text-white mb-6 uppercase">ENIGMA FINAL</h2>
            
            <div className="bg-black border-2 border-cyber-cyan p-6 md:p-10 relative shadow-[0_0_30px_rgba(0,243,255,0.2)]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-cyan"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-cyan"></div>
              
              <p className="font-mono text-xl md:text-3xl text-cyber-cyan leading-relaxed">
                "{missionContent?.enigma}"
              </p>
            </div>

            <p className="mt-6 font-mono text-gray-400 text-lg md:text-xl animate-pulse">
              IDENTIFIQUE O ALVO AGORA. QUEM SOU EU?
            </p>

            <div className="mt-8">
              <Button onClick={handleGoToEasyClues} variant="warning" className="text-sm">
                <UnlockKeyhole className="w-4 h-4 inline-block mr-2" />
                ACESSAR DICAS FÁCEIS
              </Button>
            </div>
          </div>
        );

      case AppStep.EASY_CLUES:
        return (
          <div className="w-full max-w-6xl text-center p-2 h-full flex flex-col justify-center">
            <div className="shrink-0 mb-4 mt-8 md:mt-0">
              <UnlockKeyhole className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-3xl font-display text-yellow-400 uppercase tracking-widest">
                DICAS DE BAIXA SEGURANÇA
              </h2>
            </div>
            
            {/* GRID DE EVIDÊNCIAS - Reduzido para caber na tela */}
            <div className="flex flex-wrap justify-center gap-4 mb-4 shrink-0">
              
              {/* EVIDÊNCIA 1: DORITOS (SVG) */}
              <div className="relative group inline-block">
                 <div className="absolute -inset-1 bg-yellow-400/20 blur-sm group-hover:bg-yellow-400/40 transition-all duration-500 rounded-lg"></div>
                 <div className="relative border border-yellow-400 border-dashed p-2 bg-black/80 w-[140px] h-[140px] md:w-[200px] md:h-[200px] flex items-center justify-center flex-col">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-1 py-0.5 z-10">EVIDÊNCIA #891</div>
                    
                    <svg viewBox="0 0 200 280" className="w-16 md:w-24 h-auto drop-shadow-xl hover:scale-105 transition-transform duration-500">
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <path d="M10 20 C 60 5, 140 5, 190 20 L 180 260 C 140 275, 60 275, 20 260 Z" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
                      <path d="M30 30 Q 100 20 170 30" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                      <path d="M25 250 Q 100 265 175 250" stroke="rgba(0,0,0,0.4)" strokeWidth="3" fill="none" />
                      <path d="M50 80 L 150 80 L 100 170 Z" fill="black" stroke="white" strokeWidth="2" />
                      <path d="M55 85 L 145 85 L 100 160 Z" fill="#ef4444" />
                      <path d="M60 90 L 140 90" stroke="yellow" strokeWidth="2" opacity="0.8" />
                      <text x="100" y="115" textAnchor="middle" fill="white" fontSize="22" fontFamily="Arial, sans-serif" fontWeight="900" style={{textShadow: "2px 2px 0px black"}}>DORITOS</text>
                      <text x="100" y="135" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace">NACHO CHEESE</text>
                      <path d="M130 190 L 170 190 L 150 230 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" transform="rotate(15 150 210)" />
                      <circle cx="140" cy="200" r="1" fill="#b45309" />
                      <circle cx="160" cy="205" r="1" fill="#b45309" />
                      <circle cx="150" cy="215" r="1" fill="#b45309" />
                    </svg>

                    <div className="mt-2 absolute bottom-2 left-0 right-0 text-center z-10">
                      <p className="font-mono text-[9px] text-yellow-400/70 uppercase bg-black/50 inline-block px-2">ANÁLISE NUTRICIONAL</p>
                    </div>
                 </div>
              </div>

              {/* EVIDÊNCIA 2: OLHO (DIGITAL RECONSTRUCTION - SVG) */}
              <div className="relative group inline-block">
                 <div className="absolute -inset-1 bg-yellow-400/20 blur-sm group-hover:bg-yellow-400/40 transition-all duration-500 rounded-lg"></div>
                 <div className="relative border border-yellow-400 border-dashed p-2 bg-black/80 w-[140px] h-[140px] md:w-[200px] md:h-[200px] flex items-center justify-center flex-col">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-1 py-0.5 z-10">EVIDÊNCIA #892</div>
                    
                    <svg viewBox="0 0 200 200" className="w-24 h-24 md:w-28 md:h-28 drop-shadow-xl">
                        <defs>
                        <clipPath id="eyeClip">
                            <path d="M 40 140 Q 100 100 160 140 Q 100 180 40 140 Z" />
                        </clipPath>
                        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(250, 204, 21, 0)" />
                            <stop offset="50%" stopColor="rgba(250, 204, 21, 0.5)" />
                            <stop offset="100%" stopColor="rgba(250, 204, 21, 0)" />
                        </linearGradient>
                        </defs>
                        
                        {/* Grid Background */}
                        <path d="M 0 50 L 200 50 M 0 100 L 200 100 M 0 150 L 200 150 M 50 0 L 50 200 M 100 0 L 100 200 M 150 0 L 150 200" stroke="rgba(250, 204, 21, 0.1)" strokeWidth="1" />

                        {/* Eye Shape moved down to allow extreme eyebrow arch */}
                        <path d="M 40 140 Q 100 100 160 140 Q 100 180 40 140 Z" fill="none" stroke="#facc15" strokeWidth="2" />
                        
                        {/* Iris & Pupil */}
                        <g clipPath="url(#eyeClip)">
                        <circle cx="100" cy="140" r="25" fill="#facc15" fillOpacity="0.2" />
                        <circle cx="100" cy="140" r="12" fill="#facc15" />
                        <circle cx="105" cy="135" r="4" fill="white" fillOpacity="0.8" />
                        </g>
                        
                        {/* Eyebrow - EXTREMELY HIGH ARCHED VERSION */}
                        {/* Pushed up using negative control point and moving start/end down to match eye */}
                        <path d="M 30 115 Q 100 -30 170 115" fill="none" stroke="#facc15" strokeWidth="12" strokeLinecap="round" opacity="0.9" />
                        
                        {/* Scanning Line Animation */}
                        <rect x="0" y="0" width="200" height="200" fill="url(#scanGradient)" opacity="0.3">
                        <animate attributeName="y" from="-200" to="200" dur="2s" repeatCount="indefinite" />
                        </rect>

                        {/* Reticle / Target - Moved down to match new eye position */}
                        <path d="M 80 120 L 90 120 M 80 120 L 80 130" stroke="#facc15" strokeWidth="1" />
                        <path d="M 120 120 L 110 120 M 120 120 L 120 130" stroke="#facc15" strokeWidth="1" />
                        <path d="M 80 160 L 90 160 M 80 160 L 80 150" stroke="#facc15" strokeWidth="1" />
                        <path d="M 120 160 L 110 160 M 120 160 L 120 150" stroke="#facc15" strokeWidth="1" />
                    </svg>

                    <div className="mt-2 absolute bottom-2 left-0 right-0 text-center z-10">
                      <p className="font-mono text-[9px] text-yellow-400/70 uppercase bg-black/50 inline-block px-2">ANÁLISE BIOMÉTRICA</p>
                    </div>
                 </div>
              </div>

               {/* EVIDÊNCIA 3: BLUSA DE MANGA COMPRIDA (SVG FULL SHIRT) */}
               <div className="relative group inline-block">
                 <div className="absolute -inset-1 bg-yellow-400/20 blur-sm group-hover:bg-yellow-400/40 transition-all duration-500 rounded-lg"></div>
                 <div className="relative border border-yellow-400 border-dashed p-2 bg-black/80 w-[140px] h-[140px] md:w-[200px] md:h-[200px] flex items-center justify-center flex-col">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-1 py-0.5 z-10">EVIDÊNCIA #893</div>
                    
                    <svg viewBox="0 0 200 200" className="w-24 h-24 md:w-28 md:h-28 drop-shadow-xl">
                        {/* Grid Background */}
                        <path d="M 0 40 L 200 40 M 0 80 L 200 80 M 0 120 L 200 120 M 0 160 L 200 160 M 40 0 L 40 200 M 80 0 L 80 200 M 120 0 L 120 200 M 160 0 L 160 200" stroke="rgba(250, 204, 21, 0.1)" strokeWidth="1" />

                        {/* FULL SHIRT OUTLINE */}
                        <path 
                          d="M 85 35 Q 100 50 115 35 L 150 55 L 175 140 L 155 140 L 135 95 L 135 175 L 65 175 L 65 95 L 45 140 L 25 140 L 50 55 Z"
                          stroke="#facc15" strokeWidth="2" fill="rgba(250, 204, 21, 0.1)" strokeLinejoin="round"
                        />
                        {/* Detail Lines */}
                        <path d="M 85 35 Q 100 50 115 35" stroke="#facc15" strokeWidth="2" fill="none" opacity="0.8" />
                        <line x1="155" y1="140" x2="160" y2="125" stroke="#facc15" strokeWidth="1" opacity="0.7" />
                        <line x1="45" y1="140" x2="40" y2="125" stroke="#facc15" strokeWidth="1" opacity="0.7" />
                        <line x1="65" y1="165" x2="135" y2="165" stroke="#facc15" strokeWidth="1" opacity="0.5" strokeDasharray="4 2" />
                        <text x="160" y="95" fill="#facc15" fontSize="8" fontFamily="monospace">MANGA</text>
                        <text x="40" y="193" fill="#facc15" fontSize="8" fontFamily="monospace" textAnchor="middle">BAINHA</text>
                    </svg>

                    <div className="mt-2 absolute bottom-2 left-0 right-0 text-center z-10">
                      <p className="font-mono text-[9px] text-yellow-400/70 uppercase bg-black/50 inline-block px-2">ANÁLISE VESTUÁRIO</p>
                    </div>
                 </div>
              </div>

               {/* EVIDÊNCIA 4: TROLÉBUS (SVG) */}
               <div className="relative group inline-block">
                 <div className="absolute -inset-1 bg-yellow-400/20 blur-sm group-hover:bg-yellow-400/40 transition-all duration-500 rounded-lg"></div>
                 <div className="relative border border-yellow-400 border-dashed p-2 bg-black/80 w-[140px] h-[140px] md:w-[200px] md:h-[200px] flex items-center justify-center flex-col">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-1 py-0.5 z-10">EVIDÊNCIA #894</div>
                    
                    <svg viewBox="0 0 200 200" className="w-24 h-24 md:w-28 md:h-28 drop-shadow-xl">
                        {/* Wires */}
                        <line x1="0" y1="30" x2="200" y2="30" stroke="#facc15" strokeWidth="1" opacity="0.5" />
                        <line x1="0" y1="35" x2="200" y2="35" stroke="#facc15" strokeWidth="1" opacity="0.5" />

                        {/* Trolley Poles */}
                        <line x1="140" y1="70" x2="160" y2="30" stroke="#facc15" strokeWidth="2" />
                        <line x1="60" y1="70" x2="40" y2="30" stroke="#facc15" strokeWidth="2" />

                        {/* Bus Body */}
                        <rect x="40" y="70" width="120" height="70" rx="5" stroke="#facc15" strokeWidth="2" fill="rgba(250, 204, 21, 0.1)" />
                        
                        {/* Windows */}
                        <rect x="45" y="80" width="30" height="25" stroke="#facc15" strokeWidth="1" fill="none" />
                        <rect x="80" y="80" width="30" height="25" stroke="#facc15" strokeWidth="1" fill="none" />
                        <rect x="115" y="80" width="40" height="25" stroke="#facc15" strokeWidth="1" fill="none" />

                        {/* Wheels */}
                        <circle cx="65" cy="140" r="12" stroke="#facc15" strokeWidth="2" fill="black" />
                        <circle cx="135" cy="140" r="12" stroke="#facc15" strokeWidth="2" fill="black" />
                        
                        {/* Details */}
                        <text x="100" y="165" fill="#facc15" fontSize="8" fontFamily="monospace" textAnchor="middle">VEÍCULO ELÉTRICO</text>
                        <text x="135" y="100" fill="#facc15" fontSize="6" fontFamily="monospace" textAnchor="middle" opacity="0.7">BUS</text>
                    </svg>

                    <div className="mt-2 absolute bottom-2 left-0 right-0 text-center z-10">
                      <p className="font-mono text-[9px] text-yellow-400/70 uppercase bg-black/50 inline-block px-2">SONHO DE CONSUMO</p>
                    </div>
                 </div>
              </div>

            </div>

            <div className="space-y-3 max-w-4xl mx-auto shrink-0 pb-6">
              {TARGET_PROFILE.easyClues?.map((clue, index) => (
                <div key={index} className="border border-yellow-400/30 bg-yellow-400/5 p-3 transform transition-all hover:scale-[1.01] duration-300">
                  <p className="font-mono text-xs md:text-sm lg:text-lg text-yellow-100">
                    <span className="text-yellow-400 font-bold mr-3">{`>`}</span>
                    {clue}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-2 shrink-0 flex flex-col items-center gap-2 pb-8">
                <p className="text-xs text-yellow-400/60 font-mono animate-pulse">
                // CRIPTOGRAFIA DESATIVADA. IDENTIDADE EXPOSTA.
                </p>
                <Button onClick={() => { soundService.playClick(); setStep(AppStep.REVEAL); }} variant="warning">
                    REVELAR IDENTIDADE FINAL <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                </Button>
            </div>
          </div>
        );

      case AppStep.REVEAL:
        return (
          <div className="text-center w-full max-w-5xl my-auto" key="reveal-container">
            <div className="mb-8">
              <Unlock className="w-24 h-24 text-terminal-green mx-auto mb-4 animate-bounce" />
              <p className="font-mono text-gray-400">ACESSO CONCEDIDO</p>
            </div>
            
            <div className="relative group min-h-[160px] md:min-h-[200px] flex items-center justify-center">
              <div className="absolute inset-0 bg-terminal-green blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
              
              {/* Nome com efeito de digitação e Glitch */}
              <div className="relative" key={`typewriter-${step}`}>
                <GlitchText 
                  text={displayedName} 
                  as="h1" 
                  className="relative text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black text-white uppercase drop-shadow-[0_0_15px_rgba(0,255,0,0.8)]" 
                />
                <span className={`text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black text-terminal-green inline-block ml-2 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
              </div>
            </div>
            
            <div className={`mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-800 pt-8 transition-opacity duration-1000 ${displayedName === TARGET_PROFILE.name ? 'opacity-70' : 'opacity-0'}`}>
              <div className="font-mono text-sm text-gray-500">
                STATUS: <span className="text-terminal-green">IDENTIFICADO</span>
              </div>
              <div className="font-mono text-sm text-gray-500">
                MISSÃO: <span className="text-terminal-green">CUMPRIDA</span>
              </div>
              <div className="font-mono text-sm text-gray-500">
                PROTOCOLO: <span className="text-terminal-green">ENCERRADO</span>
              </div>
            </div>

             <div className={`mt-12 pb-8 transition-opacity duration-1000 ${displayedName === TARGET_PROFILE.name ? 'opacity-100' : 'opacity-100'}`}>
               <Button onClick={() => setStep(AppStep.TITLE)} variant="secondary">
                 REINICIAR PROTOCOLO
               </Button>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen md:h-screen w-screen bg-terminal-bg text-terminal-green font-mono flex flex-col relative selection:bg-terminal-green selection:text-black overflow-y-auto md:overflow-hidden"
      onClick={() => soundService.initialize()} // Ensure any click unlocks audio
    >
      
      {/* Header / Status Bar */}
      <header className="border-b border-gray-800 p-3 flex justify-between items-center bg-black bg-opacity-90 z-40 shrink-0 sticky top-0 md:static">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${step === AppStep.WARNING ? 'bg-alert-red animate-ping' : 'bg-terminal-green animate-pulse'}`}></div>
          <span className="text-xs tracking-widest opacity-70">SISTEMA ONLINE // v.2.1.0 (MANUAL MODE)</span>
        </div>
        
        <div className="flex items-center gap-4">
             <button onClick={(e) => { e.stopPropagation(); handleToggleMute(); }} className="hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
             </button>
            <div className="text-xs tracking-widest opacity-50">
                PASSO: 0{step === AppStep.EASY_CLUES ? 'X' : step} / 04
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full">
        {renderContent()}
      </main>

      {/* Navigation Footer */}
      {step < AppStep.REVEAL && (
        <footer className="p-4 border-t border-gray-800 bg-black bg-opacity-90 z-40 shrink-0 w-full">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
             <Button 
               onClick={prevStep} 
               disabled={step === AppStep.TITLE}
               variant="secondary"
               className={`flex items-center gap-2 py-2 px-4 text-sm ${step === AppStep.TITLE ? 'opacity-0 pointer-events-none' : ''}`}
             >
               <ArrowLeft className="w-4 h-4" /> REGREDIR
             </Button>

             <Button 
               onClick={nextStep} 
               disabled={step === AppStep.CLUES && (!missionContent || revealedClues < (missionContent.clues.length || 0) - 1)}
               variant={step === AppStep.WARNING ? 'danger' : 'primary'}
               className={`flex items-center gap-2 py-2 px-4 text-sm ${(step === AppStep.CLUES && (!missionContent || revealedClues < (missionContent.clues.length || 0) - 1)) ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {step === AppStep.WARNING ? 'AVANÇAR' : 'AVANÇAR'} <ArrowRight className="w-4 h-4" />
             </Button>
          </div>
        </footer>
      )}

      {/* Decorative Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
    </div>
  );
};

export default App;
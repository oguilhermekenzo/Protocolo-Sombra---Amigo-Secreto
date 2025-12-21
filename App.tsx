import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, Lock, ArrowRight, ArrowLeft, Eye, Loader2, Volume2, VolumeX, UnlockKeyhole, Unlock } from 'lucide-react';
import { getMissionData } from './services/geminiService';
import { AppStep, GeneratedContent, TargetData } from './types';
import { Button } from './components/Button';
import { GlitchText } from './components/GlitchText';
import { soundService } from './services/soundService';

// --- CONFIGURAÇÃO DO ALVO ---
const TARGET_PROFILE: TargetData = {
  name: "THAMIRYS", 
  description: "Alvo civil. Perfil de alta evasão e comportamento sistemático.",
  
  // ENIGMA FINAL: Refinado para ser "Shadow Protocol" mas sem soar "zodo"
  fixedEnigma: "Minha unidade opera em contenção térmica absoluta, blindada por tecidos que negam a luz externa. Meu processamento nutritivo gera resíduos ocre e emissões acústicas de fratura constante. Na zona frontal, a topografia se eleva em uma curvatura de vigilância perpétua, uma linha analítica que desafia a linearidade do mundo. Quem sou eu?",
  
  hardClues: [
    "VETOR SUPRAORBITAL: Sensores biométricos detectam uma distorção geométrica permanente na região frontal. A curvatura parabólica dos tecidos atinge altitudes atípicas, sugerindo um estado constante de análise crítica ou incredulidade operacional.",
    "OPACIDADE DÉRMICA BRAQUIAL: O sujeito mantém um protocolo de contenção atmosférica rigoroso. Existe uma recusa sistemática em expor a derme dos membros superiores à radiação solar, resultando em um microclima isolado por barreiras têxteis de alta cobertura.",
    "RESONÂNCIA DE FRATURA MECÂNICA: O processamento de nutrientes pelo alvo gera emissões acústicas de alta frequência por impacto. A manipulação de tais unidades resulta em deposição de sedimentos cromáticos intensos (Espectro Ocre) nos manipuladores biológicos distais."
  ],
  
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
  const [displayedName, setDisplayedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const initMission = async () => {
      setIsLoading(true);
      const content = await getMissionData(TARGET_PROFILE);
      setMissionContent(content);
      setIsLoading(false);
    };
    initMission();
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      soundService.initialize();
      if (step === AppStep.TITLE) {
        soundService.startAmbient();
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    return () => window.removeEventListener('click', unlockAudio);
  }, [step]);

  useEffect(() => {
    soundService.initialize();
    if (step === AppStep.TITLE) {
      soundService.stopCelebration();
      soundService.startAmbient();
    }
    if (step === AppStep.WARNING) {
      soundService.stopAmbient();
      soundService.stopCelebration();
      soundService.startAlarm();
    } else {
      soundService.stopAlarm();
      if (step === AppStep.REVEAL) {
        soundService.stopAmbient();
        soundService.playSuccess();
        soundService.startCelebration();
      } else if (step !== AppStep.TITLE) {
        soundService.stopCelebration();
        soundService.startAmbient();
      }
    }
    return () => { soundService.stopAlarm(); };
  }, [step]);

  useEffect(() => {
    if (step !== AppStep.REVEAL) setDisplayedName('');
  }, [step]);

  useEffect(() => {
    if (step === AppStep.REVEAL) {
      setDisplayedName('');
      const fullName = TARGET_PROFILE.name;
      let index = 0;
      const startTimeout = setTimeout(() => {
        const typingInterval = setInterval(() => {
          if (index < fullName.length) {
            index++;
            setDisplayedName(fullName.substring(0, index));
          } else {
            clearInterval(typingInterval);
          }
        }, 250);
        return () => clearInterval(typingInterval);
      }, 100);
      return () => clearTimeout(startTimeout);
    }
  }, [step]);

  useEffect(() => {
    const cursorInterval = setInterval(() => { setShowCursor(prev => !prev); }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const nextStep = () => {
    if (step === AppStep.TITLE) {
      soundService.playTransition();
      setTimeout(() => { setStep(prev => prev + 1); }, 800);
    } else if (step === AppStep.EASY_CLUES) {
      soundService.playClick();
      setStep(AppStep.REVEAL);
    } else {
      soundService.playClick();
      if (step < AppStep.REVEAL) setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    soundService.playCancel();
    if (step === AppStep.EASY_CLUES) {
      setStep(AppStep.ENIGMA);
      return;
    }
    if (step > AppStep.TITLE) setStep(prev => prev - 1);
  };

  const handleRevealClue = () => {
    soundService.playDataReveal();
    setRevealedClues(prev => prev + 1);
  };

  const handleGoToEasyClues = () => {
    soundService.playClick();
    setStep(AppStep.EASY_CLUES);
  };

  useEffect(() => {
    if (step === AppStep.CLUES) setRevealedClues(-1);
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
          </div>
        );

      case AppStep.WARNING:
        return (
          <div className="max-w-3xl text-center border-4 border-alert-red p-6 md:p-8 bg-alert-red bg-opacity-10 relative overflow-hidden my-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-alert-red animate-pulse-fast"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-alert-red animate-pulse-fast"></div>
            <ShieldAlert className="w-24 h-24 text-alert-red mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-alert-red mb-6 uppercase tracking-widest">ALERTA DE SEGURANÇA</h2>
            <p className="font-mono text-xl md:text-2xl text-white leading-relaxed mt-4">
              ATENÇÃO, AGENTES. SE VOCÊ IDENTIFICAR O ALVO ANTES DA DESCRIPTOGRAFIA FINAL... MANTENHA O SILÊNCIO OPERACIONAL.
            </p>
          </div>
        );

      case AppStep.CLUES:
        if (!missionContent && isLoading) {
          return (
             <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 text-terminal-green animate-spin" />
                <p className="font-mono text-xl text-terminal-green animate-pulse">ACESSANDO SERVIDOR DE INTELIGÊNCIA...</p>
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
                <div key={index} className={`border border-gray-700 bg-black p-4 transition-all duration-500 transform w-full ${index <= revealedClues ? 'opacity-100 translate-x-0 relative' : 'opacity-0 -translate-x-10 pointer-events-none absolute top-0'}`}>
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
                   {revealedClues === -1 ? "EXECUTAR DECODIFICAÇÃO" : "PRÓXIMO PACOTE DE DADOS"}
                 </Button>
               </div>
            )}
          </div>
        );

      case AppStep.ENIGMA:
        return (
          <div className="w-full max-w-3xl text-center my-8">
            <Lock className="w-16 h-16 text-cyber-cyan mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-display text-white mb-6 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">O PARADOXO FINAL</h2>
            <div className="bg-black/80 border-2 border-cyber-cyan p-6 md:p-10 relative shadow-[0_0_40px_rgba(0,243,255,0.2)] group transition-all duration-500 hover:shadow-[0_0_60px_rgba(0,243,255,0.4)]">
              <div className="absolute top-0 left-0 w-full h-full bg-cyber-cyan/5 pointer-events-none"></div>
              <p className="font-mono text-xl md:text-3xl text-cyber-cyan leading-relaxed animate-in fade-in duration-1000">"{missionContent?.enigma}"</p>
            </div>
            <div className="mt-12">
              <Button onClick={handleGoToEasyClues} variant="warning" className="text-sm">
                <UnlockKeyhole className="w-4 h-4 inline-block mr-2" /> REBAIXAR NÍVEL DE SEGURANÇA
              </Button>
            </div>
          </div>
        );

      case AppStep.EASY_CLUES:
        return (
          <div className="w-full max-w-7xl text-center p-2 h-full flex flex-col justify-center animate-in fade-in duration-700">
            <div className="shrink-0 mb-6 mt-4 md:mt-0">
              <UnlockKeyhole className="w-10 h-10 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              <h2 className="text-3xl md:text-5xl font-display text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">DICAS DE BAIXA SEGURANÇA</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0 max-w-6xl mx-auto w-full px-2">
              
              <div className="relative group overflow-hidden border border-yellow-400/50 p-4 bg-black/90 shadow-[inset_0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] transition-all duration-500">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-2 py-0.5 z-20">EVIDÊNCIA #891</div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                <div className="relative z-10 h-48 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 200 280" className="w-24 md:w-32 h-auto filter drop-shadow-[0_0_8px_rgba(153,27,27,0.5)]">
                    <defs>
                      <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#991b1b'}} />
                        <stop offset="100%" style={{stopColor:'#450a0a'}} />
                      </linearGradient>
                    </defs>
                    <path d="M10 20 C 60 5, 140 5, 190 20 L 180 260 C 140 275, 60 275, 20 260 Z" fill="url(#bagGrad)" stroke="#fca5a5" strokeWidth="2" />
                    <rect x="10" y="20" width="180" height="2" fill="#fff" opacity="0.3" />
                    <rect x="20" y="255" width="160" height="2" fill="#000" opacity="0.3" />
                    <path d="M50 90 L 150 90 L 100 180 Z" fill="#ef4444" stroke="#fecaca" strokeWidth="1" />
                    <text x="100" y="125" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" style={{fontFamily: 'sans-serif'}}>DORITOS</text>
                    <text x="100" y="145" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">NACHO CHEESE</text>
                    <path d="M130 200 L 170 200 L 150 240 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" transform="rotate(15 150 220)" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/5 to-transparent h-full w-full animate-scanline pointer-events-none"></div>
                </div>
                <div className="mt-4 border-t border-yellow-400/30 pt-2">
                   <p className="font-mono text-[10px] text-yellow-400 font-bold uppercase tracking-widest">ANÁLISE NUTRICIONAL</p>
                </div>
              </div>

              <div className="relative group overflow-hidden border border-yellow-400/50 p-4 bg-black/90 shadow-[inset_0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] transition-all duration-500">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-2 py-0.5 z-20">EVIDÊNCIA #892</div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.05)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                <div className="relative z-10 h-48 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-28 md:w-36 h-auto">
                    <path d="M 0 100 L 200 100 M 100 0 L 100 200" stroke="rgba(250,204,21,0.1)" strokeWidth="1" />
                    <path d="M 30 110 Q 100 -20 170 110" fill="none" stroke="#facc15" strokeWidth="8" strokeLinecap="round" className="animate-pulse" />
                    <path d="M 40 140 Q 100 100 160 140 Q 100 180 40 140 Z" fill="none" stroke="#facc15" strokeWidth="2" />
                    <circle cx="100" cy="140" r="15" fill="none" stroke="#facc15" strokeWidth="1" />
                    <circle cx="100" cy="140" r="6" fill="#facc15" />
                    <line x1="20" y1="140" x2="180" y2="140" stroke="rgba(250,204,21,0.3)" strokeDasharray="4 4" />
                    <line x1="100" y1="60" x2="100" y2="180" stroke="rgba(250,204,21,0.3)" strokeDasharray="4 4" />
                  </svg>
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
                </div>
                <div className="mt-4 border-t border-yellow-400/30 pt-2">
                   <p className="font-mono text-[10px] text-yellow-400 font-bold uppercase tracking-widest">ANÁLISE BIOMÉTRICA</p>
                </div>
              </div>

              <div className="relative group overflow-hidden border border-yellow-400/50 p-4 bg-black/90 shadow-[inset_0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] transition-all duration-500">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-2 py-0.5 z-20">EVIDÊNCIA #893</div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-10"></div>
                <div className="relative z-10 h-48 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-28 md:w-36 h-auto">
                    <path d="M 70 40 L 130 40 L 180 80 L 160 180 L 40 180 L 20 80 Z" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="2 2" />
                    <path d="M 85 45 Q 100 60 115 45 L 155 65 L 185 160 L 160 160 L 145 105 L 145 185 L 55 185 L 55 105 L 40 160 L 15 160 L 45 65 Z" fill="rgba(250,204,21,0.05)" stroke="#facc15" strokeWidth="2.5" />
                    <text x="160" y="90" fill="#facc15" fontSize="6" fontWeight="bold" className="uppercase">Manga</text>
                    <text x="40" y="180" fill="#facc15" fontSize="6" fontWeight="bold" className="uppercase">Bainha</text>
                  </svg>
                </div>
                <div className="mt-4 border-t border-yellow-400/30 pt-2">
                   <p className="font-mono text-[10px] text-yellow-400 font-bold uppercase tracking-widest">ANÁLISE VESTUÁRIO</p>
                </div>
              </div>

              <div className="relative group overflow-hidden border border-yellow-400/50 p-4 bg-black/90 shadow-[inset_0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] transition-all duration-500">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold font-mono text-[10px] px-2 py-0.5 z-20">EVIDÊNCIA #894</div>
                <div className="relative z-10 h-48 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-28 md:w-36 h-auto">
                    <line x1="0" y1="40" x2="200" y2="40" stroke="#facc15" strokeWidth="1" opacity="0.4" />
                    <line x1="140" y1="80" x2="160" y2="40" stroke="#facc15" strokeWidth="2" />
                    <line x1="60" y1="80" x2="40" y2="40" stroke="#facc15" strokeWidth="2" />
                    <rect x="40" y="80" width="120" height="70" rx="4" stroke="#facc15" strokeWidth="2.5" fill="rgba(250,204,21,0.1)" />
                    <rect x="50" y="90" width="30" height="25" stroke="#facc15" strokeWidth="1" fill="none" />
                    <rect x="85" y="90" width="30" height="25" stroke="#facc15" strokeWidth="1" fill="none" />
                    <rect x="120" y="90" width="30" height="25" stroke="#facc15" strokeWidth="1" fill="none" />
                    <circle cx="65" cy="150" r="12" stroke="#facc15" strokeWidth="2" fill="none" />
                    <circle cx="135" cy="150" r="12" stroke="#facc15" strokeWidth="2" fill="none" />
                    <text x="100" y="175" textAnchor="middle" fill="#facc15" fontSize="8" fontWeight="bold">VEÍCULO ELÉTRICO</text>
                  </svg>
                </div>
                <div className="mt-4 border-t border-yellow-400/30 pt-2">
                   <p className="font-mono text-[10px] text-yellow-400 font-bold uppercase tracking-widest">SONHO DE CONSUMO</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-4xl mx-auto shrink-0 pb-4 w-full px-4">
              {TARGET_PROFILE.easyClues?.map((clue, index) => (
                <div key={index} className="border border-yellow-400/20 bg-yellow-400/5 p-3 transform transition-all hover:translate-x-1 duration-300">
                  <p className="font-mono text-xs md:text-base lg:text-lg text-yellow-100 flex items-center">
                    <span className="text-yellow-400 font-black mr-4 text-xl">»</span>
                    {clue}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 shrink-0 flex flex-col items-center gap-2 pb-8">
                <Button onClick={() => { soundService.playClick(); setStep(AppStep.REVEAL); }} variant="warning" className="px-12 py-4 text-lg">
                    CONFIRMAR IDENTIDADE <ArrowRight className="w-5 h-5 ml-2 inline-block" />
                </Button>
            </div>
          </div>
        );

      case AppStep.REVEAL:
        return (
          <div className="text-center w-full max-w-5xl my-auto animate-in zoom-in duration-500">
            <div className="mb-8">
              <Unlock className="w-24 h-24 text-terminal-green mx-auto mb-4 animate-bounce" />
              <p className="font-mono text-gray-400 tracking-[0.5em] text-sm md:text-base">ACESSO CONCEDIDO // IDENTIDADE CONFIRMADA</p>
            </div>
            <div className="relative group min-h-[160px] md:min-h-[240px] flex items-center justify-center">
              <div className="absolute inset-0 bg-terminal-green blur-[100px] opacity-20 transition-opacity duration-1000 animate-pulse"></div>
              <div className="relative">
                <GlitchText 
                  text={displayedName} 
                  as="h1" 
                  className="relative text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-display font-black text-white uppercase drop-shadow-[0_0_20px_rgba(0,255,0,1)]" 
                />
                <span className={`text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-display font-black text-terminal-green inline-block ml-4 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
              </div>
            </div>
            <div className="mt-16 transition-opacity duration-1000">
               <Button onClick={() => setStep(AppStep.TITLE)} variant="secondary" className="hover:text-white border-white/20">REINICIAR PROTOCOLO</Button>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen md:h-screen w-screen bg-terminal-bg text-terminal-green font-mono flex flex-col relative selection:bg-terminal-green selection:text-black overflow-y-auto md:overflow-hidden" onClick={() => soundService.initialize()}>
      <header className="border-b border-gray-800 p-3 flex justify-between items-center bg-black/90 z-40 shrink-0 sticky top-0 md:static backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${step === AppStep.WARNING ? 'bg-alert-red animate-ping shadow-[0_0_8px_#f00]' : 'bg-terminal-green animate-pulse shadow-[0_0_8px_#0f0]'}`}></div>
          <span className="text-[10px] md:text-xs tracking-widest opacity-80 uppercase font-bold">Sombra-Net // Protocolo Ativo // v3.1.2</span>
        </div>
        <div className="flex items-center gap-6">
             <button onClick={(e) => { e.stopPropagation(); handleToggleMute(); }} className="hover:text-white transition-all transform hover:scale-110 active:scale-95 p-1">
                {isMuted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-terminal-green" />}
             </button>
            <div className="text-[10px] md:text-xs tracking-widest opacity-50 border-l border-gray-800 pl-6 uppercase">Passo: 0{step === AppStep.EASY_CLUES ? 'X' : step}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full overflow-hidden">
        {renderContent()}
      </main>

      {step < AppStep.REVEAL && (
        <footer className="p-4 border-t border-gray-800 bg-black/95 z-40 shrink-0 w-full backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
             <Button onClick={prevStep} disabled={step === AppStep.TITLE} variant="secondary" className={`flex items-center gap-2 py-2 px-6 text-xs md:text-sm ${step === AppStep.TITLE ? 'opacity-0 pointer-events-none' : ''}`}>
               <ArrowLeft className="w-4 h-4" /> VOLTAR
             </Button>
             <Button onClick={nextStep} disabled={step === AppStep.CLUES && (!missionContent || revealedClues < (missionContent.clues.length || 0) - 1)} variant={step === AppStep.WARNING ? 'danger' : 'primary'} className="flex items-center gap-2 py-2 px-8 text-xs md:text-sm shadow-lg">
               AVANÇAR <ArrowRight className="w-4 h-4" />
             </Button>
          </div>
        </footer>
      )}
      
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] md:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      <div className="fixed top-0 left-0 w-full h-[2px] bg-terminal-green/10 animate-scanline z-[60] pointer-events-none"></div>
    </div>
  );
};

export default App;
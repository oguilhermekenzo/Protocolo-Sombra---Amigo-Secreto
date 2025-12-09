
class SoundService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null; // Gain node específico para o alarme
  private alarmInterval: any = null;
  
  // Soundtrack nodes (Dark Ambient)
  private soundtrackOscillators: OscillatorNode[] = [];
  private soundtrackGain: GainNode | null = null;
  private isSoundtrackPlaying: boolean = false;

  // Celebration nodes (Sequencer)
  private celebrationInterval: any = null;
  private celebrationTimeout: any = null;
  private celebrationStep: number = 0;
  private isCelebrationPlaying: boolean = false;

  private isMuted: boolean = false;

  constructor() {
    try {
      // Defer initialization to user interaction
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.3; // Volume geral (30%)
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  // O navegador exige uma interação do usuário para iniciar o áudio
  public async initialize() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
    }
    return this.isMuted;
  }

  // --- TRILHA SONORA (AMBIENT DRONE) ---
  public startAmbient() {
    if (!this.context || !this.masterGain || this.isSoundtrackPlaying) return;

    // Garante que a celebração parou
    this.stopCelebration();

    this.isSoundtrackPlaying = true;
    this.soundtrackGain = this.context.createGain();
    this.soundtrackGain.connect(this.masterGain);
    this.soundtrackGain.gain.value = 0.4; // Volume da trilha

    // Filtro para deixar o som abafado/sombrio
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.connect(this.soundtrackGain);

    // Oscilador 1: Grave profundo
    const osc1 = this.context.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 50; // Baixa frequência
    osc1.connect(filter);
    osc1.start();
    this.soundtrackOscillators.push(osc1);

    // Oscilador 2: Levemente desafinado para criar "batimento" e textura
    const osc2 = this.context.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 51; // Desafinado
    osc2.connect(filter);
    osc2.start();
    this.soundtrackOscillators.push(osc2);

    // Oscilador 3: Sub-grave (Sine)
    const osc3 = this.context.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 30;
    osc3.connect(this.soundtrackGain); // Conecta direto no gain (sem filtro agressivo)
    osc3.start();
    this.soundtrackOscillators.push(osc3);
  }

  public stopAmbient() {
    if (!this.isSoundtrackPlaying) return;

    this.soundtrackOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.soundtrackOscillators = [];
    
    if (this.soundtrackGain) {
      this.soundtrackGain.disconnect();
      this.soundtrackGain = null;
    }

    this.isSoundtrackPlaying = false;
  }

  // --- TRILHA DE CELEBRAÇÃO (8-bit Sequencer) ---
  public startCelebration() {
    if (!this.context || !this.masterGain || this.isCelebrationPlaying) return;

    this.stopAmbient();
    this.isCelebrationPlaying = true;
    this.celebrationStep = 0;

    // Configura parada automática após 15 segundos
    if (this.celebrationTimeout) clearTimeout(this.celebrationTimeout);
    this.celebrationTimeout = setTimeout(() => {
      this.stopCelebration();
    }, 15000);

    // BPM aproximado = 150 (400ms por 4 notas = 100ms por nota 16th)
    const noteDuration = 0.13; // segundos
    const intervalTime = 130; // ms

    // Melodia (C Major Arpeggio Pattern)
    // C5, E5, G5, C6, G5, E5
    const melody = [
      523.25, 659.25, 783.99, 1046.50, 783.99, 659.25,
      523.25, 659.25, 783.99, 1046.50, 783.99, 659.25,
      587.33, 739.99, 880.00, 1174.66, 880.00, 739.99, // D Majorish variation
      523.25, 659.25, 783.99, 1046.50, 783.99, 659.25,
    ];

    // Baixo (Fundamental Notes)
    const bassLine = [
      130.81, 130.81, 130.81, 130.81, 130.81, 130.81, // C3
      130.81, 130.81, 130.81, 130.81, 130.81, 130.81,
      146.83, 146.83, 146.83, 146.83, 146.83, 146.83, // D3
      130.81, 130.81, 130.81, 130.81, 130.81, 130.81,
    ];

    this.celebrationInterval = setInterval(() => {
      if(!this.context || !this.masterGain || this.isMuted) return;
      const now = this.context.currentTime;
      const idx = this.celebrationStep % melody.length;

      // 1. Melody Synth (Square wave - Retro)
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'square';
      osc.frequency.value = melody[idx];
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      // Envelope curto (staccato)
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + noteDuration);
      
      osc.start(now);
      osc.stop(now + noteDuration);

      // 2. Bass Synth (Sawtooth - Power) - Toca a cada 3 passos (meio tempo) ou 6
      if (this.celebrationStep % 6 === 0 || this.celebrationStep % 6 === 3) {
        const bassOsc = this.context.createOscillator();
        const bassGain = this.context.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = bassLine[idx];
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);

        bassGain.gain.setValueAtTime(0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        bassOsc.start(now);
        bassOsc.stop(now + 0.3);
      }

      this.celebrationStep++;
    }, intervalTime);
  }

  public stopCelebration() {
    if (this.celebrationInterval) {
      clearInterval(this.celebrationInterval);
      this.celebrationInterval = null;
    }
    if (this.celebrationTimeout) {
      clearTimeout(this.celebrationTimeout);
      this.celebrationTimeout = null;
    }
    this.isCelebrationPlaying = false;
  }

  // --- SONS EFEITOS (SFX) ---

  // Som de clique interface (Curto e agudo)
  public playClick() {
    if (!this.context || !this.masterGain || this.isMuted) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  // Som de Transição Especial (Título -> Alerta)
  public playTransition() {
    if (!this.context || !this.masterGain || this.isMuted) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    // Roteamento: Osc -> Filter -> Gain -> Master
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Efeito "Swoosh" Cyberpunk
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.6); // Sobe o tom

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(5000, t + 0.5); // Abre o filtro

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.2); // Fade in
    gain.gain.linearRampToValueAtTime(0, t + 0.7); // Fade out

    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Som de "Negado" ou "Voltar" (Grave)
  public playCancel() {
    if (!this.context || !this.masterGain || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  // Som de dados sendo processados (Dicas)
  public playDataReveal() {
    if (!this.context || !this.masterGain || this.isMuted) return;

    const count = 5;
    for (let i = 0; i < count; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.type = 'sine';
      // Frequências aleatórias para parecer "dados"
      osc.frequency.setValueAtTime(1000 + Math.random() * 2000, this.context.currentTime + (i * 0.05));
      
      gain.gain.setValueAtTime(0.05, this.context.currentTime + (i * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + (i * 0.05) + 0.03);

      osc.start(this.context.currentTime + (i * 0.05));
      osc.stop(this.context.currentTime + (i * 0.05) + 0.03);
    }
  }

  // Som de Alerta (Sirene Pulsante Estilo Radar/Sonar) - Menos irritante
  public startAlarm() {
    if (!this.context || !this.masterGain || this.isMuted) return;
    if (this.alarmOscillator) return; // Já está tocando

    // Garante que outros sons de fundo parem
    this.stopAmbient();
    this.stopCelebration();

    this.alarmOscillator = this.context.createOscillator();
    this.alarmGain = this.context.createGain();
    
    this.alarmOscillator.connect(this.alarmGain);
    this.alarmGain.connect(this.masterGain);
    
    // Configuração para ser menos chato: Onda Senoidal (Sine) e grave
    this.alarmOscillator.type = 'sine'; 
    this.alarmOscillator.frequency.value = 250; // Grave (Low-Mid)
    
    // Começa silenciado e pulsa
    this.alarmGain.gain.setValueAtTime(0, this.context.currentTime);

    this.alarmOscillator.start();

    // Cria um pulso rítmico (estilo respiração ou radar) em vez de sirene contínua
    const pulseSpeed = 1000; // 1 segundo por ciclo

    const pulseLoop = () => {
      if (!this.context || !this.alarmGain) return;
      const now = this.context.currentTime;
      
      // Pulso de volume: Sobe rápido, desce devagar
      this.alarmGain.gain.cancelScheduledValues(now);
      this.alarmGain.gain.setValueAtTime(0, now);
      this.alarmGain.gain.linearRampToValueAtTime(0.3, now + 0.2); // Attack
      this.alarmGain.gain.linearRampToValueAtTime(0, now + 0.8); // Decay
    };

    // Executa o primeiro imediatamente
    pulseLoop();
    
    // Repete
    this.alarmInterval = setInterval(pulseLoop, pulseSpeed);
  }

  public stopAlarm() {
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch (e) {}
      this.alarmOscillator = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch(e) {}
      this.alarmGain = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  // Som de Sucesso (Impacto Único) - Toca junto com o inicio da celebração
  public playSuccess() {
    if (!this.context || !this.masterGain || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    // Sweep de baixo para cima (Bass drop reverso)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(50, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 2);
    
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.context.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 3);
    
    osc.start();
    osc.stop(this.context.currentTime + 3);

    // Adiciona um ruído agudo (pratos digitais)
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2000, this.context.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 1);
    gain2.gain.setValueAtTime(0.1, this.context.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);
    osc2.start();
    osc2.stop(this.context.currentTime + 1);
  }
}

export const soundService = new SoundService();

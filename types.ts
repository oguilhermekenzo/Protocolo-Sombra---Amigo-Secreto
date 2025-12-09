export interface TargetData {
  name: string;
  description: string;
  easyClues?: string[];
  fixedEnigma?: string;
}

export interface GeneratedContent {
  clues: string[];
  enigma: string;
}

export enum AppStep {
  TITLE = 0,
  WARNING = 1,
  CLUES = 2,
  ENIGMA = 3,
  REVEAL = 4,
  EASY_CLUES = 5, // Passo alternativo
}
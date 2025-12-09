import { GeneratedContent, TargetData } from "../types";

// Este serviço agora apenas processa os dados estáticos, sem IA.
export const getMissionData = async (target: TargetData): Promise<GeneratedContent> => {
  // Simula apenas o tempo de "descriptografia" da interface (efeito visual)
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    // Garante que usa as dicas manuais definidas no App.tsx
    clues: target.hardClues || [
      "DADOS CORROMPIDOS: Nenhuma dica manual definida.",
      "ERRO DE LEITURA: Verifique o perfil do alvo.",
      "SISTEMA OFF: Modo manual ativo."
    ],
    enigma: target.fixedEnigma || "O alvo não foi configurado corretamente."
  };
};
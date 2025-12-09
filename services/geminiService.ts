import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, TargetData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMissionData = async (target: TargetData): Promise<GeneratedContent> => {
  if (!apiKey) {
    // Fallback for demo/no-key environments
    return {
      clues: [
        "ARQUIVO CRIPTOGRAFADO: O alvo opera nas sombras do setor administrativo.",
        "INTERCEPTAÇÃO: Detectados altos níveis de consumo de cafeína.",
        "ASSINATURA SÔNICA: Sua risada foi registrada em múltiplos canais de frequência."
      ],
      enigma: target.fixedEnigma || "Eu tenho chaves, mas não abro portas. Tenho espaço, mas não tenho quartos. Eu permito que você entre, mas nunca saia. O que sou eu? (Relacionado ao alvo)"
    };
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Você é um oficial de inteligência criando um dossiê para uma missão de "Amigo Secreto" (Secret Santa) com o tema "Protocolo Sombra" (Espionagem/Cyberpunk).
      
      O alvo é: ${target.name}.
      Descrição/Características do alvo: ${target.description}.

      Gere 3 dicas CRIPTOGRAFADAS e DIFÍCEIS. Use metáforas, jargão de espião, códigos e linguagem técnica para obscurecer a verdade. As dicas NÃO devem ser óbvias.
      
      DICA 1: Nível Difícil. Muito vaga. Metáfora abstrata sobre a personalidade ou aura da pessoa.
      DICA 2: Nível Médio. Fale sobre hábitos ou ferramentas de trabalho, mas como se fosse um relatório de vigilância alienígena ou cyberpunk.
      DICA 3: Nível Revelador (mas ainda em código). Uma característica física ou mania específica, descrita como uma "falha na matrix" ou "assinatura biométrica única".
      
      ENIGMA FINAL: Uma charada curta e inteligente ("Quem sou eu?") que resume o alvo.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Três dicas criptografadas e difíceis sobre o alvo."
            },
            enigma: {
              type: Type.STRING,
              description: "Um enigma final ou pergunta 'Quem sou eu?'."
            }
          },
          required: ["clues", "enigma"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const content = JSON.parse(text) as GeneratedContent;
    
    // Override enigma if a fixed one is provided in the target profile
    if (target.fixedEnigma) {
      content.enigma = target.fixedEnigma;
    }

    return content;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
       clues: [
        "DADOS CORROMPIDOS: O alvo possui traços humanos não identificados.",
        "ANÁLISE INCOMPLETA: O alvo foi visto recentemente em operações locais.",
        "FALHA NA MATRIX: Identificação visual comprometida por camuflagem social."
      ],
      enigma: target.fixedEnigma || "Erro 404: Identidade oculta nos dados. Quem é o alvo?"
    };
  }
};
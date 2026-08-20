export const MODEL_DEFAULTS = Object.freeze({
  geminiEdital: "gemini-3.6-flash",
  groqEdital: "llama-3.3-70b-versatile",
  groqExplanation: "llama-3.3-70b-versatile",
  groqWhisper: "whisper-large-v3-turbo",
  workersAi: "@cf/meta/llama-3.1-8b-instruct-fast"
});

export function modelConfig(env = {}) {
  return {
    geminiEdital: env.GEMINI_EDITAL_MODEL || MODEL_DEFAULTS.geminiEdital,
    groqEdital: env.GROQ_EDITAL_MODEL || MODEL_DEFAULTS.groqEdital,
    groqExplanation: env.GROQ_EXPLANATION_MODEL || MODEL_DEFAULTS.groqExplanation,
    groqWhisper: env.GROQ_WHISPER_MODEL || MODEL_DEFAULTS.groqWhisper,
    workersAi: env.WORKERS_AI_MODEL || MODEL_DEFAULTS.workersAi
  };
}

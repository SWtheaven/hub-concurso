(function () {
  const localWorker = "http://127.0.0.1:8787";
  const deployedWorker = "https://concurso-hub-api.gspereira-dev.workers.dev";
  const useLocalWorker = new URLSearchParams(window.location.search).get("api") === "local";
  window.CONCURSO_HUB_CONFIG = {
    apiBase: useLocalWorker ? localWorker : deployedWorker,
    models: {
      geminiEdital: "gemini-3.6-flash"
    }
  };
})();

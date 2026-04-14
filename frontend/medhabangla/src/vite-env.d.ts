/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_JAAS_APP_ID: string;
  readonly VITE_WORKOS_CLIENT_ID: string;
  readonly VITE_WORKOS_REDIRECT_URI: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_OLLAMA_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

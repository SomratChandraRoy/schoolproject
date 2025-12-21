/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WORKOS_API_KEY: string
    readonly VITE_WORKOS_CLIENT_ID: string
    readonly VITE_WORKOS_REDIRECT_URI: string
    readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

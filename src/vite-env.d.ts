/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the FurMeets API (REST and socket.io). */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

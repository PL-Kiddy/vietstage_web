/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PROXY_TARGET?: string;
  readonly VITE_ADMIN_DEFAULT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PRIVY_APP_ID: string;
    readonly VITE_API_URL: string;
    readonly VITE_CONTRACT_ADDRESS: string;
    readonly VITE_NETWORK: string;
    readonly VITE_APTOS_NODE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

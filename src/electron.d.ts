export { };

declare global {
    interface Window {
        electronAPI: {
            printPreview: () => Promise<{ success: boolean; path?: string; error?: string }>;
        };
    }
}

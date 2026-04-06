const isDev = import.meta.env.DEV;

export const logger = {
    debug: (...args: unknown[]) => { if (isDev) console.debug("[app]", ...args); },
    info: (...args: unknown[]) => { if (isDev) console.info("[app]", ...args); },
    warn: (...args: unknown[]) => console.warn("[app]", ...args),
    error: (...args: unknown[]) => console.error("[app]", ...args),
};

type ParseLogger = {
    info: (message: string) => void;
    error: (message: string) => void;
};
export type ParseHookRequest<T> = {
    object: T;
    log: ParseLogger;
};

export interface HTTPRequest<T> {
    headers: Record<string, string>;
    log: ParseLogger;
    params: T;
}

type ParseLogger = {
    info: (message: string) => void;
    error: (message: string) => void;
};
export type ParseHookRequest<T> = {
    object: T;
    log: ParseLogger;
};

export class MalformedRequestError extends Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);

        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }
}

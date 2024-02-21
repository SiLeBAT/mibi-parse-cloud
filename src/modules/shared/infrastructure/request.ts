import { ParseLogger } from '../core/logging-context';

export interface HTTPRequest<T> {
    headers: Record<string, string>;
    log: ParseLogger;
    params: T;
}

export type ParseHookRequest<T, V> = {
    object: T;
    log: ParseLogger;
    context?: V;
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

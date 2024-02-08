export abstract class UseCaseError extends Error {
    protected _message: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected _error: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(message: string, error: any) {
        super(message);
        // restore prototype chain
        const actualProto = new.target.prototype;
        Object.setPrototypeOf(this, actualProto);

        this._message = message;
        this._error = error;
        this.name = this.constructor.name;
        this.stack = new Error().stack;
    }

    get message() {
        return this._message;
    }

    get error() {
        return this._error;
    }
}

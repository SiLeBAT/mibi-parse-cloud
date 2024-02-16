declare module 'xlsx-populate' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromDataAsync: (buffer: Buffer) => Promise<any>;
    const MIME_TYPE: string;
    export { MIME_TYPE, fromDataAsync };
}

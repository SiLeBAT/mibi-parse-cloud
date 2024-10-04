import { setNRLCache } from './set-nrl-cache.use-case';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterSaveNRLHook = (request: any) => {
    request.log.info('Changes made to NRL Collection. Updating cache.');
    setNRLCache.execute();
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeleteNRLHook = (request: any) => {
    request.log.info('Entry deleted from NRL Collection. Updating cache.');
    setNRLCache.execute();
};

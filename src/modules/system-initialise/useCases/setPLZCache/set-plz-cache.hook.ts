import { setPLZCache } from './set-plz-cache.use-case';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterSavePLZHook = (request: any) => {
    request.log.info('Changes made to PLZ Collection. Updating cache.');
    setPLZCache.execute();
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeletePLZHook = (request: any) => {
    request.log.info('Entry deleted from PLZ Collection. Updating cache.');
    setPLZCache.execute();
};

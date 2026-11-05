import { ZomoPlan } from '../../../../shared/domain/valueObjects';
import { ZomoPlanCache } from '../../../../shared/infrastructure/cache/zomo-plan.cache';
import { ZomoPlanRepository } from '../../../infrastructure/repository';
import {
    afterDeleteZomoPlanHook,
    afterSaveZomoPlanHook
} from '../set-zomo-plan-cache.hook';
import {
    setZomoPlanCache,
    SetZomoPlanCacheUseCase
} from '../set-zomo-plan-cache.use-case';

const zomoPlan = (year: string) =>
    ZomoPlan.create({
        year,
        data: JSON.stringify({ data: { year, zomoData: [] } })
    });

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('SetZomoPlanCacheUseCase', () => {
    const repositoryReturning = (retrieve: jest.Mock) =>
        ({ retrieve } as unknown as ZomoPlanRepository);

    it('replaces the cached plans with the stored ones', async () => {
        const stored = [await zomoPlan('2025'), await zomoPlan('2026')];
        const cache = new ZomoPlanCache();
        cache.setZomoPlans([await zomoPlan('2024')]);
        const setZomoPlans = jest.spyOn(cache, 'setZomoPlans');
        const removeAllData = jest.spyOn(cache, 'removeAllData');

        await new SetZomoPlanCacheUseCase(
            cache,
            repositoryReturning(jest.fn().mockResolvedValue(stored))
        ).execute();

        expect(removeAllData).toHaveBeenCalled();
        expect(setZomoPlans).toHaveBeenCalledWith(stored);
        expect(removeAllData.mock.invocationCallOrder[0]).toBeLessThan(
            setZomoPlans.mock.invocationCallOrder[0]
        );
    });

    it('keeps the cached plans if the stored ones cannot be loaded', async () => {
        const cache = new ZomoPlanCache();
        const removeAllData = jest.spyOn(cache, 'removeAllData');

        await expect(
            new SetZomoPlanCacheUseCase(
                cache,
                repositoryReturning(
                    jest.fn().mockRejectedValue(new Error('db down'))
                )
            ).execute()
        ).rejects.toThrow('db down');

        expect(removeAllData).not.toHaveBeenCalled();
    });
});

describe('Zomo plan cache hooks', () => {
    let updateCache: jest.SpyInstance;

    beforeEach(() => {
        updateCache = jest
            .spyOn(setZomoPlanCache, 'execute')
            .mockResolvedValue();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('removes the JSON file and updates the cache after a plan is saved', async () => {
        const jsonFile = { destroy: jest.fn() };

        await afterSaveZomoPlanHook({
            object: { get: () => jsonFile },
            log: noopLog
        } as never);

        expect(jsonFile.destroy).toHaveBeenCalledWith({ useMasterKey: true });
        expect(updateCache).toHaveBeenCalled();
    });

    it('still updates the cache if the JSON file cannot be removed', async () => {
        const jsonFile = {
            destroy: jest.fn(() => {
                throw new Error('file gone');
            })
        };

        await afterSaveZomoPlanHook({
            object: { get: () => jsonFile },
            log: noopLog
        } as never);

        expect(noopLog.error).toHaveBeenCalledWith('file gone');
        expect(updateCache).toHaveBeenCalled();
    });

    it('updates the cache after a plan is deleted', () => {
        afterDeleteZomoPlanHook({ log: noopLog });

        expect(updateCache).toHaveBeenCalled();
    });
});

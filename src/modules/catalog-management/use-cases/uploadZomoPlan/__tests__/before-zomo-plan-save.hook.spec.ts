import {
    FileContent,
    FileContentType,
    ZomoPlan,
    ZomoPlanInformation
} from '../../../domain';
import { ZomoPlanMapper } from '../../../mappers';
import {
    checkForTwoZomoPlans,
    checkForZomoPlanAllowed,
    checkForZomoPlanDuplication
} from '../../checkForZomoPlanIntegrity';
import { readFileContent } from '../../readFileContent';
import { beforeZomoPlanSaveHook } from '../before-zomo-plan-save.hook';
import {
    ZomoPlanAllowedError,
    ZomoPlanAmountError,
    ZomoPlanDuplicationError
} from '../create-zomo-plan.error';
import { createZomoPlan } from '../create-zomo-plan.use-case';

type HookRequest = Parameters<typeof beforeZomoPlanSaveHook>[0];

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('beforeZomoPlanSaveHook', () => {
    let uploadedFile: { destroy: jest.Mock };
    let zomoPlan: ZomoPlan<unknown>;
    let isDuplicate: jest.SpyInstance;
    let twoExist: jest.SpyInstance;
    let yearAllowed: jest.SpyInstance;
    let toPersistence: jest.SpyInstance;

    const request = (id?: string) => {
        const zomoPlanObject = {
            id,
            get: (key: string) =>
                key === 'zomoFile' ? uploadedFile : undefined
        };
        return {
            object: zomoPlanObject,
            log: noopLog
        } as unknown as HookRequest;
    };

    beforeEach(async () => {
        uploadedFile = { destroy: jest.fn() };
        zomoPlan = ZomoPlan.create({
            zomoPlanInformation: await ZomoPlanInformation.create({
                year: '2026'
            }),
            data: []
        });

        jest.spyOn(readFileContent, 'execute').mockResolvedValue(
            await FileContent.create({
                content: 'csv',
                type: FileContentType.CSV
            })
        );
        jest.spyOn(createZomoPlan, 'execute').mockResolvedValue(zomoPlan);
        isDuplicate = jest
            .spyOn(checkForZomoPlanDuplication, 'execute')
            .mockResolvedValue(false);
        twoExist = jest
            .spyOn(checkForTwoZomoPlans, 'execute')
            .mockResolvedValue(false);
        yearAllowed = jest
            .spyOn(checkForZomoPlanAllowed, 'execute')
            .mockResolvedValue({
                yearAllowed: true,
                allowedYears: [2026, 2027, 2028]
            });
        toPersistence = jest
            .spyOn(ZomoPlanMapper, 'toPersistence')
            .mockImplementation(async (_, zomoPlanObject) => zomoPlanObject!);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stores a new plan and removes the uploaded file', async () => {
        const hookRequest = request();

        await beforeZomoPlanSaveHook(hookRequest);

        expect(isDuplicate).toHaveBeenCalledWith(zomoPlan.zomoPlanInformation);
        expect(toPersistence).toHaveBeenCalledWith(
            zomoPlan,
            hookRequest.object
        );
        expect(uploadedFile.destroy).toHaveBeenCalledWith({
            useMasterKey: true
        });
    });

    it('rejects a plan for a year that already has one and removes the uploaded file', async () => {
        isDuplicate.mockResolvedValue(true);

        await expect(beforeZomoPlanSaveHook(request())).rejects.toThrow(
            ZomoPlanDuplicationError
        );

        expect(uploadedFile.destroy).toHaveBeenCalled();
        expect(twoExist).not.toHaveBeenCalled();
        expect(toPersistence).not.toHaveBeenCalled();
    });

    it('rejects a third plan', async () => {
        twoExist.mockResolvedValue(true);

        await expect(beforeZomoPlanSaveHook(request())).rejects.toThrow(
            ZomoPlanAmountError
        );

        expect(yearAllowed).not.toHaveBeenCalled();
        expect(toPersistence).not.toHaveBeenCalled();
    });

    it('rejects a plan for a year that is not allowed', async () => {
        yearAllowed.mockResolvedValue({
            yearAllowed: false,
            allowedYears: [2026, 2027, 2028]
        });

        await expect(beforeZomoPlanSaveHook(request())).rejects.toThrow(
            new ZomoPlanAllowedError(
                'The zomo plan year must be one of 2026,2027,2028',
                new Error()
            )
        );

        expect(toPersistence).not.toHaveBeenCalled();
    });

    it('skips the integrity checks when an existing plan is updated', async () => {
        isDuplicate.mockResolvedValue(true);
        twoExist.mockResolvedValue(true);

        await beforeZomoPlanSaveHook(request('existing-id'));

        expect(isDuplicate).not.toHaveBeenCalled();
        expect(twoExist).not.toHaveBeenCalled();
        expect(yearAllowed).not.toHaveBeenCalled();
        expect(uploadedFile.destroy).not.toHaveBeenCalled();
        expect(toPersistence).toHaveBeenCalled();
    });

    it('still stores the plan if removing the uploaded file fails', async () => {
        uploadedFile.destroy.mockImplementation(() => {
            throw new Error('file gone');
        });

        await beforeZomoPlanSaveHook(request());

        expect(noopLog.error).toHaveBeenCalledWith('file gone');
        expect(toPersistence).toHaveBeenCalled();
    });
});

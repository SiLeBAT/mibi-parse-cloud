import { ZomoPlanFileInformation } from '../../../domain';
import {
    checkForTwoZomoPlanFiles,
    checkForZomoPlanFileAllowed,
    checkForZomoPlanFileDuplication
} from '../../checkForZomoPlanFileIntegrity';
import { beforeZomoPlanFileSaveHook } from '../before-zomo-plan-file-save.hook';
import {
    ZomoPlanFileAllowedError,
    ZomoPlanFileAmountError,
    ZomoPlanFileDuplicationError
} from '../create-zomo-plan-file.error';

type HookRequest = Parameters<typeof beforeZomoPlanFileSaveHook>[0];

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const request = (year: string | undefined, id?: string) =>
    ({
        object: {
            id,
            get: (key: string) => (key === 'year' ? year : undefined)
        },
        log: noopLog
    } as unknown as HookRequest);

describe('beforeZomoPlanFileSaveHook', () => {
    let isDuplicate: jest.SpyInstance;
    let twoExist: jest.SpyInstance;
    let yearAllowed: jest.SpyInstance;

    beforeEach(() => {
        noopLog.error.mockClear();
        isDuplicate = jest
            .spyOn(checkForZomoPlanFileDuplication, 'execute')
            .mockResolvedValue(false);
        twoExist = jest
            .spyOn(checkForTwoZomoPlanFiles, 'execute')
            .mockResolvedValue(false);
        yearAllowed = jest
            .spyOn(checkForZomoPlanFileAllowed, 'execute')
            .mockResolvedValue({
                yearAllowed: true,
                allowedYears: [2026, 2027, 2028]
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('accepts a new plan file that passes all checks', async () => {
        await expect(
            beforeZomoPlanFileSaveHook(request('2026'))
        ).resolves.toBeUndefined();

        const checkedInformation: ZomoPlanFileInformation =
            isDuplicate.mock.calls[0][0];
        expect(checkedInformation.year).toBe('2026');
        expect(yearAllowed).toHaveBeenCalledWith(checkedInformation);
    });

    it('rejects a plan file without a year', async () => {
        await expect(
            beforeZomoPlanFileSaveHook(request(undefined))
        ).rejects.toThrow('Zomo Plan File year is required');

        expect(noopLog.error).toHaveBeenCalledWith(
            'Zomo Plan File year is required'
        );
        expect(isDuplicate).not.toHaveBeenCalled();
    });

    it('rejects a plan file for a year that already has one', async () => {
        isDuplicate.mockResolvedValue(true);

        await expect(
            beforeZomoPlanFileSaveHook(request('2026'))
        ).rejects.toThrow(
            new ZomoPlanFileDuplicationError(
                'A Zomo Plan file already appears to exist for the year 2026',
                new Error()
            )
        );

        expect(twoExist).not.toHaveBeenCalled();
    });

    it('rejects a third plan file', async () => {
        twoExist.mockResolvedValue(true);

        await expect(
            beforeZomoPlanFileSaveHook(request('2026'))
        ).rejects.toThrow(ZomoPlanFileAmountError);

        expect(yearAllowed).not.toHaveBeenCalled();
    });

    it('rejects a plan file for a year that is not allowed', async () => {
        yearAllowed.mockResolvedValue({
            yearAllowed: false,
            allowedYears: [2026, 2027, 2028]
        });

        await expect(
            beforeZomoPlanFileSaveHook(request('2025'))
        ).rejects.toThrow(
            new ZomoPlanFileAllowedError(
                'The zomo plan year must be one of 2026,2027,2028',
                new Error()
            )
        );
    });

    it('skips the integrity checks when an existing plan file is updated', async () => {
        isDuplicate.mockResolvedValue(true);
        twoExist.mockResolvedValue(true);

        await beforeZomoPlanFileSaveHook(request('2026', 'existing-id'));

        expect(isDuplicate).not.toHaveBeenCalled();
        expect(twoExist).not.toHaveBeenCalled();
        expect(yearAllowed).not.toHaveBeenCalled();
    });
});

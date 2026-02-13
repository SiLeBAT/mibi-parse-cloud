import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { ZomoPlanFileObject } from '../../../shared/infrastructure/parse-types';
import {
    ZomoPlanFileDuplicationError,
    ZomoPlanFileAmountError,
    ZomoPlanFileAllowedError
} from './create-zomo-plan-file.error';
import {
    checkForZomoPlanFileDuplication,
    checkForTwoZomoPlanFiles,
    checkForZomoPlanFileAllowed,
    ZomoPlanFilesAllowed
} from '../checkForZomoPlanFileIntegrity';
import { ZomoPlanFileInformation } from '../../domain/zomo-plan-file-information.vo';

type ZomoPlanFileSaveContext = Record<string, unknown>;

type BeforeZomoPlanFileSaveHookRequest = ParseHookRequest<
    ZomoPlanFileObject,
    ZomoPlanFileSaveContext
>;

export const beforeZomoPlanFileSaveHook = async (
    request: BeforeZomoPlanFileSaveHookRequest
) => {
    const zomoPlanFileObject: ZomoPlanFileObject = request.object;
    const isUpdate = Boolean(zomoPlanFileObject.id);

    try {
        setLoggingContext(request.log);

        const year = zomoPlanFileObject.get('year');
        const zomoPlanFileInformation = await ZomoPlanFileInformation.create({
            year: year
        });

        if (!isUpdate) {
            const isDuplicate: boolean =
                await checkForZomoPlanFileDuplication.execute(
                    zomoPlanFileInformation
                );
            if (isDuplicate) {
                throw new ZomoPlanFileDuplicationError(
                    `A Zomo Plan file already appears to exist for the year ${year}`,
                    new Error()
                );
            }

            const twoExist: boolean = await checkForTwoZomoPlanFiles.execute();
            if (twoExist) {
                throw new ZomoPlanFileAmountError(
                    'There exist already two zomo plan files',
                    new Error()
                );
            }

            const zomoPlanFilesAllowed: ZomoPlanFilesAllowed =
                await checkForZomoPlanFileAllowed.execute(
                    zomoPlanFileInformation
                );
            if (!zomoPlanFilesAllowed.yearAllowed) {
                throw new ZomoPlanFileAllowedError(
                    `The zomo plan year must be one of ${zomoPlanFilesAllowed.allowedYears}`,
                    new Error()
                );
            }
        }
    } catch (error) {
        getLogger().error(error.message);
        throw error;
    } finally {
        setLoggingContext(null);
    }
};

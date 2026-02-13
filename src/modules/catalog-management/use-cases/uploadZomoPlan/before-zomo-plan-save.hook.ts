import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { ZomoPlanObject } from '../../../shared/infrastructure/parse-types';
import {
    ZomoPlanDuplicationError,
    ZomoPlanAmountError,
    ZomoPlanAllowedError
} from './create-zomo-plan.error';
import { readFileContent } from '../readFileContent';
import { createZomoPlan } from '../uploadZomoPlan/create-zomo-plan.use-case';
import {
    checkForZomoPlanDuplication,
    checkForTwoZomoPlans,
    checkForZomoPlanAllowed,
    ZomoPlanAllowed
} from '../checkForZomoPlanIntegrity';
import { ZomoPlanMapper } from '../../mappers';

type ZomoPlanSaveContext = Record<string, unknown>;

type BeforeZomoPlanSaveHookRequest = ParseHookRequest<
    ZomoPlanObject,
    ZomoPlanSaveContext
>;

export const beforeZomoPlanSaveHook = async (
    request: BeforeZomoPlanSaveHookRequest
) => {
    const zomoPlanObject: ZomoPlanObject = request.object;
    const originalFile = zomoPlanObject.get('zomoFile');
    const isUpdate = Boolean(zomoPlanObject.id);
    try {
        setLoggingContext(request.log);

        const fileContent = await readFileContent.execute(originalFile);
        const zomoPlan = await createZomoPlan.execute({
            fileContent
        });

        if (!isUpdate) {
            const isDuplicate: boolean =
                await checkForZomoPlanDuplication.execute(
                    zomoPlan.zomoPlanInformation
                );
            if (isDuplicate) {
                throw new ZomoPlanDuplicationError(
                    'The uploaded zomo plan already appears to exist',
                    new Error()
                );
            }

            const twoExist: boolean = await checkForTwoZomoPlans.execute();
            if (twoExist) {
                throw new ZomoPlanAmountError(
                    'There exist already two zomo plans',
                    new Error()
                );
            }

            const zomoPlanAllowed: ZomoPlanAllowed =
                await checkForZomoPlanAllowed.execute(
                    zomoPlan.zomoPlanInformation
                );
            if (!zomoPlanAllowed.yearAllowed) {
                throw new ZomoPlanAllowedError(
                    `The zomo plan year must be one of ${zomoPlanAllowed.allowedYears}`,
                    new Error()
                );
            }

            destroyFile(originalFile);
        }

        await ZomoPlanMapper.toPersistence(zomoPlan, zomoPlanObject);
    } catch (error) {
        if (error instanceof ZomoPlanDuplicationError) {
            destroyFile(originalFile);
        }
        throw error;
    } finally {
        setLoggingContext(null);
    }
};

function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}

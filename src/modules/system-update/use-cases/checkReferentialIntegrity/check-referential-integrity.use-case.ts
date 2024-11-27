import { UseCase } from '../../../shared/use-cases';
import { CHECK_FUNCTION_ARRAY } from '../../integrity-functions';

class CheckReferentialIntegrityUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        CHECK_FUNCTION_ARRAY.forEach(async checkFunction => {
            const success = await checkFunction();
            if (success !== true) {
                throw new Error('DB Integrity check failed.');
            }
        });
        return null;
    }
}

const checkReferentialIntegrity = new CheckReferentialIntegrityUseCase();

export { checkReferentialIntegrity };

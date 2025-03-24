import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanInformation } from '../../domain';
import {
    ZomoPlanInformationRepository,
    zomoPlanInformationRepository
} from '../../infrastructure/repository';

class CheckForTwoZomoPlansUseCase
    implements UseCase<ZomoPlanInformation, boolean>
{
    constructor(
        private zomoPlanInformationRepository: ZomoPlanInformationRepository
    ) {}

    async execute(): Promise<boolean> {
        const storedZomoPlans: ZomoPlanInformation[] =
            await this.zomoPlanInformationRepository.getAllEntries();

        return storedZomoPlans.length >= 2;
    }
}

const checkForTwoZomoPlans = new CheckForTwoZomoPlansUseCase(
    zomoPlanInformationRepository
);

export { checkForTwoZomoPlans };

import * as _ from 'lodash';
import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanInformation } from '../../domain';
import {
    ZomoPlanInformationRepository,
    zomoPlanInformationRepository
} from '../../infrastructure/repository';

class CheckForZomoPlanDuplicationUseCase
    implements UseCase<ZomoPlanInformation, boolean>
{
    constructor(
        private zomoPlanInformationRepository: ZomoPlanInformationRepository
    ) {}

    async execute(zomoPlanInformation: ZomoPlanInformation): Promise<boolean> {
        const storedZomoPlans: ZomoPlanInformation[] =
            await this.zomoPlanInformationRepository.getAllEntriesWith({
                key: 'year',
                value: zomoPlanInformation.year
            });

        const zomoPlansWithRightYear = _.filter(storedZomoPlans, {
            year: zomoPlanInformation.year
        });

        return zomoPlansWithRightYear.length > 0;
    }
}

const checkForZomoPlanDuplication = new CheckForZomoPlanDuplicationUseCase(
    zomoPlanInformationRepository
);

export { checkForZomoPlanDuplication };

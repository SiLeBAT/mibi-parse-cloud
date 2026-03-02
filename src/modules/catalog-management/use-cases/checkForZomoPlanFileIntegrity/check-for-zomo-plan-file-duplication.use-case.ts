import * as _ from 'lodash';
import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanFileInformation } from '../../domain';
import {
    ZomoPlanFileInformationRepository as ZomoPlanFileInformationRepository,
    zomoPlanFileInformationRepository as zomoPlanFileInformationRepository
} from '../../infrastructure/repository';

class CheckForZomoPlanFileDuplicationUseCase
    implements UseCase<ZomoPlanFileInformation, boolean>
{
    constructor(
        private zomoPlanFileInformationRepository: ZomoPlanFileInformationRepository
    ) {}

    async execute(
        zomoPlanFileInformation: ZomoPlanFileInformation
    ): Promise<boolean> {
        const storedZomoPlanFiles: ZomoPlanFileInformation[] =
            await this.zomoPlanFileInformationRepository.getAllEntriesWith({
                key: 'year',
                value: zomoPlanFileInformation.year
            });

        const zomoPlanFilesWithRightYear = _.filter(storedZomoPlanFiles, {
            year: zomoPlanFileInformation.year
        });

        return zomoPlanFilesWithRightYear.length > 0;
    }
}

const checkForZomoPlanFileDuplication =
    new CheckForZomoPlanFileDuplicationUseCase(
        zomoPlanFileInformationRepository
    );

export { checkForZomoPlanFileDuplication };

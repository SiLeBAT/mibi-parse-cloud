import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanFileInformation } from '../../domain';
import {
    ZomoPlanFileInformationRepository,
    zomoPlanFileInformationRepository
} from '../../infrastructure/repository';

class CheckForTwoZomoPlanFilesUseCase
    implements UseCase<ZomoPlanFileInformation, boolean>
{
    constructor(
        private zomoPlanFileInformationRepository: ZomoPlanFileInformationRepository
    ) {}

    async execute(): Promise<boolean> {
        const storedZomoPlanFiles: ZomoPlanFileInformation[] =
            await this.zomoPlanFileInformationRepository.getAllEntries();

        return storedZomoPlanFiles.length >= 2;
    }
}

const checkForTwoZomoPlanFiles = new CheckForTwoZomoPlanFilesUseCase(
    zomoPlanFileInformationRepository
);

export { checkForTwoZomoPlanFiles };

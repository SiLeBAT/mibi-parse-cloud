import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { Submitter } from '../../domain';
import {
    submitterRepository,
    SubmitterRepository
} from '../../infrastructure/repository';

type CreateSubmitterParams = {
    submitterId: EntityId;
};

export class CreateSubmitterUseCase
    implements UseCase<CreateSubmitterParams, Submitter>
{
    constructor(private submitterRepo: SubmitterRepository) {}

    async execute({
        submitterId: userId
    }: CreateSubmitterParams): Promise<Submitter> {
        const userInformation: Submitter =
            await this.submitterRepo.getSubmitterByUserId(userId);
        return userInformation;
    }
}

const createSubmitter = new CreateSubmitterUseCase(submitterRepository);

export { createSubmitter };

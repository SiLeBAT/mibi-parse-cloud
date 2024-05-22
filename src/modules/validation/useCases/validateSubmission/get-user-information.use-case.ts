import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/useCases';
import { UserInformation } from '../../domain';
import {
    UserInformationRepository,
    userInformationRepository
} from '../../infrastructure/repositories';

type GetUserInformationParams = {
    userId: EntityId;
};

export class GetUserInformationUseCase
    implements UseCase<GetUserInformationParams, UserInformation>
{
    constructor(private userInformationRepo: UserInformationRepository) {}

    async execute({
        userId
    }: GetUserInformationParams): Promise<UserInformation> {
        const userInformation: UserInformation =
            await this.userInformationRepo.getUserInformationByUserId(userId);
        return userInformation;
    }
}

const getUserInformation = new GetUserInformationUseCase(
    userInformationRepository
);

export { getUserInformation };

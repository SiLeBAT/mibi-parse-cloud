import { getLogger } from '../../../shared/core/logging-context';
import { Email, EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/use-cases';
import {
    userRepository,
    UserRepository
} from '../../infrastructure/repository';

interface HasUserEmail {
    userEmail: string;
}
type CreateSubmitterIdParams<T extends HasUserEmail> = HTTPRequest<T>;

export class CreateSubmitterIdUseCase<T extends HasUserEmail>
    implements UseCase<CreateSubmitterIdParams<T>, EntityId>
{
    constructor(private userRepository: UserRepository) {}

    async execute(request: CreateSubmitterIdParams<T>): Promise<EntityId> {
        if (request.user) {
            return EntityId.create({ value: request.user.id });
        } else {
            const submitterEmail = await this.getEmailFromRequest(request);
            const submitterId: EntityId = await this.getIdForEmail(
                submitterEmail
            );
            if (!submitterId) {
                throw new Error(
                    'Unable to determine Submitter Id. No user found with the provided email:' +
                        submitterEmail.value
                );
            }
            getLogger().info(
                'Submitter Id determined from email: ' + submitterId.value
            );
            return submitterId;
        }
    }

    private getEmailFromRequest(
        request: CreateSubmitterIdParams<T>
    ): Promise<Email> {
        return Email.create({ value: request.params.userEmail });
    }

    private getIdForEmail(email: Email): Promise<EntityId> {
        return this.userRepository.getIdForEmail(email);
    }
}

const createSubmitterId = new CreateSubmitterIdUseCase(userRepository);

export { createSubmitterId };

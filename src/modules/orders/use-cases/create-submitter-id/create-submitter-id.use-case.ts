import { getLogger } from 'nodemailer/lib/shared';
import { Email, EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/use-cases';
import {
    userRepository,
    UserRepository
} from '../../infrastructure/repositories';

interface HasUserEmail {
    userEmail: string;
}
type CreateSubmitterIdParams<T extends HasUserEmail> = HTTPRequest<T>;

export class CreateSubmitterIdUseCase<T extends HasUserEmail>
    implements UseCase<CreateSubmitterIdParams<T>, EntityId>
{
    private logger = getLogger();
    constructor(private userRepository: UserRepository) {}

    async execute<T extends HasUserEmail>(
        request: CreateSubmitterIdParams<T>
    ): Promise<EntityId> {
        try {
            if (request.user) {
                return EntityId.create({ value: request.user.id });
            } else {
                const submitterEmail = await request.params.userEmail;
                const submitterId: EntityId =
                    await this.userRepository.getIdForEmail(
                        await Email.create({ value: submitterEmail })
                    );
                return submitterId;
            }
        } catch (error) {
            this.logger.error(
                'Unable to determine Submitter Id: ' + error.message
            );
            throw error;
        }
    }
}

const createSubmitterId = new CreateSubmitterIdUseCase(userRepository);

export { createSubmitterId };

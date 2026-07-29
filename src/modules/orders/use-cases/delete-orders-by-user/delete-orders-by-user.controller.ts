import { loggedController } from '../../../shared/core/controller';
import { EmailValidationError } from '../../../shared/domain/valueObjects/email-validation.error';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { OrderDeletionResultDTO } from '../../dto';
import { deleteOrdersByUser } from './delete-orders-by-user.use-case';
import { OrderDeletionError } from './delete-orders-by-user.error';

type DeleteOrdersByUserRequestParameters = {
    readonly userEmail: string;
};

type DeleteOrdersByUserRequest =
    HTTPRequest<DeleteOrdersByUserRequestParameters>;

type ErrorDTO = {
    code: number;
    message: string;
};

export interface EmailValidationErrorDTO extends ErrorDTO {}
export interface DefaultServerErrorDTO extends ErrorDTO {}

const deleteOrdersByUserController = loggedController(
    async (
        request: DeleteOrdersByUserRequest
    ): Promise<OrderDeletionResultDTO | ErrorDTO> => {
        try {
            const deletedOrderCount = await deleteOrdersByUser.execute({
                userEmail: request.params.userEmail
            });
            return { deletedOrderCount };
        } catch (error) {
            if (error instanceof EmailValidationError) {
                const dto: EmailValidationErrorDTO = {
                    code: SERVER_ERROR_CODE.INVALID_EMAIL,
                    message: error.message
                };
                return dto;
            }

            throw new OrderDeletionError('Unable to delete orders', error);
        }
    }
);

const DeleteOrdersByUserRequestValidation = {
    fields: {
        userEmail: {
            required: true,
            type: String,
            error: 'userEmail is a required field'
        }
    }
};

export { deleteOrdersByUserController, DeleteOrdersByUserRequestValidation };

import { loggedController } from '../../../shared/core/controller';
import { EmailValidationError } from '../../../shared/domain/valueObjects/email-validation.error';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { OrderCollectionDTO } from '../../dto';
import { createOrderList } from './create-order-list.use-case';
import { OrderListCreationError } from './create-order-list.error';

type CreateOrderListRequestParameters = {
    readonly userEmail: string;
};

type CreateOrderListRequest = HTTPRequest<CreateOrderListRequestParameters>;

type ErrorDTO = {
    code: number;
    message: string;
};

export interface EmailValidationErrorDTO extends ErrorDTO {}
export interface DefaultServerErrorDTO extends ErrorDTO {}

const createOrderListController = loggedController(
    async (
        request: CreateOrderListRequest
    ): Promise<OrderCollectionDTO | ErrorDTO> => {
        try {
            const orders = await createOrderList.execute({
                userEmail: request.params.userEmail
            });
            return { orders };
        } catch (error) {
            if (error instanceof EmailValidationError) {
                const dto: EmailValidationErrorDTO = {
                    code: SERVER_ERROR_CODE.INVALID_EMAIL,
                    message: error.message
                };
                return dto;
            }

            throw new OrderListCreationError(
                'Unable to create order list',
                error
            );
        }
    }
);

const CreateOrderListRequestValidation = {
    fields: {
        userEmail: {
            required: true,
            type: String,
            error: 'userEmail is a required field'
        }
    }
};

export { createOrderListController, CreateOrderListRequestValidation };

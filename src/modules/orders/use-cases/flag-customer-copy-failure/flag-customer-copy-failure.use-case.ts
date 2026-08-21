import { logger } from '../../../../system/logging';
import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import {
    orderRepository,
    OrderRepository
} from '../../infrastructure/repository';

type FlagCustomerCopyFailureInput = {
    // Undefined when the sender did not grant data-save consent, in which case
    // there is no order to flag.
    orderId?: string;
};

/**
 * Marks an order whose data reached the NRLs but whose confirmation copy could
 * not be mailed to the sender.
 *
 * Mail is deliberately not used to raise this with support: when the copy fails
 * because an address is wrong or the mail system is down, mail is the one
 * channel that cannot be trusted. The flag lives on the order instead, so it
 * survives a mail outage, can be queried at any time, and gives support the
 * basis to resend the copy once the address is corrected.
 */
export class FlagCustomerCopyFailureUseCase
    implements UseCase<FlagCustomerCopyFailureInput, Promise<void>>
{
    constructor(private orderRepo: OrderRepository) {}

    async execute({ orderId }: FlagCustomerCopyFailureInput): Promise<void> {
        if (!orderId) {
            // Nothing was stored, so the only record of the failure is the log.
            logger.warn(
                'Order copy could not be delivered to the sender and the order was not stored, so it cannot be flagged.'
            );
            return;
        }

        try {
            await this.orderRepo.markCustomerCopyFailed(
                EntityId.create({ value: orderId })
            );
        } catch (error) {
            // Never allowed to fail the submission: the NRLs have the data and
            // the sender is about to be told so. A lost flag costs support a
            // follow-up, a thrown error would cost the order.
            logger.error(
                `Unable to flag order as customer-copy-failed. orderId=${orderId} error=${String(
                    error
                )}`
            );
        }
    }
}

const flagCustomerCopyFailure = new FlagCustomerCopyFailureUseCase(
    orderRepository
);

export { flagCustomerCopyFailure };

import { FlagCustomerCopyFailureUseCase } from '../flag-customer-copy-failure.use-case';

describe('FlagCustomerCopyFailureUseCase', () => {
    let markCustomerCopyFailed: jest.Mock;
    let useCase: FlagCustomerCopyFailureUseCase;

    beforeEach(() => {
        markCustomerCopyFailed = jest.fn().mockResolvedValue(undefined);
        useCase = new FlagCustomerCopyFailureUseCase({
            markCustomerCopyFailed
        } as never);
    });

    it('marks the order when it was stored', async () => {
        await useCase.execute({ orderId: 'order-1' });

        expect(markCustomerCopyFailed).toHaveBeenCalledTimes(1);
        expect(markCustomerCopyFailed.mock.calls[0][0].value).toBe('order-1');
    });

    it('does nothing when the order was not stored', async () => {
        await useCase.execute({ orderId: undefined });

        expect(markCustomerCopyFailed).not.toHaveBeenCalled();
    });

    it('swallows a repository failure so the submission still succeeds', async () => {
        markCustomerCopyFailed.mockRejectedValue(new Error('db down'));

        await expect(
            useCase.execute({ orderId: 'order-1' })
        ).resolves.toBeUndefined();
    });
});

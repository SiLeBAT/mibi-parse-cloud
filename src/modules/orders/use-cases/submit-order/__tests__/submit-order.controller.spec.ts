import { EntityId } from '../../../../shared/domain/valueObjects';

const mockCreateSubmitterId = jest.fn();
const mockFromDTO = jest.fn();
const mockValidate = jest.fn();
const mockToDTO = jest.fn();
const mockSaveExecute = jest.fn();
const mockRollback = jest.fn();
const mockAttach = jest.fn();
const mockSubmit = jest.fn();
const mockValidateAnalysis = jest.fn();
const mockFlagCustomerCopyFailure = jest.fn();
const mockGetServerConfig = jest.fn();

jest.mock('../../create-submitter-id', () => ({
    createSubmitterId: { execute: mockCreateSubmitterId }
}));
jest.mock('../../../mappers/order-dto.mapper', () => ({
    OrderDTOMapper: { fromDTO: mockFromDTO }
}));
jest.mock('../../validate-order', () => ({
    validateOrder: { execute: mockValidate }
}));
jest.mock('../../../mappers', () => ({
    AttachSavedIdsMapper: { attach: mockAttach },
    SampleEntryDTOMapper: { toDTO: mockToDTO, fromDTO: jest.fn() }
}));
jest.mock('../../save-order', () => ({
    saveOrder: { execute: mockSaveExecute, rollback: mockRollback },
    OrderSavingError: class OrderSavingError extends Error {}
}));
jest.mock('../submit-order.use-case', () => ({
    submitOrderUseCase: { execute: mockSubmit }
}));
jest.mock('../../flag-customer-copy-failure', () => ({
    flagCustomerCopyFailure: { execute: mockFlagCustomerCopyFailure }
}));
jest.mock('../../../../shared/use-cases/get-server-config', () => ({
    getServerConfig: { execute: mockGetServerConfig }
}));
jest.mock('../../../legacy/application/analysis-validation.service', () => ({
    analysisValidationService: { validate: mockValidateAnalysis }
}));

import { SampleSet } from '../../../domain';
import { SERVER_ERROR_CODE } from '../../../domain/enums';
import { submitOrderController } from '../submit-order.controller';

const makeRequest = () =>
    ({
        log: undefined,
        params: {
            order: {
                sampleSet: {
                    samples: [{}],
                    meta: { fileName: 'f', version: 'v' }
                }
            },
            userEmail: 'user@example.com',
            comment: '',
            receiveAs: 'PDF'
        }
    } as never);

const fakeDomainOrder = { sampleEntryCollection: [{}] };

describe('submitOrderController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateSubmitterId.mockResolvedValue(
            EntityId.create({ value: 'submitter-1' })
        );
        mockFromDTO.mockResolvedValue(fakeDomainOrder);
        jest.spyOn(SampleSet, 'create').mockReturnValue({} as never);
        mockValidate.mockResolvedValue({
            hasErrors: () => false,
            hasAutoCorrections: () => false,
            data: [{}]
        });
        mockToDTO.mockReturnValue({});
        mockSubmit.mockResolvedValue({ customerCopySent: true });
        mockValidateAnalysis.mockReturnValue([]);
        mockFlagCustomerCopyFailure.mockResolvedValue(undefined);
        mockGetServerConfig.mockResolvedValue({ supportPhone: '030 18412-0' });
    });

    afterEach(() => jest.restoreAllMocks());

    it('submits the order to the BfR but does NOT persist it when consent is not granted', async () => {
        // saveOrder returns the order without an objectId => not stored.
        mockSaveExecute.mockResolvedValue({
            sampleSet: { samples: [{}], meta: {} }
        });

        const result = (await submitOrderController(makeRequest())) as {
            order: { objectId?: string };
        };

        expect(mockSubmit).toHaveBeenCalledTimes(1);
        // The un-enriched (not-saved) order is the one submitted.
        expect(mockSubmit).toHaveBeenCalledWith({
            order: fakeDomainOrder,
            submitterId: expect.anything()
        });
        expect(mockAttach).not.toHaveBeenCalled();
        expect(result.order.objectId).toBeUndefined();
    });

    it('persists and submits the id-enriched order when consent is granted', async () => {
        const savedOrderDTO = {
            objectId: 'order-1',
            sampleSet: { samples: [{ objectId: 'sample-1' }], meta: {} }
        };
        mockSaveExecute.mockResolvedValue(savedOrderDTO);
        const enrichedOrder = { enriched: true };
        mockAttach.mockReturnValue(enrichedOrder);

        const result = (await submitOrderController(makeRequest())) as {
            order: { objectId?: string };
        };

        expect(mockAttach).toHaveBeenCalledWith(fakeDomainOrder, savedOrderDTO);
        expect(mockSubmit).toHaveBeenCalledWith({
            order: enrichedOrder,
            submitterId: expect.anything()
        });
        expect(result.order.objectId).toBe('order-1');
    });

    describe('when the sender never received their copy', () => {
        const savedOrderDTO = {
            objectId: 'order-1',
            sampleSet: { samples: [{ objectId: 'sample-1' }], meta: {} }
        };

        beforeEach(() => {
            mockSubmit.mockResolvedValue({ customerCopySent: false });
            mockSaveExecute.mockResolvedValue(savedOrderDTO);
            mockAttach.mockReturnValue({ enriched: true });
        });

        it('flags the stored order instead of failing the submission', async () => {
            const result = (await submitOrderController(makeRequest())) as {
                order: { objectId?: string };
                customerCopySent: boolean;
            };

            expect(mockFlagCustomerCopyFailure).toHaveBeenCalledWith({
                orderId: 'order-1'
            });
            // The NRLs have the data, so nothing is rolled back.
            expect(mockRollback).not.toHaveBeenCalled();
            expect(result.order.objectId).toBe('order-1');
            expect(result.customerCopySent).toBe(false);
        });

        it('reports the failure without an id when the order was not stored', async () => {
            mockSaveExecute.mockResolvedValue({
                sampleSet: { samples: [{}], meta: {} }
            });

            const result = (await submitOrderController(makeRequest())) as {
                customerCopySent: boolean;
            };

            expect(mockFlagCustomerCopyFailure).toHaveBeenCalledWith({
                orderId: undefined
            });
            expect(result.customerCopySent).toBe(false);
        });
    });

    it('answers customerCopySent=true and flags nothing when both mails went out', async () => {
        mockSaveExecute.mockResolvedValue({
            objectId: 'order-1',
            sampleSet: { samples: [{}], meta: {} }
        });

        const result = (await submitOrderController(makeRequest())) as {
            customerCopySent: boolean;
        };

        expect(result.customerCopySent).toBe(true);
        expect(mockFlagCustomerCopyFailure).not.toHaveBeenCalled();
    });

    it('rolls the save back and reports a submission error when the NRLs were not reached', async () => {
        mockSaveExecute.mockResolvedValue({
            objectId: 'order-1',
            sampleSet: { samples: [{}], meta: {} }
        });
        mockSubmit.mockRejectedValue(new Error('smtp down'));

        const result = (await submitOrderController(makeRequest())) as {
            code: number;
        };

        expect(mockRollback).toHaveBeenCalledTimes(1);
        expect(mockFlagCustomerCopyFailure).not.toHaveBeenCalled();
        expect(result.code).toBe(SERVER_ERROR_CODE.ORDER_SUBMISSION_FAILED);
    });

    describe('the support line on failures', () => {
        beforeEach(() => {
            mockSaveExecute.mockResolvedValue({
                sampleSet: { samples: [{}], meta: {} }
            });
            mockSubmit.mockRejectedValue(new Error('smtp down'));
        });

        it('rides along on the error so the client can offer it', async () => {
            const result = (await submitOrderController(makeRequest())) as {
                supportPhone: string;
            };

            expect(result.supportPhone).toBe('030 18412-0');
        });

        it('is empty when none is configured', async () => {
            mockGetServerConfig.mockResolvedValue({ supportPhone: null });

            const result = (await submitOrderController(makeRequest())) as {
                supportPhone: string;
            };

            expect(result.supportPhone).toBe('');
        });

        it('still answers with the error when the configuration cannot be read', async () => {
            mockGetServerConfig.mockRejectedValue(new Error('config down'));

            const result = (await submitOrderController(makeRequest())) as {
                code: number;
                supportPhone: string;
            };

            expect(result.code).toBe(SERVER_ERROR_CODE.ORDER_SUBMISSION_FAILED);
            expect(result.supportPhone).toBe('');
        });
    });

    describe('invalid analysis data', () => {
        const finding = {
            issue: 'DIFFERENT_ANALYSIS_FOR_SAME_NRL',
            nrl: 'NRL-Salm',
            samples: [1, 2],
            procedures: [],
            message:
                'Different analysis procedures were requested for samples of the same NRL (NRL-Salm).'
        };

        beforeEach(() => {
            mockValidateAnalysis.mockReturnValue([finding]);
            mockSaveExecute.mockResolvedValue({
                sampleSet: { samples: [{}], meta: {} }
            });
        });

        it('answers with the specific analysis error code and message', async () => {
            const result = (await submitOrderController(makeRequest())) as {
                code: number;
                message: string;
                findings: unknown[];
            };

            expect(result.code).toBe(SERVER_ERROR_CODE.INVALID_ANALYSIS);
            expect(result.message).toBe(finding.message);
            expect(result.findings).toEqual([finding]);
        });

        it('neither saves nor submits the order', async () => {
            await submitOrderController(makeRequest());

            expect(mockSaveExecute).not.toHaveBeenCalled();
            expect(mockSubmit).not.toHaveBeenCalled();
        });

        it('joins the messages when several problems were found', async () => {
            const second = { ...finding, message: 'Second problem.' };
            mockValidateAnalysis.mockReturnValue([finding, second]);

            const result = (await submitOrderController(makeRequest())) as {
                message: string;
            };

            expect(result.message).toBe(`${finding.message} Second problem.`);
        });
    });
});

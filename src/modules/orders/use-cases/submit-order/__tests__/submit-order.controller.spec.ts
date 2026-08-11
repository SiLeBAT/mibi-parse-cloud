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
        mockSubmit.mockResolvedValue(undefined);
        mockValidateAnalysis.mockReturnValue([]);
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

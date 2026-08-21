import { setLoggingContext } from '../../../shared/core/logging-context';
import { EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure';
import {
    AnnotatedSampleDataEntry,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SampleSet
} from '../../domain';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { OrderDTO, SampleDTO } from '../../dto';
import {
    AnalysisValidationFinding,
    analysisValidationService
} from '../../legacy/application/analysis-validation.service';
import { AttachSavedIdsMapper, SampleEntryDTOMapper } from '../../mappers';
import { OrderDTOMapper } from '../../mappers/order-dto.mapper';
import { NRLId } from '../../../shared/domain/valueObjects/nrl-id.vo';
import { getServerConfig } from '../../../shared/use-cases/get-server-config';
import { createSubmitterId } from '../create-submitter-id';
import { flagCustomerCopyFailure } from '../flag-customer-copy-failure';
import { OrderSavingError, saveOrder } from '../save-order';
import { validateOrder } from '../validate-order';
import {
    AutoCorrectedInputError,
    InvalidAnalysisError,
    InvalidInputError,
    OrderSubmissionError
} from './submit-order.error';
import { submitOrderUseCase } from './submit-order.use-case';

type SubmitOrderRequestParameters = {
    readonly order: OrderDTO;
    readonly comment?: string;
    readonly receiveAs?: string;
    readonly userEmail: string;
};
type SubmitOrderRequest = HTTPRequest<SubmitOrderRequestParameters>;

type SubmitOrderResponseDTO = {
    order: OrderDTO;
    // False when the NRLs received the order but the sender's own copy could
    // not be mailed. The submission succeeded either way; the client uses this
    // to decide which of the two messages the sender is shown.
    customerCopySent: boolean;
};

type SampleEntryCollection = SampleEntry<AnnotatedSampleDataEntry>[];

type ErrorDTO = {
    code: number;
    message: string;
    // The support line to offer the sender, empty when none is configured.
    // Carried on the response rather than served from the system-info endpoint
    // because that endpoint is answered by the legacy server from its own
    // configuration, which knows nothing about this value.
    supportPhone?: string;
};

export interface DefaultServerErrorDTO extends ErrorDTO {}
export interface InvalidInputErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface AutoCorrectedInputErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface OrderSavingErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface OrderSubmissionErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface InvalidAnalysisErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
    // One entry per problem found, so an API client can react per issue instead
    // of parsing the joined message.
    findings: AnalysisValidationFinding[];
}

// Never allowed to turn a submission failure into a config failure: if the
// configuration cannot be read, the sender still gets their error message, just
// without a phone number in it.
const resolveSupportPhone = async (): Promise<string> => {
    try {
        return (await getServerConfig.execute()).supportPhone || '';
    } catch (_error) {
        return '';
    }
};

const submitOrderController = async (
    request: SubmitOrderRequest
): Promise<SubmitOrderResponseDTO | ErrorDTO> => {
    const requestDTO: SubmitOrderRequestParameters = request.params;
    try {
        // Setting the logging context manually because the catch block requires request information.
        setLoggingContext(request.log);

        const submitterId: EntityId = await createSubmitterId.execute(request);
        const order: Order<SampleEntryCollection> =
            await OrderDTOMapper.fromDTO(
                requestDTO.order,
                requestDTO.comment,
                samples => {
                    return samples.map((sample: SampleDTO) => {
                        return SampleEntryDTOMapper.fromDTO(sample, t => ({
                            value: t.value,
                            errors: t.errors || [],
                            correctionOffer: t.correctionOffer || [],
                            oldValue: t.oldValue
                        }));
                    });
                }
            );

        // Step 1: Validate the order.
        const sampleSet = SampleSet.create({
            data: order.sampleEntryCollection
        });
        const validatedSampleSet = await validateOrder.execute({
            submitterId,
            sampleSet
        });

        if (validatedSampleSet.hasErrors()) {
            throw new InvalidInputError(
                'Input validation failed',
                new Error('Input validation failed')
            );
        }
        if (validatedSampleSet.hasAutoCorrections()) {
            throw new AutoCorrectedInputError(
                'Has been auto-corrected',
                new Error('Has been auto-corrected')
            );
        }

        // Step 1b: The analysis data is not covered by the form validation
        // above. Check it against the NRLs the order is split by, so a sender
        // whose analysis cannot be submitted as given is told what is wrong
        // instead of having the first sample's analysis applied to the rest.
        const analysisFindings = analysisValidationService.validate(
            order.sampleEntryCollection.map((entry, index) => ({
                position: index + 1,
                // An entry the sender left incomplete resolves to the unknown
                // NRL and an empty analysis, which the validation skips; the
                // form validation above is what reports missing data.
                nrl: NRLId.create(entry.data?.nrl ?? '').value,
                analysis: entry.data?.analysis ?? {}
            }))
        );
        if (analysisFindings.length > 0) {
            throw new InvalidAnalysisError(
                'Invalid analysis data',
                new Error('Invalid analysis data'),
                analysisFindings
            );
        }

        const validatedOrderDTO: OrderDTO = {
            sampleSet: {
                samples: validatedSampleSet.data.map(
                    (sampleEntry: SampleEntry<SampleEntryTuple>) =>
                        SampleEntryDTOMapper.toDTO(sampleEntry, t => t)
                ),
                meta: requestDTO.order.sampleSet.meta
            }
        };

        // Step 2: Save the order — the use case only persists it if the user
        // granted data-save consent; otherwise the returned DTO has no objectId.
        // Throws OrderSavingError on failure (internal rollback already done).
        const savedOrderDTO = await saveOrder.execute({
            order: validatedOrderDTO,
            userId: submitterId
        });

        // Step 3: Submit the order to the BfR — always, whether or not it was
        // stored. If it was stored, submit the id-enriched order; on submission
        // failure roll the save back (rollback is a no-op when nothing was
        // stored).
        const orderToSubmit = savedOrderDTO.objectId
            ? AttachSavedIdsMapper.attach(order, savedOrderDTO)
            : order;
        let customerCopySent: boolean;
        try {
            ({ customerCopySent } = await submitOrderUseCase.execute({
                order: orderToSubmit,
                submitterId
            }));
        } catch (submitError) {
            await saveOrder.rollback(savedOrderDTO);
            throw new OrderSubmissionError(
                'Order submission failed; any saved order and samples have been rolled back.',
                submitError
            );
        }

        // Step 4: The NRLs have the data, so the order stands. If the sender's
        // own copy did not go out, flag the stored order - support cannot be
        // told by mail when mail is what failed.
        if (!customerCopySent) {
            await flagCustomerCopyFailure.execute({
                orderId: savedOrderDTO.objectId
            });
        }

        return { order: savedOrderDTO, customerCopySent };
    } catch (error) {
        let errorDTO: ErrorDTO;

        if (error instanceof InvalidInputError) {
            const dto: InvalidInputErrorDTO = {
                code: SERVER_ERROR_CODE.INVALID_INPUT,
                message: 'Contains errors',
                order: requestDTO.order
            };
            errorDTO = dto;
        } else if (error instanceof AutoCorrectedInputError) {
            const dto: AutoCorrectedInputErrorDTO = {
                code: SERVER_ERROR_CODE.AUTOCORRECTED_INPUT,
                message: 'Has been auto-corrected',
                order: requestDTO.order
            };
            errorDTO = dto;
        } else if (error instanceof InvalidAnalysisError) {
            const dto: InvalidAnalysisErrorDTO = {
                code: SERVER_ERROR_CODE.INVALID_ANALYSIS,
                // The findings are specific enough to be the message; joining
                // them keeps clients that only surface `message` informative.
                message: error.findings
                    .map(finding => finding.message)
                    .join(' '),
                order: requestDTO.order,
                findings: error.findings
            };
            errorDTO = dto;
        } else if (error instanceof OrderSavingError) {
            const dto: OrderSavingErrorDTO = {
                code: SERVER_ERROR_CODE.ORDER_SAVING_FAILED,
                message:
                    'The order was validated successfully but could not be saved to the database. Please try again.',
                order: requestDTO.order
            };
            errorDTO = dto;
        } else if (error instanceof OrderSubmissionError) {
            const dto: OrderSubmissionErrorDTO = {
                code: SERVER_ERROR_CODE.ORDER_SUBMISSION_FAILED,
                message:
                    'The order was saved successfully but the submission step failed. The saved order has been rolled back. Please try again.',
                order: requestDTO.order
            };
            errorDTO = dto;
        } else {
            const dto: DefaultServerErrorDTO = {
                code: SERVER_ERROR_CODE.UNKNOWN_ERROR,
                message: 'An unknown error occured'
            };
            errorDTO = dto;
        }

        // Attached to every failure, not just the submission one: the sender is
        // shown the same "nothing was sent" banner whichever way the request
        // was refused, and that banner is where the support line belongs.
        return { ...errorDTO, supportPhone: await resolveSupportPhone() };
    } finally {
        setLoggingContext(null);
    }
};

export { submitOrderController };

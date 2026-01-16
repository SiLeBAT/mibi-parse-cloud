import { loggedController } from '../../../shared/core/controller';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { EmailValidationError } from '../../../shared/domain/valueObjects/email-validation.error';
import {
    AnySampleEntry,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SubmissionFormInput
} from '../../domain';
import { OrderDTO } from '../../dto';
import { SubmissionDTOMapper } from '../../mappers';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { createSubmissionFileUseCase } from '../create-submission-file/create-submission-file.use-case';
import { ParseFromJSONUseCase } from './parse-from-json.use-case';
import { ParseFromXLSXUseCase } from './parse-from-xlsx.use-case';
import { checkExcelVersionUseCase } from '../check-excel-version';
import {
    ExcelVersionError,
    SubmissionCreationFailedError
} from './parse-sample-data.error';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';
import { SERVER_ERROR_CODE } from '../../domain/enums';

enum RESOURCE_VIEW_TYPE {
    JSON,
    XLSX
}

type ParseSampleDataResponse =
    | {
          order: OrderDTO;
      }
    | {
          data: string;
          fileName: string;
          type: string;
      };

type ParseSampleDataRequestParameters = {
    readonly data: string;
    readonly filename: string;
    readonly type: 'xml' | 'json';
};

type ParseSampleDataRequest = HTTPRequest<ParseSampleDataRequestParameters>;

type ErrorDTO = {
    code: number;
    message: string;
};

export interface EmailValidationErrorDTO extends ErrorDTO {}
export interface ExcelVersionErrorDTO extends ErrorDTO {
    version: string;
}

/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

const parseSampleDataController = loggedController(
    async (
        request: ParseSampleDataRequest
    ): Promise<ParseSampleDataResponse | ErrorDTO> => {
        const type = getResourceViewType(request.params.type);
        const submissionFormInput: SubmissionFormInput =
            SubmissionFormInput.create({
                data: request.params.data,
                fileName: request.params.filename
            });

        try {
            // Get the right factory depending on submission type
            const createOrder: ParseSampleDataUseCase =
                CreateOrderUseCaseFactory(type);
            const order: Order<AnySampleEntry[]> = await createOrder.execute(
                submissionFormInput
            );
            const matchesExcelVersion = await checkExcelVersionUseCase.execute(
                order
            );

            if (!matchesExcelVersion.valid) {
                throw new ExcelVersionError(
                    `Invalid Excel Version:${matchesExcelVersion.uploadedExcelVersion}`,
                    new Error(
                        `Invalid Excel Version:${matchesExcelVersion.uploadedExcelVersion}`
                    )
                );
            }

            const returnType = getResourceViewType(request.headers['accept']);

            switch (returnType) {
                case RESOURCE_VIEW_TYPE.XLSX: {
                    const fileInformation =
                        await createSubmissionFileUseCase.execute(order);
                    return {
                        fileName: fileInformation.fileName,
                        type: fileInformation.type,
                        data: fileInformation.data
                    };
                }
                case RESOURCE_VIEW_TYPE.JSON:
                default: {
                    const mapper = SampleEntryDTOMapper.toDTO(
                        order.submissionFormInfo?.version || '18'
                    );
                    return {
                        order: SubmissionDTOMapper.toDTO<
                            SampleEntry<SampleEntryTuple>[]
                        >(
                            order as Order<SampleEntry<SampleEntryTuple>[]>,
                            samples => {
                                return (
                                    samples as SampleEntry<SampleEntryTuple>[]
                                ).map(s => mapper(s, t => t));
                            }
                        )
                    };
                }
            }
        } catch (error) {
            if (error instanceof EmailValidationError) {
                const dto: EmailValidationErrorDTO = {
                    code: SERVER_ERROR_CODE.INVALID_EMAIL,
                    message: error.message
                };

                return dto;
            }

            if (error instanceof ExcelVersionError) {
                const version = error.message.includes(':')
                    ? error.message.split(':')[1]
                    : '16';

                const dto: ExcelVersionErrorDTO = {
                    code: SERVER_ERROR_CODE.INVALID_VERSION,
                    message: error.message,
                    version: version
                };

                return dto;
            }

            throw new SubmissionCreationFailedError(
                'Unable to create a submission',
                error
            );
        }
    }
);

function getResourceViewType(typeString: string = 'json'): RESOURCE_VIEW_TYPE {
    let returnType = RESOURCE_VIEW_TYPE.JSON;
    if (typeString.toLowerCase().includes('xml')) {
        returnType = RESOURCE_VIEW_TYPE.XLSX;
    }
    if (typeString.includes('multipart/form-data')) {
        returnType = RESOURCE_VIEW_TYPE.XLSX;
    }
    if (
        typeString.includes(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    ) {
        returnType = RESOURCE_VIEW_TYPE.XLSX;
    }
    return returnType;
}

function CreateOrderUseCaseFactory(
    type: RESOURCE_VIEW_TYPE
): ParseSampleDataUseCase {
    switch (type) {
        case RESOURCE_VIEW_TYPE.XLSX:
            return new ParseFromXLSXUseCase();
        case RESOURCE_VIEW_TYPE.JSON:
        default: {
            return new ParseFromJSONUseCase();
        }
    }
}

const ParseSampleDataRequestValidation = {
    fields: {
        data: {
            required: true,
            type: String,
            error: 'data is a required field'
        },
        filename: {
            required: true,
            type: String,
            error: 'filename is a required field'
        },
        type: {
            required: true,
            type: String,
            options: (val: string) => {
                return (
                    val.toLowerCase() === 'xml' || val.toLowerCase() === 'json'
                );
            },
            error: "type must be 'xml' or 'json'"
        }
    }
};
export { parseSampleDataController, ParseSampleDataRequestValidation };

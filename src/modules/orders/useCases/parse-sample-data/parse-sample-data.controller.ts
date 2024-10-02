import { HTTPRequest } from '../../../shared/infrastructure/request';
import { Order, SampleEntry, SubmissionFormInput } from '../../domain';
import { OrderDTO } from '../../dto';
import { SubmissionDTOMapper } from '../../mappers';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { ParseFromJSONUseCase } from './parse-from-json.use-case';
import { ParseFromXLSXUseCase } from './parse-from-xlsx.use-case';

import { SubmissionCreationFailedError } from './parse-sample-data.error';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';

enum RESOURCE_VIEW_TYPE {
    JSON,
    XLSX
}

type ParseSampleDataResponse = {
    order: OrderDTO;
};
type ParseSampleDataRequestParameters = {
    readonly data: string;
    readonly filename: string;
    readonly type: 'xml' | 'json';
};
type ParseSampleDataRequest = HTTPRequest<ParseSampleDataRequestParameters>;

/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

const parseSampleDataController = async (
    request: ParseSampleDataRequest
): Promise<ParseSampleDataResponse> => {
    const type = getResourceViewType(request.params.type);
    const submissionFormInput: SubmissionFormInput = SubmissionFormInput.create(
        {
            data: request.params.data,
            fileName: request.params.filename
        }
    );

    try {
        // Get the right factory depending on submission type
        const createOrder: ParseSampleDataUseCase =
            CreateOrderUseCaseFactory(type);

        const order: Order<SampleEntry<string>[]> = await createOrder.execute(
            submissionFormInput
        );

        return {
            order: SubmissionDTOMapper.toDTO<SampleEntry<string>[]>(
                order,
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.toDTO(s, t => ({ value: t }))
                    );
                }
            )
        };
    } catch (error) {
        throw new SubmissionCreationFailedError(
            'Unable to create a submission',
            error
        );
    }
};

function getResourceViewType(typeString: string = 'json'): RESOURCE_VIEW_TYPE {
    let returnType = RESOURCE_VIEW_TYPE.JSON;
    if (typeString.toLowerCase().includes('xml')) {
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

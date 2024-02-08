import { SystemInformationDTOMapper } from '../../mappers';
import { SystemInformationDTO } from './get-system-information.dto';
import { getSystemInformation } from './get-system-information.use-case';

/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

type GetSystemInformationResponse = SystemInformationDTO;

const getSystemInformationController =
    async (): Promise<GetSystemInformationResponse> => {
        const systemInformation = await getSystemInformation.execute();

        return SystemInformationDTOMapper.toDTO(systemInformation);
    };

export { getSystemInformationController };

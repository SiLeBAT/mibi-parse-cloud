import { Mapper } from '../../shared/mappers';
import { SystemInformation } from '../domain';
import { SystemInformationDTO } from '../useCases/getSystemInformation';

export class SystemInformationDTOMapper extends Mapper {
    static toDTO(systemInformation: SystemInformation): SystemInformationDTO {
        return {
            version: systemInformation.semanticVersion.toString(),
            lastChange: systemInformation.dateOfLastChange.toString(),
            supportContact: systemInformation.supportContact
                ? systemInformation.supportContact.toString()
                : ''
        };
    }
}

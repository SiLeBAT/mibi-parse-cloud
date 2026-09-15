import { SemanticVersion, SystemInformation } from '../../domain';
import { SystemInformationDTOMapper } from '../system-information-dto-mapper';

describe('SystemInformationDTOMapper', () => {
    it('sends the date of last change as ISO 8601 in UTC', async () => {
        const systemInformation = SystemInformation.create({
            version: await SemanticVersion.create({ value: '1.0.0' }),
            lastChange: new Date('2019-04-16T09:25:17.000Z'),
            supportContact: null,
            supportPhone: null
        });

        const dto = SystemInformationDTOMapper.toDTO(systemInformation);

        expect(dto.lastChange).toBe('2019-04-16T09:25:17.000Z');
    });
});

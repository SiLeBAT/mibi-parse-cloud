import { SemanticVersion } from '../semantic-version.vo';
import { SystemInformation } from '../system-information.vo';

describe('SystemInformation', () => {
    it('serialises the date of last change as ISO 8601 in UTC', async () => {
        const systemInformation = SystemInformation.create({
            version: await SemanticVersion.create({ value: '1.0.0' }),
            lastChange: new Date('2019-04-16T09:25:17.000Z'),
            supportContact: null,
            supportPhone: null
        });

        expect(JSON.parse(systemInformation.toString()).lastChange).toBe(
            '2019-04-16T09:25:17.000Z'
        );
    });
});

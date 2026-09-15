import { PackageInformationProvider } from '../package-information.provider';

const providerWith = (lastChange: string) =>
    new PackageInformationProvider({
        version: '1.0.0',
        mibiConfig: { lastChange }
    });

describe('PackageInformationProvider', () => {
    describe('getDateOfLastChange', () => {
        it('reads the package.json format including its offset', async () => {
            const lastChange = await providerWith(
                '2019-04-16 11:25:17 +0200'
            ).getDateOfLastChange();

            expect(lastChange.toISOString()).toBe('2019-04-16T09:25:17.000Z');
        });

        it('reads ISO 8601', async () => {
            const lastChange = await providerWith(
                '2019-04-16T11:25:17+02:00'
            ).getDateOfLastChange();

            expect(lastChange.toISOString()).toBe('2019-04-16T09:25:17.000Z');
        });

        it('fails instead of returning an invalid date', () => {
            expect(() =>
                providerWith('16.04.2019').getDateOfLastChange()
            ).toThrow("Date of last change can't be determined.");
        });

        it('reads the date kept in package.json', async () => {
            const lastChange =
                await new PackageInformationProvider().getDateOfLastChange();

            expect(Number.isNaN(lastChange.getTime())).toBe(false);
        });
    });
});

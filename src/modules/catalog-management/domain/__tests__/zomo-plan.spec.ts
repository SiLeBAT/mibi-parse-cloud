import { ZomoPlan } from '../zomo-plan.entity';
import { ZomoPlanFileInformation } from '../zomo-plan-file-information.vo';
import { ZomoPlanInformation } from '../zomo-plan-information.vo';

describe('ZomoPlanInformation', () => {
    it('keeps the year', async () => {
        const information = await ZomoPlanInformation.create({ year: '2026' });

        expect(information.year).toBe('2026');
        expect(information.toString()).toBe('2026');
    });

    it('requires a year', async () => {
        await expect(
            ZomoPlanInformation.create({ year: undefined as unknown as string })
        ).rejects.toThrow('Zomo Plan year is required');
    });

    it('equals another information with the same year', async () => {
        const information = await ZomoPlanInformation.create({ year: '2026' });

        expect(
            information.equals(
                await ZomoPlanInformation.create({ year: '2026' })
            )
        ).toBe(true);
        expect(
            information.equals(
                await ZomoPlanInformation.create({ year: '2025' })
            )
        ).toBe(false);
    });
});

describe('ZomoPlanFileInformation', () => {
    it('keeps the year', async () => {
        const information = await ZomoPlanFileInformation.create({
            year: '2026'
        });

        expect(information.year).toBe('2026');
        expect(information.toString()).toBe('2026');
    });

    it('requires a year', async () => {
        await expect(
            ZomoPlanFileInformation.create({
                year: undefined as unknown as string
            })
        ).rejects.toThrow('Zomo Plan File year is required');
    });
});

describe('ZomoPlan', () => {
    it('serialises year and data as JSON', async () => {
        const zomoData = [{ Programm: 'ZoMo 2026', 'ADV8-Kode': ['1'] }];
        const zomoPlan = ZomoPlan.create({
            zomoPlanInformation: await ZomoPlanInformation.create({
                year: '2026'
            }),
            data: zomoData
        });

        expect(zomoPlan.zomoPlanInformation.year).toBe('2026');
        expect(JSON.parse(zomoPlan.JSON)).toEqual({
            data: { year: '2026', zomoData }
        });
    });
});

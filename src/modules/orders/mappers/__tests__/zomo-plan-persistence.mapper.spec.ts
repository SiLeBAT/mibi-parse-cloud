import {
    PersistenceToZomoPlanMappingError,
    ZomoPlanPersistenceMapper
} from '../zomo-plan-persistence.mapper';

const zomoPlanObject = (attributes: Record<string, unknown>) =>
    ({ get: (key: string) => attributes[key] } as never);

describe('ZomoPlanPersistenceMapper', () => {
    it('maps the stored year and plan data', async () => {
        const zomoData = JSON.stringify({
            data: { year: '2026', zomoData: [] }
        });

        const zomoPlan = await ZomoPlanPersistenceMapper.fromPersistence(
            zomoPlanObject({ year: '2026', zomoData })
        );

        expect(zomoPlan.year).toBe('2026');
        expect(zomoPlan.data).toBe(zomoData);
    });

    it.each([
        ['year', { zomoData: '{}' }],
        ['plan data', { year: '2026' }],
        ['blank year', { year: '  ', zomoData: '{}' }]
    ])('fails without %s', async (_, attributes) => {
        await expect(
            ZomoPlanPersistenceMapper.fromPersistence(
                zomoPlanObject(attributes)
            )
        ).rejects.toThrow(PersistenceToZomoPlanMappingError);
    });
});

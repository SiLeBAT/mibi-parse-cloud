import { NRL } from '../../../../shared/domain/entities/nrl.entity';
import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { NRLCache } from '../../../../shared/infrastructure/cache/nrl.cache';
import {
    Analysis,
    Address,
    SampleData,
    SampleSet,
    SampleSheetAnalysis,
    SampleSheetAnalysisOption,
    SampleSheetMetaData,
    UnmarshalSample,
    UnmarshalSampleSheet,
    Urgency
} from '../../model/legacy.model';
import { Sample } from '../../model/sample.entity';
import { NRLService } from '../nrl.service';
import { SampleSheetService } from '../sample-sheet.service';

// Procedure keys as used by NRLService.setValueForAnalysisKey.
const SPECIES = 0;
const SEROLOGICAL = 1;
const RESISTANCE = 2;
const TOXIN = 5;

function makeNRLConfig(
    nrlId: NRL_ID_VALUE,
    standardKeys: number[] = [],
    optionalKeys: number[] = []
): NRL {
    return NRL.create({
        nrlId,
        selectors: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: null as any,
        standardProcedures: standardKeys.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            k => ({ key: k, value: 'std' } as any)
        ),
        optionalProcedures: optionalKeys.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            k => ({ key: k, value: 'opt' } as any)
        )
    });
}

function makeService(nrls: NRL[]): SampleSheetService {
    const cache = {
        getNRLList: jest.fn().mockReturnValue(nrls),
        getNRLById: jest.fn((id: NRL_ID_VALUE) =>
            nrls.find(n => n.nrlId === id)
        ),
        setNRLs: jest.fn(),
        removeAllData: jest.fn()
    } as unknown as jest.Mocked<NRLCache>;
    return new SampleSheetService(new NRLService(cache));
}

// NRL-Salm: species standard, serological and resistance optional.
const SALM = makeNRLConfig(
    NRL_ID_VALUE.NRL_Salm,
    [SPECIES],
    [SEROLOGICAL, RESISTANCE]
);
// NRL-Campy: species standard, toxin optional.
const CAMPY = makeNRLConfig(NRL_ID_VALUE.NRL_Campy, [SPECIES], [TOXIN]);

const EMPTY_ADDRESS: Address = {
    instituteName: '',
    street: '',
    zipCity: '',
    contactPerson: '',
    telephone: '',
    email: ''
};

const OMIT = SampleSheetAnalysisOption.OMIT;
const ACTIVE = SampleSheetAnalysisOption.ACTIVE;
const STANDARD = SampleSheetAnalysisOption.STANDARD;

function makeSheetAnalysis(
    overrides: Partial<SampleSheetAnalysis> = {}
): SampleSheetAnalysis {
    return {
        species: OMIT,
        serological: OMIT,
        resistance: OMIT,
        vaccination: OMIT,
        molecularTyping: OMIT,
        toxin: OMIT,
        esblAmpCCarbapenemasen: OMIT,
        other: OMIT,
        otherText: '',
        compareHuman: OMIT,
        compareHumanText: '',
        ...overrides
    };
}

function makeSheetMeta(analysis: SampleSheetAnalysis): SampleSheetMetaData {
    return {
        nrl: NRL_ID_VALUE.UNKNOWN,
        sender: EMPTY_ADDRESS,
        analysis,
        urgency: Urgency.NORMAL,
        fileName: 'V18_AlleNRLs.xlsx',
        customerRefNumber: '',
        signatureDate: '',
        version: '18'
    };
}

function makeUnmarshalSample(nrl: NRL_ID_VALUE): UnmarshalSample {
    return UnmarshalSample.create({ sample_id: { value: '1' } } as SampleData, {
        nrl,
        urgency: Urgency.NORMAL,
        analysis: {}
    });
}

// Only the three getters SampleSheetService uses are needed for the export
// path, so the full Sample entity is not built here.
function makeSample(
    nrl: NRL_ID_VALUE,
    analysis: Partial<Analysis>,
    urgency: Urgency = Urgency.NORMAL
): Sample {
    return {
        getNRL: () => nrl,
        getAnalysis: () => analysis,
        getUrgency: () => urgency
    } as unknown as Sample;
}

function makeSampleSet(samples: Sample[]): SampleSet {
    return {
        samples,
        meta: {
            sender: EMPTY_ADDRESS,
            fileName: 'V18_AlleNRLs.xlsx',
            customerRefNumber: '',
            signatureDate: '',
            version: '18'
        }
    };
}

describe('SampleSheetService', () => {
    describe('applying the sheet analysis section to the samples', () => {
        it('keeps the selection of a sheet covering several NRLs', () => {
            const service = makeService([SALM, CAMPY]);
            const sheet: UnmarshalSampleSheet = {
                samples: [
                    makeUnmarshalSample(NRL_ID_VALUE.NRL_Salm),
                    makeUnmarshalSample(NRL_ID_VALUE.NRL_Campy)
                ],
                meta: makeSheetMeta(
                    makeSheetAnalysis({
                        serological: ACTIVE,
                        resistance: ACTIVE,
                        toxin: ACTIVE
                    })
                )
            };

            const sampleSet = service.fromSampleSheetToSampleSet(sheet);

            sampleSet.samples.forEach(sample => {
                expect(sample.meta.analysis).toMatchObject({
                    serological: true,
                    resistance: true,
                    toxin: true
                });
            });
        });

        it('still keeps the selection of a sheet with a single NRL', () => {
            const service = makeService([SALM]);
            const sheet: UnmarshalSampleSheet = {
                samples: [
                    makeUnmarshalSample(NRL_ID_VALUE.NRL_Salm),
                    makeUnmarshalSample(NRL_ID_VALUE.NRL_Salm)
                ],
                meta: makeSheetMeta(makeSheetAnalysis({ resistance: ACTIVE }))
            };

            const sampleSet = service.fromSampleSheetToSampleSet(sheet);

            sampleSet.samples.forEach(sample => {
                expect(sample.meta.analysis).toMatchObject({
                    resistance: true,
                    serological: false
                });
            });
        });

        it('forces the standard procedures of each sample NRL on', () => {
            const service = makeService([SALM, CAMPY]);
            const sheet: UnmarshalSampleSheet = {
                samples: [makeUnmarshalSample(NRL_ID_VALUE.NRL_Campy)],
                meta: makeSheetMeta(makeSheetAnalysis({ species: OMIT }))
            };

            const sampleSet = service.fromSampleSheetToSampleSet(sheet);

            expect(sampleSet.samples[0].meta.analysis.species).toBe(true);
        });
    });

    describe('deriving the sheet analysis section for an export', () => {
        it('merges the selection of samples belonging to several NRLs', async () => {
            const service = makeService([SALM, CAMPY]);
            const sampleSet = makeSampleSet([
                makeSample(NRL_ID_VALUE.NRL_Salm, {
                    species: true,
                    serological: true,
                    toxin: false
                }),
                makeSample(NRL_ID_VALUE.NRL_Campy, {
                    species: true,
                    serological: false,
                    toxin: true
                })
            ]);

            const sheet = await service.fromSampleSetToSampleSheet(sampleSet);

            expect(sheet.meta.analysis).toMatchObject({
                species: ACTIVE,
                serological: ACTIVE,
                toxin: ACTIVE,
                resistance: OMIT
            });
        });

        it('keeps the free texts of a sheet covering several NRLs', async () => {
            const service = makeService([SALM, CAMPY]);
            const sampleSet = makeSampleSet([
                makeSample(NRL_ID_VALUE.NRL_Salm, {
                    other: 'bitte auch Serotypisierung',
                    compareHuman: { active: true, value: 'Ausbruch 2026-08' }
                }),
                makeSample(NRL_ID_VALUE.NRL_Campy, {})
            ]);

            const sheet = await service.fromSampleSetToSampleSheet(sampleSet);

            expect(sheet.meta.analysis).toMatchObject({
                other: ACTIVE,
                otherText: 'bitte auch Serotypisierung',
                compareHuman: ACTIVE,
                compareHumanText: 'Ausbruch 2026-08'
            });
        });

        it('exports an empty section when nothing is selected', async () => {
            const service = makeService([SALM, CAMPY]);
            const sampleSet = makeSampleSet([
                makeSample(NRL_ID_VALUE.NRL_Salm, { species: false }),
                makeSample(NRL_ID_VALUE.NRL_Campy, { species: false })
            ]);

            const sheet = await service.fromSampleSetToSampleSheet(sampleSet);

            expect(sheet.meta.analysis).toEqual(makeSheetAnalysis());
        });

        it('still marks standard procedures as such for a single NRL', async () => {
            const service = makeService([SALM]);
            const sampleSet = makeSampleSet([
                makeSample(NRL_ID_VALUE.NRL_Salm, {
                    species: true,
                    serological: true,
                    resistance: false
                })
            ]);

            const sheet = await service.fromSampleSetToSampleSheet(sampleSet);

            expect(sheet.meta.analysis).toMatchObject({
                species: STANDARD,
                serological: ACTIVE,
                resistance: OMIT
            });
        });
    });

    // MPCL-832: uploading a sheet and exporting it again must show the same
    // procedures, which is what the ticket reports as broken.
    it('round trips the selection of a sheet covering several NRLs', async () => {
        const service = makeService([SALM, CAMPY]);
        const uploaded = makeSheetAnalysis({
            serological: ACTIVE,
            resistance: ACTIVE,
            toxin: ACTIVE,
            other: ACTIVE,
            otherText: 'Sonstiges',
            compareHuman: ACTIVE,
            compareHumanText: 'Humanvergleich'
        });
        const sheet: UnmarshalSampleSheet = {
            samples: [
                makeUnmarshalSample(NRL_ID_VALUE.NRL_Salm),
                makeUnmarshalSample(NRL_ID_VALUE.NRL_Campy)
            ],
            meta: makeSheetMeta(uploaded)
        };

        const sampleSet = service.fromSampleSheetToSampleSet(sheet);
        const exported = await service.fromSampleSetToSampleSheet(
            makeSampleSet(
                sampleSet.samples.map(sample =>
                    makeSample(sample.meta.nrl, sample.meta.analysis)
                )
            )
        );

        expect(exported.meta.analysis).toEqual({
            ...uploaded,
            // The species procedure is standard for both NRLs and is therefore
            // always on, which the uploaded sheet did not mark.
            species: ACTIVE
        });
    });
});

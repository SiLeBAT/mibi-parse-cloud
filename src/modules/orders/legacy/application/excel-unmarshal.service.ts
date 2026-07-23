import { NRLId } from '../../../shared/domain/valueObjects';
import { nrlCache } from '../../../shared/infrastructure';
import {
    Analysis,
    SampleData,
    SampleSheetMetaData,
    UnmarshalSample,
    UnmarshalSampleSheet,
    Urgency
} from '../model/legacy.model';
import { NRLService } from './nrl.service';

/**
 * Sample sheet already parsed to JSON by the client (MPS-312). Mirrors
 * {@link UnmarshalSampleSheet} but without each sample's `meta` (nrl/analysis/urgency),
 * which is derived here by the NRL enrichment step, and with `meta.nrl` as the raw
 * cell string (validated/mapped server-side).
 */
export interface ParsedSampleSheetInput {
    samples: { data: SampleData }[];
    meta: Omit<SampleSheetMetaData, 'nrl'> & { nrl: string };
}

/**
 * MPS-312: the .xlsx is now parsed to JSON in the browser (mibi-portal-client),
 * so this service no longer reads spreadsheets. It only performs the server-side
 * NRL enrichment on the already-parsed sample sheet — assigning each sample its
 * responsible NRL and default analysis from the DB-backed NRL cache.
 */
export class ExcelUnmarshalService {
    constructor(private factory: SampleFactory) {}

    fromParsedSampleSheet(
        parsedSheet: ParsedSampleSheetInput
    ): UnmarshalSampleSheet {
        const samples = parsedSheet.samples.map(s =>
            this.factory.createSample(s.data)
        );
        const meta: SampleSheetMetaData = {
            ...parsedSheet.meta,
            nrl: NRLId.create(parsedSheet.meta.nrl).value
        };
        return { samples, meta };
    }
}

class SampleFactory {
    constructor(private nrlService: NRLService) {}
    createSample(data: SampleData): UnmarshalSample {
        const pathogen = data['pathogen_avv'].value;

        const nrl = this.nrlService.getNRLForPathogen(pathogen);
        const defaultAnalysis: Partial<Analysis> = {
            ...this.nrlService.getStandardAnalysisFor(nrl),
            ...this.nrlService.getOptionalAnalysisFor(nrl)
        };

        return UnmarshalSample.create(data, {
            nrl,
            analysis: defaultAnalysis,
            urgency: Urgency.NORMAL
        });
    }
}

const nrlService = new NRLService(nrlCache);
const sampleFactory = new SampleFactory(nrlService);
const excelUnmarshalService = new ExcelUnmarshalService(sampleFactory);

export { excelUnmarshalService };

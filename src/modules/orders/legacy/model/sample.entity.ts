import _ from 'lodash';
import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import { NRLService } from '../application/nrl.service';
import {
    Analysis,
    AnnotatedSampleDataEntry,
    EditValue,
    SampleData,
    SampleDataEntries,
    SampleMetaData,
    SampleProperty,
    Urgency,
    ValidationError,
    ValidationErrorCollection
} from '../model/legacy.model';

export class Sample {
    static create(data: SampleData, meta: SampleMetaData): Sample {
        const cleanedData = _.cloneDeep(data);
        _.forEach(cleanedData, (v, k) => {
            cleanedData[k].value = ('' + v.value).trim();
        });

        return new Sample(cleanedData, meta);
    }

    private constructor(
        private _data: SampleData,
        private _meta: SampleMetaData
    ) {}

    getDataEntries(): SampleDataEntries {
        const entriesOnly: SampleDataEntries = {};
        return Object.keys(this._data).reduce((accumulator, property) => {
            accumulator[property] = { value: this._data[property].value };
            return accumulator;
        }, entriesOnly);
    }

    getValueFor(property: SampleProperty): string {
        return this._data[property].value;
    }

    getEntryFor(property: SampleProperty): AnnotatedSampleDataEntry {
        return this._data[property];
    }

    getAnnotatedData(): SampleData {
        return this._data;
    }

    getOldValues(): Record<SampleProperty, EditValue> {
        const valuesOnly: Record<SampleProperty, EditValue> = {};
        return Object.keys(this._data).reduce((accumulator, property) => {
            if (!_.isNil(this._data[property].oldValue)) {
                accumulator[property] = this._data[property].oldValue || '';
            }
            return accumulator;
        }, valuesOnly);
    }

    get meta(): SampleMetaData {
        return _.cloneDeep(this._meta);
    }

    get pathogenId(): string | undefined {
        if (!this._data.sample_id.value || !this._data.pathogen_avv.value) {
            return undefined;
        }
        return this._data.sample_id.value + this._data.pathogen_avv.value;
    }

    get pathogenIdAVV(): string | undefined {
        if (!this._data.sample_id_avv.value || !this._data.pathogen_avv.value) {
            return undefined;
        }
        return (
            this._data.sample_id_avv.value +
            this._data.pathogen_avv.value +
            (this._data.sample_id.value ? this._data.sample_id.value : '')
        );
    }

    addErrors(errors: ValidationErrorCollection = {}): void {
        _.forEach(errors, (v, k) => {
            if (this._data[k].errors) {
                this._data[k].errors = _.uniqWith(
                    [...this._data[k].errors, ...v],
                    (v1, v2) => _.isEqual(v1, v2)
                );
            } else {
                this._data[k].errors = [...v];
            }
        });
    }

    getErrorCount(level: number): number {
        return Object.keys(this._data).reduce((accumulator, property) => {
            accumulator += this._data[property].errors.filter(
                e => e.level === level
            ).length;
            return accumulator;
        }, 0);
    }

    addErrorTo(property: SampleProperty, error: ValidationError): void {
        this._data[property].errors.push(error);
    }

    addCorrectionTo(property: SampleProperty, correctionOffer: string[]): void {
        this._data[property].correctionOffer =
            this._data[property].correctionOffer.concat(correctionOffer);
    }

    isValid(): boolean {
        let errors: ValidationError[] = [];
        for (const prop of Object.keys(this._data)) {
            errors = errors.concat(this._data[prop].errors);
        }
        return !!errors.length;
    }

    supplementAVV313Data(plz: string, city: string) {
        this._data['sampling_location_zip'].nrlData = plz;
        this._data['sampling_location_text'].nrlData = city;
    }

    applySingleCorrectionSuggestions(): void {
        Object.keys(this._data).forEach(property => {
            const entry = this._data[property];
            if (
                entry.correctionOffer.length === 1 &&
                entry.errors.length === 1 &&
                entry.errors[0].code === 88
            ) {
                entry.oldValue = entry.value;
                entry.value = entry.correctionOffer[0];
                entry.correctionOffer = [];
            }
        });
    }

    setNRL(nrlService: NRLService, nrl: NRL_ID_VALUE): void {
        this._meta.nrl = nrl;
        this._meta.analysis = {
            ...nrlService.getOptionalAnalysisFor(nrl),
            ...this._meta.analysis,
            ...nrlService.getStandardAnalysisFor(nrl)
        };
    }

    setAnalysis(nrlService: NRLService, analysis: Partial<Analysis>): void {
        this._meta.analysis = {
            ..._.cloneDeep(analysis),
            ...nrlService.getStandardAnalysisFor(this._meta.nrl)
        };
    }

    getAnalysis(): Partial<Analysis> {
        return _.cloneDeep(this._meta.analysis);
    }

    getNRL(): NRL_ID_VALUE {
        return this._meta.nrl;
    }

    getUrgency(): Urgency {
        return this._meta.urgency;
    }

    setUrgency(urgency: Urgency): void {
        this._meta.urgency = urgency;
    }

    clone(): Sample {
        const d = _.cloneDeep(this._data);
        const m = _.cloneDeep(this._meta);
        return new Sample(d, m);
    }
}

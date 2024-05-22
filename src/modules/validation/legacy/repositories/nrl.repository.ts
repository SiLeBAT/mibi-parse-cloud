import { ObjectKeys } from '../../infrastructure';
import { NRLService } from '../application/nrl.service';
import { Analysis, NRL } from '../model/legacy.model';
import { NRL_ID_VALUE } from './../../domain';

/*
 *   This repository exists to handle the legacy codebase:
 *   excel-unmarshal.service.ts.
 *   If another object requires an NRL repository, one could consider writing a *   proper implementation (i.e. extends the AbstractRepository)
 */
export class NRLRepository {
    async retrieve(): Promise<NRL[]> {
        const query = new Parse.Query('NRL');
        query.include('standardProcedures');
        query.include('optionalProcedures');
        const nrlObjects: Parse.Object[] = await query.find();
        const result = nrlObjects.map(nrl => this.mapToNRL(nrl));
        return result;
    }
    async getOptionalAnalysisFor(
        nrl: NRL_ID_VALUE
    ): Promise<Partial<Analysis>> {
        return this.getAnalysisFor(nrl, 'optionalProcedures');
    }

    async getStandardAnalysisFor(
        nrl: NRL_ID_VALUE
    ): Promise<Partial<Analysis>> {
        return this.getAnalysisFor(nrl, 'standardProcedures');
    }

    async getAnalysisFor(
        nrl: NRL_ID_VALUE,
        procedure: string
    ): Promise<Partial<Analysis>> {
        const query = new Parse.Query(ObjectKeys.NRL);
        query.include(procedure);
        query.equalTo('name', nrl.toString());
        const nrlObject = await query.first();
        if (!nrlObject) {
            return {};
        }
        const analysis: Partial<Analysis> = {};

        nrlObject
            .get(procedure)
            .reduce((acc: Partial<Analysis>, p: { key: number }) => {
                this.setValueForAnalysisKey(p.key, acc, false);
                return acc;
            }, analysis);

        return analysis;
    }

    private setValueForAnalysisKey(
        key: number,
        analysis: Partial<Analysis>,
        value: boolean
    ): void {
        switch (key) {
            case 0:
                analysis.species = value;
                break;
            case 1:
                analysis.serological = value;
                break;
            case 2:
                analysis.resistance = value;
                break;
            case 3:
                analysis.vaccination = value;
                break;
            case 4:
                analysis.molecularTyping = value;
                break;
            case 5:
                analysis.toxin = value;
                break;
            case 6:
                analysis.esblAmpCCarbapenemasen = value;
                break;
            case 7:
                analysis.sample = value;
                break;
        }
    }

    private mapToNRL(nrl: Parse.Object): NRL {
        const sp = nrl.get('standardProcedure') || [];
        const op = nrl.get('optionalProcedure') || [];
        return {
            id: NRLService.mapNRLStringToEnum(nrl.get('name')),
            selectors: nrl.get('selector') || [],
            email: nrl.get('email') || '',
            standardProcedures: sp.map((p: Parse.Object) => ({
                value: p.get('value'),
                key: p.get('key')
            })),
            optionalProcedures: op.map((p: Parse.Object) => ({
                value: p.get('value'),
                key: p.get('key')
            }))
        };
    }
}

const nrlRepository = new NRLRepository();

export { nrlRepository };

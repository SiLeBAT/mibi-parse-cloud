import { AVVFormatCollection, State } from '../model/legacy.model';

export class StateRepository {
    async getAllFormats(): Promise<AVVFormatCollection> {
        return this.retrieve().then(states => {
            const collection: AVVFormatCollection = {};
            states.forEach(entry => (collection[entry.short] = entry.AVV));
            return collection;
        });
    }

    async retrieve(): Promise<State[]> {
        const query = new Parse.Query('states');
        const states: Parse.Object[] = await query.find();
        return states.map(state => this.mapToState(state));
    }

    private mapToState(state: Parse.Object): State {
        const avv = state.get('AVV');
        return {
            name: state.get('name'),
            short: state.get('short'),
            AVV: avv ? avv : []
        };
    }
}

const stateRepository = new StateRepository();

export { stateRepository };

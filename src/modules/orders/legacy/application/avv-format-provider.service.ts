import _ from 'lodash';
import moment from 'moment';
import { StateRepository } from '../repositories/state.repository';
import { AVVFormatCollection } from '../model/legacy.model';

moment.locale('de');

export class AVVFormatProvider {
    private stateFormats: AVVFormatCollection = {};

    constructor(private parseStateRepository: StateRepository) {
        this.parseStateRepository
            .getAllFormats()
            .then(data => (this.stateFormats = data))
            .catch(error => {
                throw error;
            });
    }
    getFormat(state?: string): string[] {
        let usedFormats = _.flatMap(this.stateFormats);
        if (state) {
            usedFormats = _.flatMap(
                _.filter(this.stateFormats, (v, k) => k === state)
            );
        }
        return usedFormats;
    }
}

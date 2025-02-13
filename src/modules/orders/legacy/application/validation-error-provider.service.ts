import _ from 'lodash';
import { ValidationError } from '../model/legacy.model';
import { ValidationErrorRepository } from '../repositories/validation-error.repository';

export class ValidationErrorProvider {
    private errors: ValidationError[] = [];

    constructor(
        private parseValidationErrorRepository: ValidationErrorRepository
    ) {
        this.parseValidationErrorRepository
            .getAllErrors()
            .then(data => (this.errors = data))
            .catch(error => {
                throw error;
            });
    }

    getError(code: number): ValidationError {
        const error = _.find(this.errors, e => e.code === code);

        if (!error) {
            throw new Error(`Error code not found, code=${code}`);
        }

        return error;
    }
}

import { ValidationError } from '../model/legacy.model';
export class ValidationErrorRepository {
    constructor() {}

    async retrieve(): Promise<Parse.Object[]> {
        const query = new Parse.Query('validationerrors');
        const validationErrors: Parse.Object[] = await query.find();
        return validationErrors;
    }

    async getAllErrors(): Promise<ValidationError[]> {
        return this.retrieve()
            .then(errors => {
                return errors.map(error => this.mapToValidationError(error));
            })
            .catch(error => {
                throw error;
            });
    }

    private mapToValidationError(error: Parse.Object): ValidationError {
        return {
            code: error.get('code'),
            level: error.get('level'),
            message: error.get('message')
        };
    }
}

const validationErrorRepository = new ValidationErrorRepository();

export { validationErrorRepository };

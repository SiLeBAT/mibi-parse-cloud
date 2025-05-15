import { setLoggingContext } from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { InstituteObject } from '../../../shared/infrastructure/parse-types';
import { InstituteRequiredFieldsError } from './add-institute.error';

type InstituteSaveContext = Record<string, unknown>;

type BeforeInstituteSaveHookRequest = ParseHookRequest<
    InstituteObject,
    InstituteSaveContext
>;

export const beforeInstituteSaveHook = async (
    request: BeforeInstituteSaveHookRequest
) => {
    const instituteObject: InstituteObject = request.object;
    const zip = instituteObject.get('zip');
    const city = instituteObject.get('city');
    const address1 = instituteObject.get('address1');

    const isUpdate = Boolean(instituteObject.id);
    try {
        setLoggingContext(request.log);
        if (!isUpdate) {
            if (!zip || !city) {
                throw new InstituteRequiredFieldsError(
                    'zip and city are required fields. Please enter all required fields',
                    new Error()
                );
            }

            if (!address1) {
                const defaultAddress = {
                    street: '',
                    city: ''
                };
                instituteObject.set('address1', defaultAddress);
            }
        }
    } finally {
        setLoggingContext(null);
    }
};

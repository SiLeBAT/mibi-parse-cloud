import { HTTPRequest } from '../infrastructure';
import { setLoggingContext } from './logging-context';

/*
 ** Helper function to add logging to a controller.  Does not work if you need a ** more complicated catch or finally block
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loggedController<T, V>(
    originalFunction: (request: HTTPRequest<T>) => V,
    errorHandler: (error: Error) => void = () => {}
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function replacementFunction(this: any, ...args: any[]) {
        try {
            setLoggingContext(args[0].log);
            const result = originalFunction.call(this, ...args);
            return result;
        } catch (error) {
            return errorHandler(error);
        } finally {
            setLoggingContext(null);
        }
    }
    return replacementFunction;
}

export { loggedController };

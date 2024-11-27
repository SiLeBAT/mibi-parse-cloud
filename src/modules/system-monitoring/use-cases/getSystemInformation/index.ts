import { getSystemInformationController } from './get-system-information.controller';
export { SystemInformationDTO } from './get-system-information.dto';

const FUNCTION_KEY = 'getSystemInformation';
Parse.Cloud.define(FUNCTION_KEY, getSystemInformationController);

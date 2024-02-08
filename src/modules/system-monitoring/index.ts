import { getSystemInformationController } from './useCases/getSystemInformation';

const FUNCTION_KEY = 'getSystemInformation';
Parse.Cloud.define(FUNCTION_KEY, getSystemInformationController);

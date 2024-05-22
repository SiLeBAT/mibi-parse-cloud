import config from 'config';
export interface DataStoreConfiguration {
    dataDir: string;
}

class ConfigurationService {
    getDataStoreConfiguration(): DataStoreConfiguration {
        return config.get('dataStore');
    }
}
const configurationService = new ConfigurationService();

export { configurationService };

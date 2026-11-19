/**
 * The system update module is run on server startup and
 * includes functions that:
 * - Create default data entries if necessary
 * - Checks for referential integrity on the db entries, if necessary
 * - Encrypts entries saved before data encryption was introduced
 *
 * The DB schema itself is defined in mibi-portal-server
 * (src/infrastructure/parse-server/mibi-schema.json) and applied by
 * Parse Server before this cloud code is loaded.
 */
import { logger } from '../../system/logging';
import './use-cases';
logger.info('Parse Cloud: System update module loaded.');

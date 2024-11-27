/**
 * The system update module is run on server startup and
 * includes functions that:
 * - Update the DB Schema if necessary
 * - Checks for referential integrity on the db entries, if necessary
 */
import { logger } from '../../system/logging';
import './use-cases';
logger.info('Parse Cloud: System update module loaded.');

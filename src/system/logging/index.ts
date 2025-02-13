/* istanbul ignore file */
import { TransformableInfo } from 'logform';
import winston from 'winston';

/*
 *
 * Log levels are:
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 *   trace: 5
 *
 */
export class Logger {
    private _logger: winston.Logger;

    constructor() {
        const logLevel: string = 'info';

        this._logger = winston.createLogger({
            level: Logger.mapLogLevels(logLevel),
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(info => Logger.mapLogMessage(info))
            ),
            transports: [new winston.transports.Console()]
        });
    }

    static mapLogMessage(info: TransformableInfo): string {
        let logMsg = `${info.level} ${info.message}`;
        logMsg =
            info.meta !== undefined
                ? logMsg +
                  ' ' +
                  (typeof info.meta === 'object'
                      ? JSON.stringify(info.meta)
                      : (info.meta as string))
                : logMsg;

        return logMsg;
    }

    static mapLogLevels(level: string): string {
        switch (level) {
            case 'trace':
                return 'silly';
            case 'info':
                return level;
            case 'error':
                return level;
            case 'verbose':
                return level;
            case 'warn':
                return level;
            case 'silly':
                return level;
            case 'debug':
                return level;
            default:
                return 'info';
        }
    }

    error(msg: string, meta?: unknown) {
        this._logger.log('error', msg, { meta: meta });
    }

    warn(msg: string, meta?: unknown) {
        this._logger.log('warn', msg, { meta: meta });
    }

    info(msg: string, meta?: unknown) {
        this._logger.log('info', msg, { meta: meta });
    }

    verbose(msg: string, meta?: unknown) {
        this._logger.log('verbose', msg, { meta: meta });
    }

    debug(msg: string, meta?: unknown) {
        this._logger.log('debug', msg, { meta: meta });
    }

    trace(msg: string, meta?: unknown) {
        this._logger.log('silly', msg, { meta: meta });
    }
}

const logger = new Logger();

export { logger };

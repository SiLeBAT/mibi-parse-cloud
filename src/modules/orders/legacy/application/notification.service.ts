import { logger } from '../../../../system/logging';
import {
    Attachment,
    EmailNotificationMeta,
    Notification,
    NotificationMeta
} from '../model/legacy.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationHandler = (notification: Notification<any, any>) => unknown;

export class NotificationService {
    private handlers: NotificationHandler[] = [];

    /**
     * Delivers the notification and resolves once every handler is done.
     *
     * This used to emit on an EventEmitter, which is fire-and-forget: a handler
     * that failed to send its mail could not report that back, so a submission
     * that never reached the BfR still looked successful to the user. Awaiting
     * the handlers is what lets that failure travel back to the caller.
     */
    async sendNotification<T, V extends NotificationMeta>(
        notification: Notification<T, V>
    ): Promise<void> {
        logger.info(`Sending notification:\n
            type: ${JSON.stringify(notification.type, null, 2)},\n
            payload: ${JSON.stringify(notification.payload, null, 2)},\n
            meta: ${JSON.stringify(
                notification.meta,
                (key, value) => {
                    return key === 'data' ? '[...]' : value;
                },
                2
            )}`);

        for (const handler of this.handlers) {
            await handler(notification);
        }
    }

    addHandler<T, V extends NotificationMeta>(
        handler: (notification: Notification<T, V>) => unknown
    ): void {
        this.handlers.push(handler as NotificationHandler);
    }

    createEmailNotificationMetaData(
        to: string,
        subject: string,
        cc = [] as string[],
        attachments = [] as Attachment[]
    ): EmailNotificationMeta {
        return {
            to,
            subject,
            cc,
            attachments
        };
    }
}

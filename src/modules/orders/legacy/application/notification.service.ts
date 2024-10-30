import { EventEmitter } from 'events';

import { logger } from '../../../../system/logging';
import {
    Attachment,
    EmailNotificationMeta,
    Notification,
    NotificationMeta
} from '../model/legacy.model';

export class NotificationService {
    private notificationName = 'mibi-notification';
    private sender: EventEmitter = new EventEmitter();

    sendNotification<T, V extends NotificationMeta>(
        notification: Notification<T, V>
    ): void {
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
        this.sender.emit(this.notificationName, notification);
    }

    addHandler<T, V extends NotificationMeta>(
        handler: (notification: Notification<T, V>) => void
    ): void {
        this.sender.on(this.notificationName, handler);
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

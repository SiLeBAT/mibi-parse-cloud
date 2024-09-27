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
        logger.info('Sending notification: ' + JSON.stringify(notification));
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

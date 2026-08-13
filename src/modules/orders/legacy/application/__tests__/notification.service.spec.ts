import { NotificationService } from '../notification.service';
import {
    EmailNotificationMeta,
    Notification,
    NotificationType
} from '../../model/legacy.model';

function makeNotification(): Notification<
    { appName: string },
    EmailNotificationMeta
> {
    return {
        type: NotificationType.REQUEST_JOB,
        payload: { appName: 'MiBi-Portal' },
        meta: {
            to: 'nrl@example.com',
            subject: 'Neuer Auftrag',
            cc: [],
            attachments: []
        }
    };
}

describe('NotificationService', () => {
    it('resolves once the handler is done', async () => {
        const service = new NotificationService();
        const order: string[] = [];
        service.addHandler(async () => {
            await Promise.resolve();
            order.push('handler');
        });

        await service.sendNotification(makeNotification());
        order.push('caller');

        // The caller must observe the handler's completion, otherwise a failed
        // send could not be reported back.
        expect(order).toEqual(['handler', 'caller']);
    });

    it('propagates a handler failure to the caller', async () => {
        const service = new NotificationService();
        const failure = new Error('SMTP unreachable');
        service.addHandler(async () => {
            throw failure;
        });

        await expect(service.sendNotification(makeNotification())).rejects.toBe(
            failure
        );
    });

    it('still supports handlers that return nothing', async () => {
        const service = new NotificationService();
        const seen: unknown[] = [];
        service.addHandler(notification => {
            seen.push(notification);
        });

        await service.sendNotification(makeNotification());

        expect(seen).toHaveLength(1);
    });

    it('runs every registered handler', async () => {
        const service = new NotificationService();
        const first = jest.fn();
        const second = jest.fn();
        service.addHandler(first);
        service.addHandler(second);

        await service.sendNotification(makeNotification());

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });
});

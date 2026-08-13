import { readFileSync } from 'fs';
import { join } from 'path';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
    __esModule: true,
    default: {
        createTransport: () => ({ sendMail: mockSendMail })
    }
}));

import { MailService } from '../mail';
import { EmailData, NotificationType } from '../../model/legacy.model';

function makeEmailData(): EmailData {
    return {
        type: NotificationType.REQUEST_JOB,
        payload: { appName: 'MiBi-Portal' },
        meta: {
            to: 'nrl@example.com',
            subject: 'Neuer Auftrag',
            cc: [],
            attachments: []
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

function makeService(): MailService {
    return new MailService({
        fromAddress: 'portal@example.com',
        replyToAddress: 'portal@example.com'
    });
}

describe('MailService', () => {
    // Guard against committing the local debug port (e.g. 2525) used to
    // intercept outgoing mails. Production must use SMTP port 25.
    it('uses the production SMTP port 25', () => {
        const source = readFileSync(join(__dirname, '..', 'mail.ts'), 'utf-8');

        expect(source).toMatch(/private\s+port\s*=\s*25\s*;/);
        expect(source).not.toMatch(/private\s+port\s*=\s*(?!25\s*;)\d+\s*;/);
    });

    describe('the mail handler', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('resolves when the mail was accepted', async () => {
            mockSendMail.mockResolvedValue({ messageId: 'abc' });

            await expect(
                makeService().getMailHandler()(makeEmailData())
            ).resolves.toBeUndefined();

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });

        // Delivery failures used to be reported through a callback whose return
        // value went nowhere, so the submission looked successful even though
        // no mail had left the building.
        it('rejects when the mail could not be delivered', async () => {
            const failure = new Error('550 mailbox unavailable');
            mockSendMail.mockRejectedValue(failure);

            await expect(
                makeService().getMailHandler()(makeEmailData())
            ).rejects.toBe(failure);
        });
    });
});

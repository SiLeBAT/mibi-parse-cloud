const mockGetServerConfig = jest.fn();

jest.mock('../../../../shared/use-cases/get-server-config', () => ({
    getServerConfig: { execute: mockGetServerConfig }
}));

import { SubmissionAntiCorruptionLayer } from '../submission.anti-corruption-layer';

const applicantMetaData = () =>
    ({
        user: {
            firstName: 'Erika',
            lastName: 'Mustermann',
            email: 'erika@example.com',
            institution: { stateShort: 'BE', name: 'LGL', city: 'Berlin' },
            getFullName: () => 'Erika Mustermann'
        },
        comment: ''
    } as never);

const payload = () =>
    ({
        buffer: Buffer.from(''),
        fileName: 'Einsendebogen_NRL-AR_validated.pdf',
        mime: 'application/pdf',
        nrl: 'NRL-AR'
    } as never);

const makeLayer = (sendNotification: jest.Mock) => {
    const notificationService = {
        sendNotification,
        createEmailNotificationMetaData: jest.fn(() => ({}))
    };
    return new SubmissionAntiCorruptionLayer(
        notificationService as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never
    );
};

// sendToUser is private, but its contract - report, never throw - is the whole
// point of the change, so it is exercised directly.
const sendToUser = (layer: SubmissionAntiCorruptionLayer): Promise<boolean> =>
    (
        layer as never as {
            sendToUser: (p: unknown, m: unknown) => Promise<boolean>;
        }
    ).sendToUser([payload()], applicantMetaData());

describe('SubmissionAntiCorruptionLayer.sendToUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServerConfig.mockResolvedValue({ appName: 'MiBi-Portal' });
    });

    it('reports success when the copy was delivered', async () => {
        const sendNotification = jest.fn().mockResolvedValue(undefined);

        await expect(sendToUser(makeLayer(sendNotification))).resolves.toBe(
            true
        );
        expect(sendNotification).toHaveBeenCalledTimes(1);
    });

    it('reports the failure instead of throwing when the copy could not be sent', async () => {
        const sendNotification = jest
            .fn()
            .mockRejectedValue(new Error('mailbox unavailable'));

        // Throwing here would roll back an order the NRLs have already received.
        await expect(sendToUser(makeLayer(sendNotification))).resolves.toBe(
            false
        );
    });
});

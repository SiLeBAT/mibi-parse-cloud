import { readFileSync } from 'fs';
import { join } from 'path';

describe('MailService', () => {
    // Guard against committing the local debug port (e.g. 2525) used to
    // intercept outgoing mails. Production must use SMTP port 25.
    it('uses the production SMTP port 25', () => {
        const source = readFileSync(join(__dirname, '..', 'mail.ts'), 'utf-8');

        expect(source).toMatch(/private\s+port\s*=\s*25\s*;/);
        expect(source).not.toMatch(/private\s+port\s*=\s*(?!25\s*;)\d+\s*;/);
    });
});

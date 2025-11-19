// core

// npm
import readFilePromise from 'fs-readfile-promise';
import handlebars from 'handlebars';
import nodemailer, { SentMessageInfo } from 'nodemailer';

import { getLogger } from 'nodemailer/lib/shared';
import {
    EmailData,
    MailConfiguration,
    MailOptions,
    NotificationType
} from '../model/legacy.model';

export class MailService {
    private host = 'localhost';
    private port = 2525;

    private logger = getLogger();

    private viewsDir = __dirname + '/views/de/';

    constructor(private mailConfiguration: MailConfiguration) {}

    getMailHandler() {
        return async (data: EmailData) => {
            let templateFile;
            console.log(
                `${this.constructor.name}, handling notification type. data.type=${data.type}`
            );
            switch (data.type) {
                case NotificationType.RESET_SUCCESS:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'pwnotification.html'
                    );
                    break;
                case NotificationType.REQUEST_ACTIVATION:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'regactivation.html'
                    );
                    break;
                case NotificationType.REQUEST_ALTERNATIVE_CONTACT:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'pwresethelp.html'
                    );
                    break;
                case NotificationType.REQUEST_RESET:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'pwreset.html'
                    );
                    break;
                case NotificationType.REQUEST_JOB:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'jobnotification.html'
                    );
                    break;
                case NotificationType.REQUEST_ADMIN_ACTIVATION:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'adminactivation.html'
                    );
                    break;
                case NotificationType.NOTIFICATION_ADMIN_ACTIVATION:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'adminactivationNotification.html'
                    );
                    break;
                case NotificationType.NOTIFICATION_NOT_ADMIN_ACTIVATED:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'notAdminactivationNotification.html'
                    );
                    break;
                case NotificationType.NOTIFICATION_ALREADY_REGISTERED:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'reguserexists.html'
                    );
                    break;
                case NotificationType.REMINDER_ADMIN_ACTIVATION:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'adminactivationReminder.html'
                    );
                    break;
                case NotificationType.NOTIFICATION_SENT:
                    templateFile = await readFilePromise(
                        this.viewsDir + 'sentnotification.html'
                    );
                    break;
                default:
                    this.logger.warn('Unknown notification type', {
                        notification: data.type
                    });
            }
            if (templateFile) {
                this.sendMail(data.payload, templateFile.toString('utf-8'), {
                    ...data.meta,
                    ...{
                        from: this.mailConfiguration.fromAddress,
                        replyTo: this.mailConfiguration.replyToAddress
                    }
                });
            }
        };
    }

    private sendMail(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateData: any,
        templateFile: string,
        options: MailOptions
    ) {
        templateData.copyrightYear = new Date().getFullYear();

        const template = handlebars.compile(templateFile);
        const result = template(templateData);

        const transporter = nodemailer.createTransport({
            host: this.host,
            port: this.port,
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            ...options,
            ...{
                html: result
            }
        };
        try {
            transporter.sendMail(
                mailOptions,
                (error: Error | null, info: SentMessageInfo) => {
                    if (error) {
                        this.logger.error(
                            `Error sending mail. error=${String(
                                error
                            )} mailSubject="${mailOptions.subject}"`
                        );
                        return error;
                    } else {
                        this.logger.info('Email sent', {
                            subject: mailOptions.subject
                        });
                        this.logger.info(JSON.stringify(info));
                        return info;
                    }
                }
            );
        } catch (error) {
            this.logger.error(
                `Error sending mail. error=${error} mailSubject="${mailOptions.subject}"`
            );
            throw error;
        }
    }
}

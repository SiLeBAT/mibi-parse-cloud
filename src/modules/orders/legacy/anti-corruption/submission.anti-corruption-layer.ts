import {
    AnnotatedSampleDataEntry,
    NRL_ID_VALUE,
    Order,
    SampleEntry
} from '../../domain';
import { ReceiveAs } from '../../domain/enums';
import { CatalogService } from '../application/catalog.service';
import { JSONMarshalService } from '../application/json-marshal.service';
import { NotificationService } from '../application/notification.service';
import { NRLService } from '../application/nrl.service';
import { PDFCreatorService } from '../application/pdf-creator.service';
import { SampleSheetService } from '../application/sample-sheet.service';
import { Sample } from '../model/sample.entity';
import { NRLId } from './../../domain/nrl-id.vo';
import {
    ApplicantMetaData,
    Attachment,
    EmailNotificationMeta,
    FileBuffer,
    NewDatasetCopyNotificationPayload,
    NewDatasetNotificationPayload,
    Notification,
    NotificationType,
    NrlDataFeatures,
    NrlSampleData,
    OrderNotificationMetaData,
    Payload,
    SampleSet,
    SampleSheet,
    Urgency
} from './../model/legacy.model';

export class SubmissionAntiCorruptionLayer {
    private appName: string;
    private overrideRecipient: string;
    private readonly DEFAULT_FILE_NAME = 'Einsendebogen';
    private readonly IMPORTED_FILE_EXTENSION = '.xlsx';
    constructor(
        private notificationService: NotificationService,
        private jsonMarshalService: JSONMarshalService,
        private pdfCreatorService: PDFCreatorService,
        private nrlService: NRLService,
        private sampleSheetService: SampleSheetService,
        private catalogService: CatalogService
    ) {}

    async sendSamples(
        order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>
    ): Promise<void> {
        const applicantMetaData: ApplicantMetaData = {
            user: {
                firstName: order.customer.firstName.value,
                lastName: order.customer.lastName.value,
                email: order.customer.contact.props.email.value,
                institution: {
                    stateShort: order.customer.contact.stateShort.toString(),
                    name: order.customer.contact.instituteName,
                    city: order.customer.contact.city,
                    zip: order.customer.contact.zip
                },
                getFullName: function (): string {
                    return this.firstName + ' ' + this.lastName;
                }
            },
            comment: order.comment,
            receiveAs: ReceiveAs.PDF
        };

        const sampleSet: SampleSet = {
            samples: order.sampleEntryCollection.map(entry => {
                return Sample.create(
                    {
                        sample_id: entry.data.sample_id,
                        sample_id_avv: entry.data.sample_id_avv,
                        partial_sample_id: entry.data.partial_sample_id,
                        pathogen_avv: entry.data.pathogen_avv,
                        pathogen_text: entry.data.pathogen_text,
                        sampling_date: entry.data.sampling_date,
                        isolation_date: entry.data.isolation_date,
                        sampling_location_avv: entry.data.sampling_location_avv,
                        sampling_location_zip: entry.data.sampling_location_zip,
                        sampling_location_text:
                            entry.data.sampling_location_text,
                        animal_avv: entry.data.animal_avv,
                        matrix_avv: entry.data.matrix_avv,
                        animal_matrix_text: entry.data.animal_matrix_text,
                        primary_production_avv:
                            entry.data.primary_production_avv,
                        control_program_avv: entry.data.program_avv,
                        sampling_reason_avv: entry.data.sampling_reason_avv,
                        program_reason_text: entry.data.program_reason_text,
                        operations_mode_avv: entry.data.operations_mode_avv,
                        operations_mode_text: entry.data.operations_mode_text,
                        vvvo: entry.data.vvvo,
                        program_avv: entry.data.program_avv,
                        comment: entry.data.comment
                    },
                    {
                        nrl: NRLId.create(entry.data.nrl).value,
                        urgency:
                            Urgency[entry.data.urgency as keyof typeof Urgency],
                        analysis: entry.data.analysis
                    }
                );
            }),
            meta: {
                sender: {
                    instituteName: order.customer.contact.instituteName,
                    street: order.customer.contact.street,
                    zip: order.customer.contact.zip,
                    city: order.customer.contact.city,
                    contactPerson: order.customer.fullName,
                    telephone: order.customer.contact.telephone,
                    email: order.customer.contact.email.value
                },
                fileName: order.submissionFormInfo?.fileName || '',
                customerRefNumber: order.customer.customerRefNumber,
                signatureDate: order.signatureDate,
                version: order.submissionFormInfo?.version || ''
            }
        };

        const splittedSampleSets = this.splitSampleSet(sampleSet);

        const nrlSampleSets = splittedSampleSets.map(sampleSet =>
            this.createNRLSampleSet(sampleSet)
        );

        const nrlPayloads = await this.createPayloads(
            nrlSampleSets,
            sampleSheet =>
                this.jsonMarshalService.createExcel(sampleSheet, true)
        );

        let userPayloads: Payload[];
        switch (applicantMetaData.receiveAs) {
            case ReceiveAs.PDF:
                userPayloads = await this.createPayloads(
                    splittedSampleSets,
                    sampleSheet => this.pdfCreatorService.createPDF(sampleSheet)
                );
                break;
            case ReceiveAs.EXCEL:
            default:
                userPayloads = await this.createPayloads(
                    splittedSampleSets,
                    sampleSheet =>
                        this.jsonMarshalService.createExcel(sampleSheet)
                );
                break;
        }

        this.sendToNRLs(nrlPayloads, applicantMetaData);

        this.sendToUser(userPayloads, applicantMetaData);
    }

    private splitSampleSet(sampleSet: SampleSet): SampleSet[] {
        const splittedSampleSetMap = new Map<string, SampleSet>();
        sampleSet.samples.forEach(sample => {
            const nrl = sample.getNRL();
            let splittedSampleSet = splittedSampleSetMap.get(nrl);
            if (!splittedSampleSet) {
                splittedSampleSet = {
                    samples: [],
                    meta: { ...sampleSet.meta }
                };
                splittedSampleSetMap.set(nrl, splittedSampleSet);
            }
            splittedSampleSet.samples.push(sample);
        });
        return Array.from(splittedSampleSetMap.values());
    }

    private async createPayloads(
        sampleSets: SampleSet[],
        creatorFunc: (sampleSheet: SampleSheet) => Promise<FileBuffer>
    ): Promise<Payload[]> {
        return Promise.all(
            sampleSets.map(async sampleSet =>
                this.createPayload(sampleSet, creatorFunc)
            )
        );
    }

    private async createPayload(
        sampleSet: SampleSet,
        creatorFunc: (sampleSheet: SampleSheet) => Promise<FileBuffer>
    ): Promise<Payload> {
        const sampleSheet =
            await this.sampleSheetService.fromSampleSetToSampleSheet(sampleSet);

        const fileBuffer = await creatorFunc(sampleSheet);

        const nrl = sampleSet.samples[0].getNRL();
        const fileName = this.amendFileName(
            sampleSet.meta.fileName || this.DEFAULT_FILE_NAME,
            '_' + nrl + '_validated',
            fileBuffer.extension
        );

        return {
            buffer: fileBuffer.buffer,
            fileName: fileName,
            mime: fileBuffer.mimeType,
            nrl: nrl
        };
    }

    private sendToNRLs(
        payloads: Payload[],
        applicantMetaData: ApplicantMetaData
    ): void {
        payloads.forEach(payload => {
            const orderNotificationMetaData =
                this.resolveOrderNotificationMetaData(
                    applicantMetaData,
                    payload.nrl
                );

            const newOrderNotification = this.createNewOrderNotification(
                this.createNotificationAttachment(payload),
                orderNotificationMetaData
            );

            this.notificationService.sendNotification(newOrderNotification);
        });
    }

    private sendToUser(
        payloads: Payload[],
        applicantMetaData: ApplicantMetaData
    ): void {
        const attachments = payloads.map(file =>
            this.createNotificationAttachment(file)
        );

        const newOrderCopyNotification = this.createNewOrderCopyNotification(
            attachments,
            applicantMetaData
        );

        this.notificationService.sendNotification(newOrderCopyNotification);
    }

    private createNotificationAttachment(payload: Payload): Attachment {
        return {
            filename: payload.fileName,
            content: payload.buffer,
            contentType: payload.mime
        };
    }

    private resolveOrderNotificationMetaData(
        applicantMetaData: ApplicantMetaData,
        nrl: NRL_ID_VALUE
    ): OrderNotificationMetaData {
        return {
            ...applicantMetaData,
            recipient: {
                email: this.nrlService.getEmailForNRL(nrl),
                name: nrl.toString()
            }
        };
    }

    private createNewOrderCopyNotification(
        datasets: Attachment[],
        applicantMetaData: ApplicantMetaData
    ): Notification<NewDatasetCopyNotificationPayload, EmailNotificationMeta> {
        const fullName = applicantMetaData.user.getFullName();
        return {
            type: NotificationType.NOTIFICATION_SENT,
            payload: {
                appName: this.appName,
                name: fullName,
                comment: applicantMetaData.comment
            },
            meta: this.notificationService.createEmailNotificationMetaData(
                applicantMetaData.user.email,
                `Neuer Auftrag an das BfR`,
                [],
                datasets
            )
        };
    }

    private createNewOrderNotification(
        dataset: Attachment,
        orderNotificationMetaData: OrderNotificationMetaData
    ): Notification<NewDatasetNotificationPayload, EmailNotificationMeta> {
        return {
            type: NotificationType.REQUEST_JOB,

            payload: {
                appName: this.appName,
                firstName: orderNotificationMetaData.user.firstName,
                lastName: orderNotificationMetaData.user.lastName,
                email: orderNotificationMetaData.user.email,
                institution: orderNotificationMetaData.user.institution,
                comment: orderNotificationMetaData.comment
            },
            meta: this.notificationService.createEmailNotificationMetaData(
                this.overrideRecipient
                    ? this.overrideRecipient
                    : orderNotificationMetaData.recipient.email,
                `Neuer Auftrag von ${
                    orderNotificationMetaData.user.institution.city ||
                    '<unbekannt>'
                } an ${
                    orderNotificationMetaData.recipient.name || '<unbekannt>'
                }`,
                [],
                [dataset]
            )
        };
    }

    private amendFileName(
        originalFileName: string,
        fileNameAddon: string,
        fileExtension: string
    ): string {
        const entries: string[] = originalFileName.split(
            this.IMPORTED_FILE_EXTENSION
        );
        let fileName: string = '';
        if (entries.length > 0) {
            fileName += entries[0];
        }
        fileName += fileNameAddon + fileExtension;
        fileName = fileName.replace(' ', '_');
        return fileName;
    }

    private createNRLSampleSet(sampleSet: SampleSet): SampleSet {
        const nrlDataFeatures: NrlDataFeatures = {
            sampling_location_text_avv: {
                catalog: 'avv313',
                avvProperty: 'sampling_location_avv'
            },
            animal_text_avv: {
                catalog: 'avv339',
                avvProperty: 'animal_avv'
            },
            matrix_text_avv: {
                catalog: 'avv319',
                avvProperty: 'matrix_avv'
            },
            primary_production_text_avv: {
                catalog: 'avv316',
                avvProperty: 'primary_production_avv'
            },
            control_program_text_avv: {
                catalog: 'avv322',
                avvProperty: 'control_program_avv'
            },
            sampling_reason_text_avv: {
                catalog: 'avv326',
                avvProperty: 'sampling_reason_avv'
            },
            operations_mode_text_avv: {
                catalog: 'avv303',
                avvProperty: 'operations_mode_avv'
            },
            program_text_avv: {
                catalog: 'avv328',
                avvProperty: 'program_avv'
            }
        };

        sampleSet.samples.forEach(sample => {
            const nrlData: Partial<NrlSampleData> = this.getNrlDataForSample(
                sample,
                nrlDataFeatures
            );

            this.expandSampleWithNrlData(sample, nrlData);
        });

        const nrlSampleSet: SampleSet = {
            meta: sampleSet.meta,
            samples: sampleSet.samples.map(sample => sample.clone())
        };

        nrlSampleSet.samples.forEach(sample => {
            this.replaceEmptySampleIDWithSampleIDAVV(sample);
            this.moveAVV313Data(sample);
            this.removeGeneratedTiereMatrixText(sample);
            this.removeSampleDataDuplicates(sample);
        });

        return nrlSampleSet;
    }

    private getNrlDataForSample(
        sample: Sample,
        nrlDataFeatures: NrlDataFeatures
    ): Partial<NrlSampleData> {
        const nrlSampleData: Partial<NrlSampleData> = {};

        for (const props in nrlDataFeatures) {
            const nrlDataFeatureProperties = nrlDataFeatures[props];

            const catalog = this.catalogService.getAVVCatalog(
                nrlDataFeatureProperties.catalog
            );

            const avvProperty = nrlDataFeatureProperties.avvProperty;
            const textValue = catalog.getTextWithAVVKode(
                sample.getAnnotatedData()[avvProperty].value
            );

            nrlSampleData[props] = {
                value: textValue,
                errors: [],
                correctionOffer: []
            };
        }
        return nrlSampleData as NrlSampleData;
    }

    private expandSampleWithNrlData(
        sample: Sample,
        nrlData: Partial<NrlSampleData>
    ) {
        const errorSampleDataEntry: AnnotatedSampleDataEntry = {
            value: '',
            errors: [],
            correctionOffer: []
        };
        const annotatedData: Partial<NrlSampleData> = sample.getAnnotatedData();
        for (const props in nrlData) {
            annotatedData[props] = nrlData[props]
                ? nrlData[props]
                : errorSampleDataEntry;
        }
    }

    private replaceEmptySampleIDWithSampleIDAVV(sample: Sample) {
        const sampleData = sample.getAnnotatedData();
        const sampleID = sampleData.sample_id.value;
        const sampleIDAVV = sampleData.sample_id_avv.value;
        if (!sampleID && sampleIDAVV) {
            sampleData.sample_id.value = sampleIDAVV;
            sampleData.sample_id.oldValue = '';
        }
    }

    private moveAVV313Data(sample: Sample) {
        const sampleData = sample.getAnnotatedData();
        const sampleZip = sampleData.sampling_location_zip.nrlData;
        const sampleCity = sampleData.sampling_location_text.nrlData;

        if (sampleZip !== undefined && sampleCity !== undefined) {
            sampleData.sampling_location_zip.value = sampleZip;
            sampleData.sampling_location_text.value = sampleCity;
            delete sampleData.sampling_location_zip.nrlData;
            delete sampleData.sampling_location_text.nrlData;
        }
    }

    private removeGeneratedTiereMatrixText(sample: Sample) {
        const sampleData = sample.getAnnotatedData();
        const tierMatrixTextOldValue = sampleData.animal_matrix_text.oldValue;

        if (tierMatrixTextOldValue === '') {
            sampleData.animal_matrix_text.value = '';
        }
    }

    private removeSampleDataDuplicates(sample: Sample) {
        const sampleData = sample.getAnnotatedData() as NrlSampleData;

        this.removeSimpleDuplicates(
            sampleData.pathogen_avv,
            sampleData.pathogen_text
        );
        this.removeSimpleDuplicates(
            sampleData.sampling_location_text_avv,
            sampleData.sampling_location_text
        );
        this.removeSimpleDuplicates(
            sampleData.operations_mode_text_avv,
            sampleData.operations_mode_text
        );
        this.removeComplexDuplicates(
            sampleData.animal_text_avv,
            sampleData.matrix_text_avv,
            sampleData.animal_matrix_text
        );
        this.removeComplexDuplicates(
            sampleData.control_program_text_avv,
            sampleData.sampling_reason_text_avv,
            sampleData.program_reason_text
        );
    }

    private removeSimpleDuplicates(
        sampleDataEntry1: AnnotatedSampleDataEntry,
        sampleDataEntryToRemove: AnnotatedSampleDataEntry
    ) {
        if (
            sampleDataEntry1.value.trim() ===
            sampleDataEntryToRemove.value.trim()
        ) {
            sampleDataEntryToRemove.value = '';
        }
    }

    private removeComplexDuplicates(
        sampleDataEntry1: AnnotatedSampleDataEntry,
        sampleDataEntry2: AnnotatedSampleDataEntry,
        sampleDataEntryToRemove: AnnotatedSampleDataEntry
    ) {
        const entry1Text = sampleDataEntry1.value.trim();
        const entry2Text = sampleDataEntry2.value.trim();
        const entryToRemoveText = sampleDataEntryToRemove.value.trim();

        const newText = entryToRemoveText
            .replace(entry1Text, '')
            .replace(entry2Text, '')
            .trim();

        sampleDataEntryToRemove.value = newText;
    }
}

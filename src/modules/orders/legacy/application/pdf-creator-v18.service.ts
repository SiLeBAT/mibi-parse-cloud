import fs from 'fs';
import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import {
    Address,
    FileBuffer,
    NrlSampleData,
    SampleSheet,
    SampleSheetAnalysis,
    SampleSheetAnalysisOption,
    SampleSheetMetaData,
    Urgency
} from '../model/legacy.model';
import { Sample } from '../model/sample.entity';
import { CatalogService } from './catalog.service';
import { PDFConfigProviderV18Service } from './pdf-config-provider-v18.service';
import { PDFService } from './pdf.service';

type PdfPrefixText = { text: string; bold: boolean };
type PdfText = (string | PdfPrefixText)[];

export class PDFCreatorV18Service {
    private readonly FILE_EXTENSION = '.pdf';
    private readonly MIME_TYPE = 'application/pdf';
    private readonly SEPARATOR = '. ';
    private readonly USER_PREFIX = 'User';

    private readonly config;
    private readonly strings;

    private logo: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get EMPTY(): any {
        return { text: ' ' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get EMPTY_SMALL(): any {
        return {
            text: ' ',
            style: 'halfLine'
        };
    }

    constructor(
        private pdfService: PDFService,
        private configProvider: PDFConfigProviderV18Service,
        private catalogService: CatalogService
    ) {
        this.config = this.configProvider.config;
        this.strings = this.configProvider.strings;
        this.loadLogo();
    }

    async createPDF(sampleSheet: SampleSheet): Promise<FileBuffer> {
        const docDefinition = this.createDocDefinition(sampleSheet);

        const buffer = await this.pdfService.createPDF(
            docDefinition,
            this.configProvider.tableLayouts
        );

        return {
            buffer: buffer,
            mimeType: this.MIME_TYPE,
            extension: this.FILE_EXTENSION
        };
    }

    private loadLogo() {
        this.logo = fs.readFileSync(this.config.svgLogoPath, 'utf8').toString();
    }

    private createDocDefinition(sampleSheet: SampleSheet) {
        return {
            info: { ...this.config.fileInfo },
            ...this.createPageConfig(),
            defaultStyle: this.configProvider.defaultStyle,
            styles: this.configProvider.styles,
            content: this.createContent(sampleSheet),
            footer: (currentPage: number, pageCount: number) =>
                this.createFooter(currentPage, pageCount)
        };
    }

    private createPageConfig() {
        const pageConfig = this.config.page;
        const margins = pageConfig.margins;
        return {
            pageSize: pageConfig.size,
            pageOrientation: pageConfig.orientation,
            pageMargins: [
                margins.left,
                margins.top,
                margins.right,
                margins.bottom
            ]
        };
    }

    private createContent(sampleSheet: SampleSheet) {
        return [
            {
                ...this.createMeta(sampleSheet.meta),
                pageBreak: 'after'
            },
            this.createSamples(sampleSheet.samples)
        ];
    }

    // Meta content

    private createMeta(metaData: SampleSheetMetaData) {
        return {
            stack: [
                this.createMetaMainRow(
                    this.createMetaHeader(),
                    this.EMPTY,
                    this.createMetaLogo()
                ),
                this.EMPTY,
                this.EMPTY,
                this.createMetaMainRow(
                    this.createMetaRecipient(metaData.nrl),
                    this.EMPTY,
                    this.createMetaStamp(metaData.customerRefNumber)
                ),
                this.EMPTY,
                this.createMetaMainRow(
                    this.createMetaSender(metaData.sender),
                    this.createMetaAnalysis(metaData.analysis),
                    this.EMPTY
                ),
                this.EMPTY,
                this.EMPTY,
                this.createMetaMainRow(
                    this.createMetaSignature(
                        this.strings.meta.signature.date,
                        metaData.signatureDate
                    ),
                    this.createMetaUrgency(metaData.urgency),
                    this.EMPTY
                ),
                this.EMPTY,
                this.createMetaSignatureDataProcessing(),
                this.EMPTY,
                this.createMetaMainRow(
                    this.createMetaSignature(
                        this.strings.meta.signature.signature
                    ),
                    this.EMPTY,
                    this.EMPTY
                ),
                this.EMPTY,
                this.EMPTY,
                this.createInstructions()
            ]
        };
    }

    private createMetaHeader() {
        const strings = this.strings.meta.header;
        return {
            stack: [
                {
                    text: [
                        strings.title,
                        { text: strings.titleSup, sup: true }
                    ],
                    style: 'title'
                },
                { text: strings.subtitle, style: 'comment', noWrap: true },
                {
                    text: strings.version + this.config.version.toString(),
                    style: 'version'
                }
            ]
        };
    }

    private createMetaLogo() {
        return {
            stack: [{ svg: this.logo, alignment: 'right' }]
        };
    }

    private createMetaRecipient(nrl: NRL_ID_VALUE) {
        const strings = this.strings.meta.recipient;
        const nrlString = this.strings.nrl[nrl];
        return {
            stack: [
                { text: strings.title, style: 'heading1' },
                { text: strings.institute, style: 'elevated' },
                this.createMetaTable({
                    widths: ['auto', '*'],
                    body: [
                        [
                            {
                                text: strings.nrl,
                                style: 'heading3',
                                border: [false, false, true, false],
                                marginLeft: -4
                            },
                            {
                                text: nrlString,
                                style: ['elevated', 'markedCell']
                            }
                        ]
                    ]
                }),
                { text: strings.street },
                { text: strings.place }
            ]
        };
    }

    private createMetaStamp(customerRefNumber: string) {
        const strings = this.strings.meta.stamp;
        return this.createMetaTable({
            widths: [0, '100%'],
            body: [
                [
                    {
                        text: strings.receiptDate,
                        style: 'heading2',
                        noWrap: true,
                        alignment: 'right',
                        border: [false, false, true, false]
                    },
                    this.EMPTY
                ],
                [
                    {
                        text: strings.customerRefNumber,
                        style: 'heading2',
                        noWrap: true,
                        alignment: 'right',
                        border: [false, false, true, false]
                    },
                    {
                        text: customerRefNumber ? customerRefNumber : ' ',
                        style: 'markedCell'
                    }
                ]
            ]
        });
    }

    private createMetaSender(address: Address) {
        const strings = this.strings.meta.sender;
        let place = ' ';
        const zip = address.zip;
        const city = address.city;
        if (zip !== '' && city !== '') {
            place = zip + ', ' + city;
        } else if (zip !== '') {
            place = zip;
        } else if (city !== '') {
            place = city;
        }
        return {
            stack: [
                { text: strings.title, style: 'heading1' },
                this.createMetaTable(
                    {
                        widths: ['auto', '*'],
                        body: [
                            [
                                {
                                    text: strings.instituteName,
                                    style: 'heading3'
                                },
                                { text: address.instituteName }
                            ],
                            [
                                { text: strings.department, style: 'heading3' },
                                { text: address.department }
                            ],
                            [
                                { text: strings.street, style: 'heading3' },
                                { text: address.street }
                            ],
                            [
                                { text: strings.place, style: 'heading3' },
                                { text: place }
                            ],
                            [
                                {
                                    text: strings.contactPerson,
                                    style: 'heading3'
                                },
                                { text: address.contactPerson }
                            ],
                            [
                                { text: strings.telephone, style: 'heading3' },
                                { text: address.telephone }
                            ],
                            [
                                { text: strings.email, style: 'heading3' },
                                { text: address.email }
                            ]
                        ]
                    },
                    ['markedCell']
                )
            ]
        };
    }

    private createMetaAnalysis(analysis: SampleSheetAnalysis) {
        const strings = this.strings.meta.analysis;
        const getStringFromOption = (
            option: SampleSheetAnalysisOption
        ): string => {
            switch (option) {
                case SampleSheetAnalysisOption.OMIT:
                    return ' ';
                case SampleSheetAnalysisOption.STANDARD:
                    return strings.options.standard;
                case SampleSheetAnalysisOption.ACTIVE:
                    return strings.options.active;
            }
        };
        const getStringFromText = (text: string): string => (text ? text : ' ');
        return {
            stack: [
                {
                    text: [
                        strings.title,
                        { text: strings.titleSup, sup: true }
                    ],
                    style: 'heading1'
                },
                this.createMetaTable({
                    widths: ['*', this.config.meta.columnGap],
                    body: [
                        [
                            { text: strings.species },
                            {
                                text: getStringFromOption(analysis.species),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.serological },
                            {
                                text: getStringFromOption(analysis.serological),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.resistance },
                            {
                                text: getStringFromOption(analysis.resistance),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.vaccination },
                            {
                                text: getStringFromOption(analysis.vaccination),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            {
                                text: [
                                    strings.molecularTyping,
                                    {
                                        text: strings.molecularTypingSup,
                                        sup: true
                                    }
                                ]
                            },
                            {
                                text: getStringFromOption(
                                    analysis.molecularTyping
                                ),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.toxin },
                            {
                                text: getStringFromOption(analysis.toxin),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.esblAmpCCarbapenemasen },
                            {
                                text: getStringFromOption(
                                    analysis.esblAmpCCarbapenemasen
                                ),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            { text: strings.other },
                            {
                                text: getStringFromOption(analysis.other),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            {
                                text: getStringFromText(analysis.otherText),
                                style: ['markedCell', 'userComment']
                            },
                            { text: '' }
                        ],
                        [
                            {
                                text: [
                                    strings.compareHuman,
                                    { text: strings.compareHumanSup, sup: true }
                                ]
                            },
                            {
                                text: getStringFromOption(
                                    analysis.compareHuman
                                ),
                                style: 'markedCell',
                                alignment: 'center'
                            }
                        ],
                        [
                            {
                                text: getStringFromText(
                                    analysis.compareHumanText
                                ),
                                style: ['markedCell', 'userComment']
                            },
                            { text: '' }
                        ]
                    ]
                })
            ]
        };
    }

    private createMetaSignature(text: string, value?: string) {
        return {
            stack: [
                this.createMetaTable({
                    widths: [this.config.meta.col11Width],
                    body: [[{ text: value ? value : ' ', style: 'markedCell' }]]
                }),
                { text: text, style: 'heading2' }
            ]
        };
    }

    private createMetaSignatureDataProcessing() {
        const strings = this.strings.meta.signature;
        return {
            stack: [
                {
                    text: [
                        { text: strings.dataProcessingText },
                        {
                            text: strings.dataProcessingLink,
                            link: strings.dataProcessingLink,
                            style: 'link'
                        }
                    ]
                },
                {
                    text: [
                        { text: strings.dataProcessingHintPre },
                        {
                            text: strings.dataProcessingHintLink,
                            link: strings.dataProcessingHintLink,
                            style: 'link'
                        },
                        { text: strings.dataProcessingHintPost }
                    ]
                }
            ]
        };
    }

    private createMetaUrgency(urgency: Urgency) {
        const strings = this.strings.meta.urgency;
        return {
            stack: [
                this.createMetaTable({
                    widths: ['auto', 'auto'],
                    body: [
                        [
                            {
                                text: strings.title,
                                style: 'heading1',
                                border: [false, false, true, false]
                            },
                            {
                                text: urgency.toString(),
                                style: ['elevated', 'markedCell']
                            }
                        ]
                    ]
                })
            ]
        };
    }

    private createInstructions() {
        const strings = this.strings.meta.instructions;
        return {
            stack: [
                {
                    text: [
                        { text: strings.sendInstructionsPre },
                        {
                            text: strings.sendInstructionsLink,
                            link: strings.sendInstructionsLink,
                            style: 'link'
                        },
                        { text: strings.sendInstructionsPost }
                    ]
                },
                this.EMPTY_SMALL,
                { text: strings.printInstructions },
                this.EMPTY_SMALL,
                { text: strings.cellProtectionInstruction1 },
                { text: strings.cellProtectionInstruction2 }
            ]
        };
    }

    // Meta content helpers

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createMetaMainRow(col1: any, col2: any, col3: any) {
        const metaConfig = this.config.meta;
        return {
            columns: [
                {
                    width: metaConfig.col1Width,
                    ...col1
                },
                {
                    width: metaConfig.col2Width,
                    ...col2
                },
                {
                    width: metaConfig.col3Width,
                    ...col3
                }
            ],
            columnGap: metaConfig.columnGap
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createMetaTable(table: any, styles: Array<string> = []) {
        const margins = this.config.meta.tableMargins;
        return {
            style: styles.concat(['cell']),
            layout: 'metaLayout',
            margin: [margins.left, margins.top, margins.right, margins.bottom],
            table: table
        };
    }

    // Samples content

    private createSamples(samples: Sample[]) {
        const colWidthIndicesMap = this.config.samples.colWidthIndicesMap;
        const widthFactors: number[] = [];
        for (const value of colWidthIndicesMap.values()) {
            widthFactors.push(this.config.samples.colWidthFactors[value]);
        }

        const widthSum = widthFactors.reduce((a: number, b: number) => a + b);
        const widths = widthFactors.map(
            v => ((v / widthSum) * 100).toString() + '%'
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = new Array<Array<any>>();
        body.push(this.createSamplesHeaderRow());
        samples.forEach(sample => {
            body.push(
                this.createSamplesDataRow(
                    sample.getAnnotatedData() as NrlSampleData
                )
            );
        });
        return {
            layout: 'samplesLayout',
            table: {
                headerRows: 1,
                widths: widths,
                body: body,
                dontBreakRows: true
            }
        };
    }

    private createSamplesHeaderRow() {
        const titles = this.strings.samples.titles;
        const subTitles = this.strings.samples.subtitles;
        return [
            this.createSamplesHeaderCell(titles.sample_id, subTitles.sample_id),
            this.createSamplesHeaderCell(
                titles.sample_id_avv,
                subTitles.sample_id_avv
            ),
            this.createSamplesHeaderCell(
                titles.partial_sample_id,
                subTitles.partial_sample_id
            ),
            this.createSamplesHeaderCell(
                titles.pathogen_avv,
                subTitles.pathogen_avv
            ),
            this.createSamplesHeaderCell(
                titles.pathogen_text,
                subTitles.pathogen_text
            ),
            this.createSamplesHeaderCell(
                titles.sequence_id,
                subTitles.sequence_id
            ),
            this.createSamplesHeaderCell(
                titles.sequence_status,
                subTitles.sequence_status
            ),
            this.createSamplesHeaderCell(
                titles.sampling_date,
                subTitles.sampling_date
            ),
            this.createSamplesHeaderCell(
                titles.isolation_date,
                subTitles.isolation_date
            ),
            this.createSamplesHeaderCell(
                titles.sampling_location_zip,
                subTitles.sampling_location_zip
            ),
            this.createSamplesHeaderCell(
                titles.sampling_location_text,
                subTitles.sampling_location_text
            ),
            this.createSamplesHeaderCell(
                titles.animal_matrix_text,
                subTitles.animal_matrix_text
            ),
            this.createSamplesHeaderCell(
                titles.program_reason_text,
                subTitles.program_reason_text
            ),
            this.createSamplesHeaderCell(
                titles.operations_mode_text,
                subTitles.operations_mode_text
            ),
            this.createSamplesHeaderCell(
                titles.program_text_avv,
                subTitles.program_text_avv
            ),
            this.createSamplesHeaderCell(titles.comment, subTitles.comment)
        ];
    }

    private createSamplesHeaderCell(title: string, subTitle: string) {
        return {
            style: 'headerCell',
            stack: [{ text: title }, { text: subTitle, style: 'subHeader' }]
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createSamplesDataRow(sampleData: NrlSampleData): Array<any> {
        return [
            this.createSamplesDataCell([sampleData.sample_id.value]),
            this.createSamplesDataCell([sampleData.sample_id_avv.value]),

            this.createSamplesDataCell([sampleData.partial_sample_id.value]),

            this.createSamplesDataCell([sampleData.pathogen_avv.value]),
            this.createSamplesDataCell([sampleData.pathogen_text.value]),
            this.createSamplesDataCell([sampleData['sequence_id'].value]),
            this.createSamplesDataCell([sampleData['sequence_status'].value]),
            this.createSamplesDataCell([sampleData.sampling_date.value]),
            this.createSamplesDataCell([sampleData.isolation_date.value]),
            this.createSamplesDataCell([
                sampleData.sampling_location_zip.value
            ]),
            this.createCodeToTextDataCell(
                'avv313',
                sampleData.sampling_location_avv.value.trim(),
                sampleData.sampling_location_text.value.trim(),
                sampleData.sampling_date.value.trim(),
                'Ort'
            ),
            this.createTwoCodesToTextDataCell(
                'avv339',
                'avv319',
                sampleData.animal_avv.value.trim(),
                sampleData.matrix_avv.value.trim(),
                sampleData.animal_matrix_text.value.trim(),
                sampleData.sampling_date.value.trim(),
                'Tier',
                'Matrix',
                false,
                false
            ),
            this.createTwoCodesToTextDataCell(
                'avv322',
                'avv326',
                sampleData.control_program_avv.value.trim(),
                sampleData.sampling_reason_avv.value.trim(),
                sampleData.program_reason_text.value.trim(),
                sampleData.sampling_date.value.trim(),
                'Kontroll-P',
                'Unters.-Grund'
            ),
            this.createCodeToTextDataCell(
                'avv303',
                sampleData.operations_mode_avv.value.trim(),
                sampleData.operations_mode_text.value.trim(),
                sampleData.sampling_date.value.trim(),
                'Betrieb',
                false
            ),
            // this.createSamplesDataCell([sampleData.vvvo.value]),
            this.createAdditionalDataCell(
                'avv328',
                sampleData.program_avv.value,
                sampleData.sampling_date.value.trim()
            ),
            this.createSamplesDataCell([sampleData.comment.value])
        ];
    }

    private createSamplesDataCell(value: PdfText) {
        const style = ['dataCell'];

        return {
            style: style,
            text: value
        };
    }

    private createAdditionalDataCell(
        catalogName: string,
        codeValue: string,
        samplingDateValue: string
    ) {
        const catalogTextValue = this.getCatalogTextWithAVVKode(
            catalogName,
            codeValue,
            samplingDateValue
        );

        return this.createSamplesDataCell([catalogTextValue]);
    }

    private createCodeToTextDataCell(
        catalogName: string,
        codeValue: string,
        textValue: string,
        samplingDateValue: string,
        prefix: string,
        includingFacettenName: boolean = true
    ) {
        const pdfText: PdfText = [];
        let catalogTextValue = this.getCatalogTextWithAVVKode(
            catalogName,
            codeValue,
            samplingDateValue
        );

        const hasCode = !!codeValue;
        const hasText = !!textValue;
        const isCatalogText = textValue === catalogTextValue;
        const hasCatalogText = textValue.includes(catalogTextValue);
        const isUserText = !hasCatalogText && hasText;
        const hasUserAndCatalogText =
            hasCatalogText && textValue.length > catalogTextValue.length;

        if (!includingFacettenName) {
            catalogTextValue = this.getCatalogTextWithAVVKode(
                catalogName,
                codeValue,
                samplingDateValue,
                false
            );
        }

        if (!hasCode && !hasText) {
            // code: no, text: no
            pdfText.push('');
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode && !hasText) {
            // code: yes, text: no
            pdfText.push(catalogTextValue);
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode && hasText) {
            // code: no, text: yes
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode && isUserText) {
            // code: yes, text: user text
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix));
            pdfText.push(catalogTextValue);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode && isCatalogText) {
            pdfText.push(catalogTextValue);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode && hasUserAndCatalogText) {
            // code: yes, text: user text + avv text
            const userText = textValue.replace(catalogTextValue, '').trim();
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(userText);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix));
            pdfText.push(catalogTextValue);
            return this.createSamplesDataCell(pdfText);
        }

        return this.createSamplesDataCell(pdfText);
    }

    private createTwoCodesToTextDataCell(
        catalogName1: string,
        catalogName2: string,
        codeValue1: string,
        codeValue2: string,
        textValue: string,
        samplingDateValue: string,
        prefix1: string,
        prefix2: string,
        includingFacettenName1: boolean = true,
        includingFacettenName2: boolean = true
    ) {
        const pdfText: PdfText = [];
        let catalogTextValue1 = this.getCatalogTextWithAVVKode(
            catalogName1,
            codeValue1,
            samplingDateValue
        );
        let catalogTextValue2 = this.getCatalogTextWithAVVKode(
            catalogName2,
            codeValue2,
            samplingDateValue
        );

        const cleanedUserText = textValue
            .replace(catalogTextValue1, '')
            .trim()
            .replace(catalogTextValue2, '')
            .trim()
            .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
        const userTextLength = cleanedUserText.length;
        const textValueLength = textValue.length;
        const catalogTextLength = textValue.length - userTextLength;
        const hasUserText = textValueLength > catalogTextLength;

        const hasCode1 = !!codeValue1;
        const hasCode2 = !!codeValue2;
        const hasText = !!textValue;
        const isCatalogText1 =
            catalogTextValue1 !== '' && textValue === catalogTextValue1;
        const isCatalogText2 =
            catalogTextValue2 !== '' && textValue === catalogTextValue2;
        const hasCatalogText1 =
            catalogTextValue1 !== '' && textValue.includes(catalogTextValue1);
        const hasCatalogText2 =
            catalogTextValue2 !== '' && textValue.includes(catalogTextValue2);
        const isUserText = !hasCatalogText1 && !hasCatalogText2 && hasText;
        const hasUserAndCatalogText1 =
            hasCatalogText1 && !hasCatalogText2 && hasUserText;
        const hasUserAndCatalogText2 =
            hasCatalogText2 && !hasCatalogText1 && hasUserText;
        const hasUserAndCatalogText1AndCatalogText2 =
            hasCatalogText1 && hasCatalogText2 && hasUserText;

        if (!includingFacettenName1) {
            catalogTextValue1 = this.getCatalogTextWithAVVKode(
                catalogName1,
                codeValue1,
                samplingDateValue,
                false
            );
        }
        if (!includingFacettenName2) {
            catalogTextValue2 = this.getCatalogTextWithAVVKode(
                catalogName2,
                codeValue2,
                samplingDateValue,
                false
            );
        }

        if (!hasCode1 && !hasCode2 && !hasText) {
            pdfText.push('');
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode1 && !hasCode2 && hasText) {
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && !hasCode2 && !hasText) {
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && !hasCode2 && isUserText) {
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && !hasCode2 && isCatalogText1) {
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && !hasCode2 && hasUserAndCatalogText1) {
            const userText = cleanedUserText;
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(userText);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode1 && hasCode2 && !hasText) {
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode1 && hasCode2 && isUserText) {
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode1 && hasCode2 && isCatalogText2) {
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (!hasCode1 && hasCode2 && hasUserAndCatalogText2) {
            const userText = cleanedUserText;
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(userText);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && hasCode2 && !hasText) {
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (hasCode1 && hasCode2 && isUserText) {
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(textValue);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (
            hasCode1 &&
            hasCode2 &&
            (hasCatalogText1 || hasCatalogText2) &&
            !hasUserAndCatalogText1 &&
            !hasUserAndCatalogText2 &&
            !hasUserAndCatalogText1AndCatalogText2
        ) {
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        if (
            hasCode1 &&
            hasCode2 &&
            (hasUserAndCatalogText1 ||
                hasUserAndCatalogText2 ||
                hasUserAndCatalogText1AndCatalogText2)
        ) {
            const userText = cleanedUserText;
            pdfText.push(this.getBoldPrefixText(this.USER_PREFIX));
            pdfText.push(userText);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix1));
            pdfText.push(catalogTextValue1);
            pdfText.push(this.SEPARATOR);
            pdfText.push(this.getBoldPrefixText(prefix2));
            pdfText.push(catalogTextValue2);
            return this.createSamplesDataCell(pdfText);
        }

        return this.createSamplesDataCell(pdfText);
    }

    private getCatalogTextWithAVVKode(
        catalogName: string,
        codeValue: string,
        samplingDateValue: string,
        includingFacettenName: boolean = true
    ): string {
        const catalog = this.catalogService.getAVVCatalog(
            catalogName,
            samplingDateValue
        );
        const catalogTextValue = catalog.getTextWithAVVKode(
            codeValue.trim(),
            includingFacettenName
        );

        return catalogTextValue;
    }

    private getBoldPrefixText(text: string): PdfPrefixText {
        return {
            text: `${text}: `,
            bold: true
        };
    }

    // Footer

    private createFooter(currentPage: number, pageCount: number) {
        const strings = this.strings.meta.footer18;
        const margins = this.config.footer.margins;
        return {
            columns: [
                { text: strings.validated },
                {
                    text:
                        strings.page +
                        ' ' +
                        currentPage.toString() +
                        ' ' +
                        strings.pageOf +
                        ' ' +
                        pageCount.toString(),
                    alignment: 'right'
                }
            ],
            style: 'footer',
            margin: [margins.left, margins.top, margins.right, margins.bottom]
        };
    }
}

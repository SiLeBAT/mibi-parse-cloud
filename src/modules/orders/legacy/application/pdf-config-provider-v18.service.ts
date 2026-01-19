import _ from 'lodash';

import {
    PDFConstantsV18,
    SampleSheetV18Config,
    SampleSheetV18Constants,
    SampleSheetMetaStrings,
    SampleSheetNRLStrings,
    SampleSheetV18PDFConfig,
    SampleSheetV18SamplesStrings
} from '../model/legacy.model';

export class PDFConfigProviderV18Service {
    // mmToInch * inchToPixel
    private readonly MM_TO_PIXEL = 0.0393701 * 72;
    private readonly _config;
    private readonly _defaultStyle;
    private readonly _styles;
    private _tableLayouts;

    get config(): SampleSheetV18Config & SampleSheetV18PDFConfig {
        return this._config;
    }

    get defaultStyle() {
        return this._defaultStyle;
    }

    get styles() {
        return this._styles;
    }

    get tableLayouts() {
        return this._tableLayouts;
    }

    get strings(): {
        meta: SampleSheetMetaStrings;
        samples: SampleSheetV18SamplesStrings;
        nrl: SampleSheetNRLStrings;
    } {
        return {
            meta: this.constants.metaStrings,
            samples: this.constants.samplesStrings,
            nrl: this.constants.nrlStrings
        };
    }

    constructor(
        private constants: SampleSheetV18Constants,
        private pdfConstants: PDFConstantsV18
    ) {
        this._config = {
            ..._.cloneDeep(this.constants.config),
            ..._.cloneDeep(this.pdfConstants.config)
        };
        this._defaultStyle = _.cloneDeep(this.constants.defaultStyle);
        this._styles = {
            ..._.cloneDeep(this.constants.styles),
            ..._.cloneDeep(this.pdfConstants.styles)
        };
        this.preProcessStyles();
        this.preProcessConfig();

        this._tableLayouts = {
            metaLayout: this.createMetaTableLayout(),
            samplesLayout: this.createSamplesTableLayout()
        };
    }

    // Preprocessing

    private preProcessStyles() {
        this.preProcessStyle(this.defaultStyle);
        _.forEach(this.styles, v => {
            this.preProcessStyle(v);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private preProcessStyle(style: any) {
        if (Object.prototype.hasOwnProperty.call(style, 'fontSize')) {
            (style as { fontSize: number }).fontSize *= this.config.scale;
        }
    }

    private preProcessConfig() {
        this.preProcessMargins(this.config.page.margins, false);
        this.preProcessMargins(this.config.footer.margins, false);

        this.preProcessMargins(this.config.meta.tableMargins, true);
        this.preProcessMargins(this.config.meta.cellPadding, true);
        this.preProcessMargins(this.config.samples.cellPadding, true);

        const scale = this.MM_TO_PIXEL * this.config.scale;
        this.config.meta.columnGap *= scale;
        this.config.meta.superScriptGap *= scale;
    }

    private preProcessMargins(
        margins: {
            left?: number;
            right?: number;
            top?: number;
            bottom?: number;
        },
        doScaling: boolean
    ) {
        let scale = this.MM_TO_PIXEL;
        if (doScaling) {
            scale *= this.config.scale;
        }

        if (margins.left) {
            margins.left *= scale;
        }
        if (margins.right) {
            margins.right *= scale;
        }
        if (margins.top) {
            margins.top *= scale;
        }
        if (margins.bottom) {
            margins.bottom *= scale;
        }
    }

    // Table layouts

    private createMetaTableLayout() {
        const tableConfig = this.config.table;
        return {
            hLineWidth: () => tableConfig.thinBorder,
            vLineWidth: () => tableConfig.thinBorder,
            ...this.createTableLayoutPaddingFunctions(
                this.config.meta.cellPadding
            )
        };
    }

    private createSamplesTableLayout() {
        const tableConfig = this.config.table;
        const doThickLines = this.config.samples.colThickLines;
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hLineWidth: (i: number, node: any) => {
                if (
                    i === 0 ||
                    i === node.table.body.length ||
                    i === node.table.headerRows
                ) {
                    return tableConfig.thickBorder;
                } else {
                    return tableConfig.thinBorder;
                }
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vLineWidth: (i: number, node: any) => {
                if (
                    i === 0 ||
                    i === node.table.widths.length ||
                    doThickLines[i - 1]
                ) {
                    return tableConfig.thickBorder;
                } else {
                    return tableConfig.thinBorder;
                }
            },
            ...this.createTableLayoutPaddingFunctions(
                this.config.samples.cellPadding
            )
        };
    }

    private createTableLayoutPaddingFunctions(padding: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    }) {
        let paddingOps = {};
        if (padding.left !== undefined) {
            paddingOps = { ...paddingOps, paddingLeft: () => padding.left };
        }
        if (padding.right !== undefined) {
            paddingOps = { ...paddingOps, paddingRight: () => padding.right };
        }
        if (padding.top !== undefined) {
            paddingOps = { ...paddingOps, paddingTop: () => padding.top };
        }
        if (padding.bottom !== undefined) {
            paddingOps = { ...paddingOps, paddingBottom: () => padding.bottom };
        }
        return paddingOps;
    }
}

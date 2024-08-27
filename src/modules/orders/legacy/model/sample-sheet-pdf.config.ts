export const sampleSheetPDFConfig = {
    scale: 10 / 14, // guess from printed excel
    table: {
        thinBorder: 0.5,
        thickBorder: 1
    },
    meta: {
        superScriptGap: 1,
        col1Width: '45%',
        col2Width: '40%',
        col3Width: '15%',
        col11Width: '60%',
        columnGap: 21,
        cellPadding: {
            top: 1.5,
            bottom: 0
        },
        tableMargins: {
            top: 0,
            bottom: 2,
            left: 0,
            right: 0
        }
    },
    samples: {
        cellPadding: {
            top: 1,
            bottom: 0,
            left: 0.5,
            right: 0.5
        },
        colWidthFactors: [0.8, 1, 1.2, 1.25, 1.3, 1.4, 1.5, 1.9, 3.1, 3.3, 5],
        colWidthIndicesMap: new Map<string, number>([
            ['sample_id', 2],
            ['sample_id_avv', 4],
            ['partial_sample_id', 0],
            ['pathogen_avv', 7],
            ['pathogen_text', 4],
            ['sampling_date', 4],
            ['isolation_date', 4],
            ['sampling_location_zip', 1],
            ['sampling_location_text', 2],
            ['animal_matrix_text', 10],
            ['primary_production_text_avv', 6],
            ['program_reason_text', 8],
            ['operations_mode_text', 8],
            ['vvvo', 1],
            ['program_text_avv', 5],
            ['comment', 6]
        ]),
        colThickLines: [
            false,
            false,
            true,
            false,
            true,
            false,
            true,
            false,
            true,
            false,
            true,
            true,
            true,
            true,
            true
        ]
    }
};

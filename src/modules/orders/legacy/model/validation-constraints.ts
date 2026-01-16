import { ValidationConstraints } from '../model/legacy.model';

// only for ZoMo samples
export const zoMoConstraints: ValidationConstraints = {
    sample_id: {
        presence: {
            error: 2,
            allowEmpty: false
        }
    },

    sample_id_avv: {
        presence: {
            error: 5,
            allowEmpty: false
        }
    },

    pathogen_avv: {
        matchesZoMo: {
            error: 115,
            date: ['sampling_date'],
            zomoKey: '324',
            codeType: 'pathogen',
            programField: {
                attr: 'program_avv',
                zomoKey: '328'
            }
        }
    },

    pathogen_text: {},

    sampling_date: {},

    isolation_date: {
        presence: {
            error: 18,
            allowEmpty: false
        }
    },

    animal_avv: {
        atLeastOneOf: {
            error: 34,
            additionalMembers: ['matrix_avv']
        },

        matchesZoMo: {
            error: 113,
            date: 'sampling_date',
            zomoKey: '339',
            codeType: 'facetten',
            programField: {
                attr: 'program_avv',
                zomoKey: '328'
            }
        }
    },

    matrix_avv: {
        atLeastOneOf: {
            error: 34,
            additionalMembers: ['animal_avv']
        },

        matchesZoMo: {
            error: 114,
            date: 'sampling_date',
            zomoKey: '319',
            codeType: 'facetten',
            programField: {
                attr: 'program_avv',
                zomoKey: '328'
            }
        }
    },

    operations_mode_avv: {
        atLeastOneOf: {
            error: 48,
            additionalMembers: ['operations_mode_text']
        },

        matchesZoMo: {
            error: 116,
            date: 'sampling_date',
            zomoKey: '303',
            codeType: 'facetten',
            programField: {
                attr: 'program_avv',
                zomoKey: '328'
            }
        }
    },

    operations_mode_text: {
        atLeastOneOf: {
            error: 48,
            additionalMembers: ['operations_mode_avv']
        }
    },

    sampling_location_avv: {
        atLeastOneOf: {
            error: 86,
            additionalMembers: [
                'sampling_location_zip',
                'sampling_location_text'
            ]
        }
    },

    sampling_location_zip: {
        atLeastOneOf: {
            error: 86,
            additionalMembers: [
                'sampling_location_avv',
                'sampling_location_text'
            ]
        }
    },

    sampling_location_text: {
        atLeastOneOf: {
            error: 86,
            additionalMembers: [
                'sampling_location_avv',
                'sampling_location_zip'
            ]
        }
    },

    primary_production_avv: {
        matchesZoMo: {
            error: 118,
            date: 'sampling_date',
            zomoKey: '316',
            codeType: 'basic',
            programField: {
                attr: 'program_avv',
                zomoKey: '328'
            }
        }
    },

    control_program_avv: {},

    program_reason_text: {},

    program_avv: {}
};

// only for not ZoMo samples
export const standardConstraints: ValidationConstraints = {
    sample_id: {
        atLeastOneOf: {
            error: 69,
            additionalMembers: ['sample_id_avv']
        },

        presence: {
            error: 68,
            allowEmpty: false
        }
    },

    sample_id_avv: {
        atLeastOneOf: {
            error: 69,
            additionalMembers: ['sample_id']
        }
    },

    sampling_date: {
        atLeastOneOf: {
            error: 19,
            additionalMembers: ['isolation_date']
        }
    },

    isolation_date: {
        atLeastOneOf: {
            error: 19,
            additionalMembers: ['sampling_date']
        },

        presenceNotZoMo: {
            error: 15
        }
    },

    animal_avv: {
        atLeastOneOf: {
            error: 37,
            additionalMembers: ['matrix_avv', 'animal_matrix_text']
        }
    },

    matrix_avv: {
        atLeastOneOf: {
            error: 37,
            additionalMembers: ['animal_matrix_text', 'animal_avv']
        }
    },

    animal_matrix_text: {
        atLeastOneOf: {
            error: 37,
            additionalMembers: ['matrix_avv', 'animal_avv']
        }
    },

    control_program_avv: {},

    program_reason_text: {}
};

// for both samples: ZoMo and not ZoMo
export const baseConstraints: ValidationConstraints = {
    sample_id: {},

    sample_id_avv: {
        matchesIdToSpecificYear: {
            error: 72,
            regex: []
        }
    },

    partial_sample_id: {
        matchesRegexPattern: {
            error: 102,
            regex: ['^\\d+$'],
            ignoreNumbers: false
        }
    },

    pathogen_avv: {
        presence: {
            error: 10,
            allowEmpty: false
        },

        matchAVVCodeOrString: {
            error: 8,
            catalog: 'avv324',
            alternateKey: 'Text'
        },

        inAVVCatalog: {
            error: 98,
            catalog: 'avv324'
        },

        nrlExists: {
            error: 96
        }
    },

    sequence_id: {
        notEmptyIfOtherExists: {
            error: 124,
            other: 'sequence_status'
        }
    },

    sequence_status: {
        hasCorrectSequenceStatusValues: {
            error: 123
        }
    },

    sampling_date: {
        presenceZoMo: {
            error: 14
        },

        presenceNotZoMo: {
            error: 11
        },

        dateAllowEmpty: {
            error: 12
        },

        futureDate: {
            error: 13,
            latest: 'NOW'
        },

        referenceDate: {
            error: 20,
            latest: 'isolation_date'
        },

        timeBetween: {
            error: 61,
            earliest: 'isolation_date',
            modifier: {
                value: 1,
                unit: 'year'
            }
        },

        oldSample: {
            error: 62,
            earliest: 'NOW',
            modifier: {
                value: 10,
                unit: 'year'
            }
        }
    },

    isolation_date: {
        presenceZoMo: {
            error: 18
        },

        dateAllowEmpty: {
            error: 16
        },

        futureDate: {
            error: 17,
            latest: 'NOW'
        },

        referenceDate: {
            error: 20,
            earliest: 'sampling_date'
        },

        timeBetween: {
            error: 61,
            latest: 'sampling_date',
            modifier: {
                value: 1,
                unit: 'year'
            }
        },

        oldSample: {
            error: 63,
            earliest: 'NOW',
            modifier: {
                value: 10,
                unit: 'year'
            }
        }
    },

    sampling_location_avv: {
        atLeastOneOf: {
            error: 64,
            additionalMembers: [
                'sampling_location_zip',
                'sampling_location_text'
            ]
        },

        inAVVCatalog: {
            error: 24,
            catalog: 'avv313'
        }
    },

    sampling_location_zip: {
        atLeastOneOf: {
            error: 64,
            additionalMembers: [
                'sampling_location_avv',
                'sampling_location_text'
            ]
        },

        dependentFields: {
            error: 28,
            dependents: ['sampling_location_text']
        },

        requiredIfOther: {
            error: 25,
            field: 'sampling_location_text',
            regex: '\\S'
        },

        length: {
            error: 27,
            is: 5,
            tokenizer: function (value: string) {
                // Necessary to deal with empty strings
                return value ? value : 'XXXXX';
            }
        },

        inPLZCatalog: {
            error: 75
        }
    },

    sampling_location_text: {
        atLeastOneOf: {
            error: 64,
            additionalMembers: [
                'sampling_location_avv',
                'sampling_location_zip'
            ]
        },

        dependentFields: {
            error: 25,
            dependents: ['sampling_location_zip']
        },

        requiredIfOther: {
            error: 28,
            field: 'sampling_location_zip',
            regex: '\\S'
        }
    },

    animal_avv: {
        inAVVFacettenCatalog: {
            error: 99,
            catalog: 'avv339'
        },

        isHierarchyCode: {
            error: 110,
            catalog: 'avv339'
        },

        multipleFacettenAllowed: {
            error: 109,
            catalog: 'avv339'
        }
    },

    matrix_avv: {
        inAVVFacettenCatalog: {
            error: 33,
            catalog: 'avv319'
        },

        hasObligatoryFacettenValues: {
            error: 112,
            catalog: 'avv319'
        },

        isHierarchyCode: {
            error: 110,
            catalog: 'avv319'
        },

        multipleFacettenAllowed: {
            error: 109,
            catalog: 'avv319'
        }
    },

    animal_matrix_text: {},

    primary_production_avv: {
        inAVVCatalog: {
            error: 100,
            catalog: 'avv316'
        }
    },

    control_program_avv: {
        atLeastOneOf: {
            error: 44,
            additionalMembers: ['sampling_reason_avv', 'program_reason_text']
        },

        inAVVCatalog: {
            error: 42,
            catalog: 'avv322'
        }
    },

    sampling_reason_avv: {
        atLeastOneOf: {
            error: 44,
            additionalMembers: ['control_program_avv', 'program_reason_text']
        },

        inAVVCatalog: {
            error: 101,
            catalog: 'avv326'
        },

        noPlanprobeForNRL_AR: {
            error: 95
        },

        isHierarchyCode: {
            error: 111,
            catalog: 'avv326'
        }
    },

    program_reason_text: {
        atLeastOneOf: {
            error: 44,
            additionalMembers: ['control_program_avv', 'sampling_reason_avv']
        }
    },

    operations_mode_avv: {
        atLeastOneOf: {
            error: 71,
            additionalMembers: ['operations_mode_text']
        },

        inAVVFacettenCatalog: {
            error: 46,
            catalog: 'avv303'
        },

        multipleFacettenAllowed: {
            error: 109,
            catalog: 'avv303'
        }
    },

    operations_mode_text: {
        atLeastOneOf: {
            error: 71,
            additionalMembers: ['operations_mode_avv']
        }
    },

    vvvo: {},

    program_avv: {
        inAVVCatalog: {
            error: 104,
            catalog: 'avv328'
        },

        presenceZoMo: {
            error: 105
        },

        matchesProgramZoMo: {
            error: 119,
            date: 'sampling_date',
            zomoKey: '328'
        }
    },

    comment: {}
};

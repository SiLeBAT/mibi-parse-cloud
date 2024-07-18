import { ValidationConstraints } from './legacy.model';

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
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    pathogen_text: {
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    sampling_date: {
        presence: {
            error: 14,
            allowEmpty: false
        }

        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

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
        }

        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    matrix_avv: {
        atLeastOneOf: {
            error: 34,
            additionalMembers: ['animal_avv']
        }

        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    operations_mode_avv: {
        atLeastOneOf: {
            error: 48,
            additionalMembers: ['operations_mode_text']
        }

        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
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
        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    control_program_avv: {
        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    program_reason_text: {
        // new text
        // registeredZoMo: {
        //     error: 49,
        //     group: [
        //         {
        //             attr: 'operations_mode_avv',
        //             code: 'ADV8-Kode'
        //         },
        //         {
        //             attr: 'matrix_avv',
        //             code: 'ADV3-Kode'
        //         },
        //         {
        //             attr: 'animal_avv',
        //             code: 'Kodiersystem'
        //         },
        //         {
        //             attr: 'pathogen_avv',
        //             code: 'ADV16-Kode'
        //         }
        //     ],
        //     year: ['sampling_date', 'isolation_date'],
        //     catalog: 'adv16'
        // }
    },

    program_avv: {
        presence: {
            error: 105,
            allowEmpty: false
        }
    }
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

    control_program_avv: {
        shouldBeZoMo: {
            error: 97,
            group: [
                {
                    attr: 'operations_mode_avv',
                    code: 'ADV8-Kode'
                },
                {
                    attr: 'matrix_avv',
                    code: 'ADV3-Kode'
                },
                {
                    attr: 'animal_avv',
                    code: 'Kodiersystem'
                },
                {
                    attr: 'pathogen_avv',
                    code: 'ADV16-Kode'
                }
            ],
            year: ['sampling_date', 'isolation_date'],
            catalog: 'adv16'
        }
    },

    program_reason_text: {
        shouldBeZoMo: {
            error: 97,
            group: [
                {
                    attr: 'operations_mode_avv',
                    code: 'ADV8-Kode'
                },
                {
                    attr: 'matrix_avv',
                    code: 'ADV3-Kode'
                },
                {
                    attr: 'animal_avv',
                    code: 'Kodiersystem'
                },
                {
                    attr: 'pathogen_avv',
                    code: 'ADV16-Kode'
                }
            ],
            year: ['sampling_date', 'isolation_date'],
            catalog: 'adv16'
        }
    }
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

    sampling_date: {
        presence: {
            error: 11,
            allowEmpty: false
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
        presence: {
            error: 15,
            allowEmpty: false
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

        inCatalog: {
            error: 75,
            catalog: 'plz'
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
        }
    },

    comment: {}
};

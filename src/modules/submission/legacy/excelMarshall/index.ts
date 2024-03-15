import { FileInformation } from '../../domain/file-information.vo';
import { NRLId } from '../../domain/nrl-id.vo';
import { SampleEntry, Submission } from '../../domain';
import { SampleEntryTuple } from '../../domain/sample-entry.entity';
import { ObjectKeys } from './../../infrastructure/parse-types';
import { JSONMarshalService } from './application/json-marshal.service';
import { SampleSheetService } from './application/sample-sheet.service';
import { SampleService } from './application/sample.service';
import { Sample, Urgency } from './model/legacy.model';
import { nrlRepository } from './repositories/nrl.repository';

class ExcelMarshallAntiCorruptionLayer {
    constructor(private sampleService: SampleService) {}

    async convertToExcel(
        submission: Submission<SampleEntry<SampleEntryTuple>[]>
    ): Promise<FileInformation> {
        const props = await this.sampleService.convertToExcel({
            samples: submission.sampleEntryCollection.map(
                (entry: SampleEntry<SampleEntryTuple>) => {
                    const data = {
                        sample_id: {
                            value: entry.data.sample_id.value,
                            oldValue: entry.data.sample_id.oldValue
                        },
                        sample_id_avv: {
                            value: entry.data.sample_id_avv.value,
                            oldValue: entry.data.sample_id_avv.oldValue
                        },
                        partial_sample_id: {
                            value: entry.data.partial_sample_id.value,
                            oldValue: entry.data.partial_sample_id.oldValue
                        },
                        pathogen_avv: {
                            value: entry.data.pathogen_avv.value,
                            oldValue: entry.data.pathogen_avv.oldValue
                        },
                        pathogen_text: {
                            value: entry.data.pathogen_text.value,
                            oldValue: entry.data.pathogen_text.oldValue
                        },
                        sampling_date: {
                            value: entry.data.sampling_date.value,
                            oldValue: entry.data.sampling_date.oldValue
                        },
                        isolation_date: {
                            value: entry.data.isolation_date.value,
                            oldValue: entry.data.isolation_date.oldValue
                        },
                        sampling_location_avv: {
                            value: entry.data.sampling_location_avv.value,
                            oldValue: entry.data.sampling_location_avv.oldValue
                        },
                        sampling_location_zip: {
                            value: entry.data.sampling_location_zip.value,
                            oldValue: entry.data.sampling_location_zip.oldValue
                        },
                        sampling_location_text: {
                            value: entry.data.sampling_location_text.value,
                            oldValue: entry.data.sampling_location_text.oldValue
                        },
                        animal_avv: {
                            value: entry.data.animal_avv.value,
                            oldValue: entry.data.animal_avv.oldValue
                        },
                        matrix_avv: {
                            value: entry.data.matrix_avv.value,
                            oldValue: entry.data.matrix_avv.oldValue
                        },
                        animal_matrix_text: {
                            value: entry.data.animal_matrix_text.value,
                            oldValue: entry.data.animal_matrix_text.oldValue
                        },
                        primary_production_avv: {
                            value: entry.data.primary_production_avv.value,
                            oldValue: entry.data.primary_production_avv.oldValue
                        },
                        control_program_avv: {
                            value: entry.data.control_program_avv.value,
                            oldValue: entry.data.control_program_avv.oldValue
                        },
                        sampling_reason_avv: {
                            value: entry.data.sampling_reason_avv.value,
                            oldValue: entry.data.sampling_reason_avv.oldValue
                        },
                        program_reason_text: {
                            value: entry.data.program_reason_text.value,
                            oldValue: entry.data.program_reason_text.oldValue
                        },
                        operations_mode_avv: {
                            value: entry.data.operations_mode_avv.value,
                            oldValue: entry.data.operations_mode_avv.oldValue
                        },
                        operations_mode_text: {
                            value: entry.data.operations_mode_text.value,
                            oldValue: entry.data.operations_mode_text.oldValue
                        },
                        vvvo: {
                            value: entry.data.vvvo.value,
                            oldValue: entry.data.vvvo.oldValue
                        },
                        program_avv: {
                            value: entry.data.program_avv.value,
                            oldValue: entry.data.program_avv.oldValue
                        },
                        comment: {
                            value: entry.data.comment.value,
                            oldValue: entry.data.comment.oldValue
                        }
                    };
                    const meta = {
                        nrl: NRLId.create(entry.data.nrl).value,
                        urgency: this.fromUrgencyStringToEnum(
                            entry.data.urgency
                        ),
                        analysis: entry.data.analysis
                    };
                    return Sample.create(data, meta);
                }
            ),
            meta: {
                sender: {
                    ...submission.contact.props
                },
                fileName: submission.fileName,
                customerRefNumber: submission.customerRefNumber,
                signatureDate: submission.signatureDate,
                version: submission.version
            }
        });
        return FileInformation.create(props);
    }
    private fromUrgencyStringToEnum(urgency: string): Urgency {
        switch (urgency.trim().toLowerCase()) {
            case 'eilt':
                return Urgency.URGENT;
            case 'normal':
            default:
                return Urgency.NORMAL;
        }
    }
}

const fileRepository = {
    getFileBuffer: async (key: string) => {
        const query = new Parse.Query(ObjectKeys.TEMPLATE_FILE);
        query.equalTo('key', key.toUpperCase());
        const templateFileObject = await query.first();
        if (!templateFileObject) {
            throw Error("Can't find template file with key: " + key);
        }
        const file = await templateFileObject.get('templateFile');
        const buff = await Buffer.from(await file.getData(), 'base64');
        return buff;
    }
};
const sampleSheetService = new SampleSheetService(nrlRepository);
const jSONMarshalService = new JSONMarshalService(fileRepository);
const sampleService = new SampleService(jSONMarshalService, sampleSheetService);
const excelMarshallAntiCorruptionLayer = new ExcelMarshallAntiCorruptionLayer(
    sampleService
);

export { excelMarshallAntiCorruptionLayer };

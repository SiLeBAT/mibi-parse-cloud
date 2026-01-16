import { getServerConfig } from '../../../shared/use-cases/get-server-config';
import { Order, SampleEntryTuple } from '../../domain';
import { SampleEntry } from '../../domain/sample-entry.entity';
import { UseCase } from '../../../shared/use-cases';

export type ExcelVersionCheck = {
    uploadedExcelVersion: string;
    valid: boolean;
};
class CheckExcelVersionUseCase
    implements
        UseCase<Order<SampleEntry<SampleEntryTuple>[]>, ExcelVersionCheck>
{
    constructor() {}

    async execute(
        order: Order<SampleEntry<SampleEntryTuple>[]>
    ): Promise<ExcelVersionCheck> {
        const config = await getServerConfig.execute();
        const validExcelVersion = config.excelVersion;
        const uploadedExcelVersion = order.submissionFormInfo?.version || '';

        const isValid =
            Array.isArray(validExcelVersion) &&
            validExcelVersion.includes(uploadedExcelVersion);

        return {
            uploadedExcelVersion,
            valid: isValid
        };
    }
}

const checkExcelVersionUseCase = new CheckExcelVersionUseCase();

export { checkExcelVersionUseCase };

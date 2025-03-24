import path from 'path';
import { UseCase } from '../../../shared/use-cases';
import { FileContent, FileContentType } from '../../domain';
import { UnsupportedFileTypeError } from './read-file-content.error';

class ReadFileContentUseCase implements UseCase<Parse.File, FileContent> {
    constructor() {}

    async execute(file: Parse.File): Promise<FileContent> {
        const fileContent = await FileContent.create({
            content: await this.getContentAsString(file),
            type: this.determineContentType(file)
        });

        return fileContent;
    }

    private async getContentAsString(file: Parse.File) {
        const base64 = await file.getData();
        return this.fromBase64ToUTF8(base64);
    }
    private fromBase64ToUTF8(base64: string): string {
        const buff = Buffer.from(base64, 'base64');
        return buff.toString('utf-8');
    }

    private determineContentType(file: Parse.File): FileContentType {
        const ext = path.extname(file.url());

        console.log(
            'ReadFileContentUseCase, before_zomo_plan_save_hook.ts,  determineContentType, ext: ',
            ext
        );

        switch (ext) {
            case '.json':
                return FileContentType.JSON;
            case '.xml':
                return FileContentType.XML;
            case '.csv':
                return FileContentType.CSV;
            default:
                throw new UnsupportedFileTypeError(
                    'Unsupported file type',
                    new Error()
                );
        }
    }
}

const readFileContent = new ReadFileContentUseCase();

export { readFileContent };

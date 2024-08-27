import fs from 'fs';
import path from 'path';

async function loadBinaryFile(
    fileName: string,
    dataDir: string
): Promise<Buffer> {
    console.log(
        `Loading data from Filesystem. fileName=${fileName} dataDir=${dataDir}`
    );
    const filePath = resolveFilePath(fileName, dataDir);
    return importBinaryFile(filePath);
}

async function loadJSONFile(
    fileName: string,
    dataDir: string
): Promise<unknown> {
    console.log(
        `Loading data from Filesystem. fileName=${fileName} dataDir=${dataDir}`
    );
    const filePath = resolveFilePath(fileName, dataDir);
    return importJSONFile(filePath);
}

async function importJSONFile(filePath: string): Promise<unknown> {
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
                reject(err);
            } else {
                const jsonContent = JSON.parse(data);
                resolve(jsonContent);
            }
        });
    });
}

// tslint:disable-next-line: no-any
async function importBinaryFile(filePath: string): Promise<Buffer> {
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function resolveFilePath(fileName: string, dataDir: string) {
    const filePath = path.join(dataDir, fileName);
    if (fs.existsSync(filePath)) {
        return filePath;
    } else {
        throw new Error(`File not found. fileName=${fileName}`);
    }
}

export { loadBinaryFile, loadJSONFile };

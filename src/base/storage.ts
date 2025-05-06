import fs from 'fs';
import path from 'path';

const userDataPath = '.';
const saveDir = path.join(userDataPath, 'save');
const storageFilePath = path.join(saveDir, 'storage.json');

class Storage {
    data = this._loadData();

    constructor() {
        this._ensureDirExists();
    }

    _ensureDirExists() {
        try {
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
        } catch (error) {
            console.error('Error creating save directory:', error);
        }
    }

    _loadData(): Record<string, unknown> {
        try {
            if (fs.existsSync(storageFilePath)) {
                const fileContent = fs.readFileSync(storageFilePath, 'utf-8');
                return JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading storage file:', error);
        }

        return {};
    }

    _saveData() {
        try {
            const dataString = JSON.stringify(this.data, null, 2);
            fs.writeFileSync(storageFilePath, dataString, 'utf-8');
        } catch (error) {
            console.error('Error writing storage file:', error);
        }
    }

    read<T>(section: string, key: string, defaultValue: T): T {
        const fullKey = section + '.' + key;
        if (fullKey in this.data) {
            return this.data[fullKey] as T;
        } else {
            return defaultValue;
        }
    }

    write<T>(section: string, key: string, value: T) {
        const fullKey = section + '.' + key;
        this.data[fullKey] = value;
        this._saveData();
    }
}

export const storage = new Storage();

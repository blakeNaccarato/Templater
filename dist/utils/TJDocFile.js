import { TFile } from 'obsidian';
export class TJDocFile extends TFile {
    constructor(file) {
        super(file.vault, file.path);
        Object.assign(this, file);
    }
}
export class TJDocFileArgument {
    constructor(name, desc) {
        this.name = name;
        this.description = desc;
    }
}

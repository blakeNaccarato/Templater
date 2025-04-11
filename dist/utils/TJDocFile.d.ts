import { TFile } from 'obsidian';
export declare class TJDocFile extends TFile {
    description: string;
    returns: string;
    arguments: TJDocFileArgument[];
    constructor(file: TFile);
}
export declare class TJDocFileArgument {
    name: string;
    description: string;
    constructor(name: string, desc: string);
}

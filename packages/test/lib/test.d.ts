import {Test as Supertape} from 'supertape';

export type Test = Supertape & {
    report: (fileName: string, message: string) => void,
    transform: (fileName: string) => void,
    end: () => void,
}


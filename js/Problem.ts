import { LAYOUT_CONFIG } from './problemConfig.js';

export interface ProblemData {
    moduleType: string;
    type: string;
    weight: number;
    span: number;
    [key: string]: any;
}

export abstract class Problem {
    data: ProblemData;
    weight: number;
    span: number;
    type: string;

    constructor(data: ProblemData) {
        this.data = data;
        const config = (LAYOUT_CONFIG as any)[data.moduleType] || (LAYOUT_CONFIG as any)['default'];
        this.weight = data.weight || config.weight;
        this.span = data.span || config.span;
        this.type = data.moduleType;
    }

    abstract render(target: HTMLElement, isSolution: boolean, lang: string): void;
}

export class ProblemFactory {
    static registry: Record<string, any> = {};

    static register(type: string, problemClass: any) {
        this.registry[type] = problemClass;
    }

    static create(data: ProblemData): Problem {
        const problemClass = this.registry[data.moduleType] || this.registry['default'];
        if (problemClass) {
            return new problemClass(data);
        }
        throw new Error(`No problem class registered for type: ${data.moduleType}`);
    }

    static generate(type: string, options: any, lang: string): ProblemData | null {
        const problemClass = this.registry[type] || this.registry['default'];
        if (problemClass && problemClass.generate) {
            const data = problemClass.generate(type, options, lang);
            if (!data) return null;
            const config = (LAYOUT_CONFIG as any)[type] || (LAYOUT_CONFIG as any)['default'];
            return {
                ...data,
                moduleType: type,
                type: data.type || type,
                weight: config.weight,
                span: config.span
            };
        }
        return null;
    }
}

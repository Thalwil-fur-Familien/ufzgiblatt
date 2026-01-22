import { LAYOUT_CONFIG } from './problemConfig.js';

export class Problem {
    constructor(data) {
        this.data = data;
        const config = LAYOUT_CONFIG[data.moduleType] || LAYOUT_CONFIG['default'];
        this.weight = data.weight || config.weight;
        this.span = data.span || config.span;
        this.type = data.moduleType;
    }

    /**
     * Renders the problem into the target element.
     * @param {HTMLElement} target - The boundary element to render into.
     * @param {boolean} isSolution - Whether to render the solution.
     * @param {string} lang - Current language.
     */
    render(target, isSolution, lang) {
        throw new Error('Not implemented');
    }

    /**
     * Static method to generate problem data.
     */
    static generate(options, lang) {
        throw new Error('Not implemented');
    }
}

export class ProblemFactory {
    static registry = {};

    static register(type, problemClass) {
        this.registry[type] = problemClass;
    }

    static create(data) {
        const problemClass = this.registry[data.moduleType] || this.registry['default'];
        if (problemClass) {
            return new problemClass(data);
        }
        return new Problem(data);
    }

    static generate(type, options, lang) {
        const problemClass = this.registry[type] || this.registry['default'];
        if (problemClass && problemClass.generate) {
            const data = problemClass.generate(options, lang);
            const config = LAYOUT_CONFIG[type] || LAYOUT_CONFIG['default'];
            return {
                ...data,
                moduleType: type,
                weight: config.weight,
                span: config.span
            };
        }
        return null;
    }
}

import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt, gcd } from '../mathUtils.js';

export interface FractionData extends ProblemData {
    num?: number;
    den?: number;
    numA?: number;
    denA?: number;
    numB?: number;
    denB?: number;
    op?: string;
    answer: string;
}

export interface RoundingData extends ProblemData {
    val: number;
    place: number;
    answer: number;
}

export class FractionProblem extends Problem {
    declare data: FractionData;

    constructor(data: FractionData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { answer } = this.data;
        const valAns = isSolution ? answer : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        if (this.data.type === 'fraction_simplify') {
            const { num, den } = this.data;
            target.innerHTML = `
                <div class="fraction">
                    <span class="fraction-top">${num}</span>
                    <span class="fraction-bottom">${den}</span>
                </div>
                <span class="equals">=</span>
                <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>`;
        } else if (this.data.type === 'fraction_op') {
            const { numA, denA, numB, denB, op } = this.data;
            target.innerHTML = `
                <div class="fraction">
                    <span class="fraction-top">${numA}</span>
                    <span class="fraction-bottom">${denA}</span>
                </div>
                <span class="operator">${op}</span>
                <div class="fraction">
                    <span class="fraction-top">${numB}</span>
                    <span class="fraction-bottom">${denB}</span>
                </div>
               <span class="equals">=</span>
               <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>`;
        }
    }

    static generate(type: string, _options: any, _lang: string): Partial<FractionData> | undefined {
        if (type === 'frac_simplify') {
            let num = getRandomInt(1, 10);
            let den = getRandomInt(num + 1, 20);
            let factor = getRandomInt(2, 6);
            let a = num * factor;
            let b = den * factor;
            const common = gcd(a, b);
            const simpleNum = a / common;
            const simpleDen = b / common;
            return { type: 'fraction_simplify', num: a, den: b, answer: `${simpleNum}/${simpleDen}` };
        } else if (type === 'frac_add') {
            let den = getRandomInt(2, 12);
            let numA = getRandomInt(1, den - 1);
            let numB = getRandomInt(1, den - numA);
            return { type: 'fraction_op', numA, denA: den, numB, denB: den, op: '+', answer: `${numA + numB}/${den}` };
        }
        return undefined;
    }
}

export class RoundingProblem extends Problem {
    declare data: RoundingData;

    constructor(data: RoundingData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { val, place, answer } = this.data;
        const valAns = isSolution ? answer : '';
        const uiT = ((window as any).TRANSLATIONS || {});
        const currentLang = ((window as any).lang || 'de');
        const labelTemplate = uiT[currentLang]?.ui?.roundingLabel || 'Round {val} to the nearest {place}:';

        target.style.flexDirection = 'column';
        target.innerHTML = `
             <div style="margin-bottom:5px;">${labelTemplate.replace('{val}', val.toString()).replace('{place}', place.toString())}</div>
             <input type="number" class="answer-input" style="width:80px;" 
                    data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>`;
    }

    static generate(_type: string, _options: any, _lang: string): Partial<RoundingData> {
        let val = getRandomInt(1000, 99999);
        let place = [10, 100, 1000][getRandomInt(0, 2)];
        return { type: 'rounding', val, place, answer: Math.round(val / place) * place };
    }
}

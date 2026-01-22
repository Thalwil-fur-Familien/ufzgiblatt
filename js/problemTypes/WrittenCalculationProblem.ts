import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt } from '../mathUtils.js';

export interface WrittenData extends ProblemData {
    a: number;
    b: number;
    op: string;
    answer: number;
}

export class WrittenCalculationProblem extends Problem {
    declare data: WrittenData;

    constructor(data: WrittenData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { a, b, op, answer } = this.data;
        if (this.data.type === 'written') {
            target.innerHTML = this.renderWrittenArithmetic(a, b, op, isSolution ? answer : undefined);
        } else if (this.data.type === 'long_calculation') {
            if (op === '×') {
                target.innerHTML = this.renderWrittenMultiplication(a, b, isSolution ? answer : undefined);
            } else {
                target.innerHTML = this.renderWrittenDivision(a, b, isSolution ? answer : undefined);
            }
        }
    }

    renderWrittenArithmetic(a: number, b: number, op: string, answer?: number): string {
        const sA = a.toString();
        const sB = b.toString();
        const maxLen = Math.max(sA.length, sB.length) + 1;
        const sAns = answer !== undefined ? answer.toString() : '';

        return `
            <div class="written-vertical">
                <div class="written-row">${sA.padStart(maxLen, ' ')}</div>
                <div class="written-row">${op}${sB.padStart(maxLen - 1, ' ')}</div>
                <div class="written-line"></div>
                <div class="written-row"><strong>${answer !== undefined ? sAns.padStart(maxLen, ' ') : ''}</strong></div>
            </div>`;
    }

    renderWrittenMultiplication(a: number, b: number, answer?: number): string {
        const sA = a.toString();
        const sB = b.toString();
        let html = `<div class="written-vertical" style="align-items: flex-end;">
            <div class="written-row" style="border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 5px;">${sA} × ${sB}</div>`;

        if (answer !== undefined) {
            for (let i = 0; i < sB.length; i++) {
                const digit = parseInt(sB[i]);
                const partial = a * digit;
                const paddingRight = sB.length - 1 - i;
                html += `<div class="written-row" style="padding-right: ${paddingRight}ch;">${partial}</div>`;
            }
            html += `<div class="written-line"></div>
                <div class="written-row"><strong>${answer}</strong></div>`;
        }
        html += `</div>`;
        return html;
    }

    renderWrittenDivision(a: number, divisor: number, quotient?: number): string {
        const sA = a.toString();
        const sAns = quotient !== undefined ? quotient.toString() : '';

        let html = `<div class="written-vertical" style="align-items: flex-start; font-size:1.1rem; font-family:'Courier New', monospace; line-height: 1.2;">
            <div class="written-row" style="justify-content: flex-start; letter-spacing: 2px;">${sA} : ${divisor} = ${sAns}</div>`;

        if (quotient !== undefined) {
            let dividendIndex = 0;
            let currentVal = 0;
            for (let i = 0; i < sAns.length; i++) {
                const qDigit = parseInt(sAns[i]);
                if (i === 0) {
                    let firstValStr = "";
                    while (dividendIndex < sA.length) {
                        firstValStr += sA[dividendIndex];
                        dividendIndex++;
                        if (parseInt(firstValStr) >= divisor) break;
                    }
                    currentVal = parseInt(firstValStr);
                } else if (dividendIndex < sA.length) {
                    const nextDigitStr = sA[dividendIndex];
                    currentVal = parseInt(currentVal.toString() + nextDigitStr);
                    dividendIndex++;
                }

                const subtrahend = qDigit * divisor;
                const remainder = currentVal - subtrahend;
                const subStr = subtrahend.toString();
                const subPadding = (dividendIndex - 1) - (subStr.length - 1);
                html += `<div class="written-row" style="justify-content: flex-start; padding-left: ${subPadding}ch; border-bottom: 1px solid #000; width: fit-content;">-${subStr}</div>`;

                if (dividendIndex < sA.length) {
                    const nextDigitChar = sA[dividendIndex];
                    const nextValToDisplay = remainder.toString() + nextDigitChar;
                    const remPadding = dividendIndex - (nextValToDisplay.length - 1);
                    html += `<div class="written-row" style="justify-content: flex-start; padding-left: ${remPadding}ch;">${nextValToDisplay}</div>`;
                    currentVal = remainder;
                } else {
                    const remStr = remainder.toString();
                    const remPadding = (dividendIndex - 1) - (remStr.length - 1);
                    html += `<div class="written-row" style="justify-content: flex-start; padding-left: ${remPadding}ch;">${remStr}</div>`;
                }
            }
        }
        html += `</div>`;
        return html;
    }

    static generate(type: string, _options: any, _lang: string): Partial<WrittenData> | undefined {
        if (type === 'add_written') {
            let a = getRandomInt(1000, 99999);
            let b = getRandomInt(1000, 99999);
            return { type: 'written', a, b, op: '+', answer: a + b };
        } else if (type === 'sub_written') {
            let a = getRandomInt(5000, 99999);
            let b = getRandomInt(1000, a - 1);
            return { type: 'written', a, b, op: '-', answer: a - b };
        } else if (type === 'mult_large') {
            let a = getRandomInt(100, 999);
            let b = getRandomInt(11, 99);
            return { type: 'long_calculation', a, b, op: '×', answer: a * b };
        } else if (type === 'div_long') {
            let divisor = getRandomInt(2, 9);
            let result = getRandomInt(100, 999);
            let a = result * divisor;
            return { type: 'long_calculation', a, b: divisor, op: ':', answer: result };
        }
        return undefined;
    }
}

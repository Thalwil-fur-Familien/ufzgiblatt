import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt } from '../mathUtils.js';

export interface ArithmeticData extends ProblemData {
    a: number;
    b: number;
    op: string;
    answer: number;
    hasGrid?: boolean;
}

export class ArithmeticProblem extends Problem {
    declare data: ArithmeticData;

    constructor(data: ArithmeticData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { a, b, op, answer } = this.data;
        const valAns = isSolution ? answer : '';
        const span = this.span;

        target.style.display = 'flex';
        target.style.alignItems = 'center';
        target.style.justifyContent = 'center';
        target.style.gap = span <= 3 ? '8px' : '15px';
        const inputWidth = span <= 3 ? '50px' : '65px';

        target.innerHTML = `
            <span class="number">${a}</span>
            <span class="operator">${op}</span>
            <span class="number">${b}</span>
            <span class="equals">=</span>
            <input type="number" class="answer-input" style="width:${inputWidth}; text-align:center;" 
                data-expected="${answer}" value="${valAns}" 
                oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
        `;

        if (this.data.hasGrid) {
            target.style.flexDirection = 'column';
            target.style.alignItems = 'flex-start';
            const gridDiv = document.createElement('div');
            gridDiv.className = 'squared-grid';
            target.appendChild(gridDiv);
        }
    }

    static generate(type: string, _options: any, _lang: string): Partial<ArithmeticData> {
        let a: number = 0;
        let b: number = 0;
        let op: string = '';
        let res: Partial<ArithmeticData> = { type: 'standard' };

        switch (type) {
            case 'add_10':
                a = getRandomInt(0, 9);
                b = getRandomInt(1, 10 - a);
                op = '+';
                break;
            case 'sub_10':
                a = getRandomInt(1, 10);
                b = getRandomInt(1, a);
                op = '-';
                break;
            case 'add_20_simple':
                a = getRandomInt(10, 22);
                b = getRandomInt(1, 23 - a);
                op = '+';
                break;
            case 'sub_20_simple':
                a = getRandomInt(11, 24);
                b = getRandomInt(1, a - 10);
                op = '-';
                break;
            case 'add_20':
                a = getRandomInt(1, 23);
                b = getRandomInt(1, 24 - a);
                op = '+';
                break;
            case 'sub_20':
                a = getRandomInt(1, 24);
                b = getRandomInt(1, a);
                op = '-';
                break;
            case 'add_100_simple':
                a = getRandomInt(1, 89);
                {
                    let a_ones = a % 10;
                    b = getRandomInt(1, 99 - a);
                    while ((b % 10) + a_ones >= 10) {
                        b = getRandomInt(1, 99 - a);
                    }
                }
                op = '+';
                break;
            case 'add_100_carry':
                do {
                    a = getRandomInt(10, 89);
                    b = getRandomInt(1, 99 - a);
                } while ((a % 10) + (b % 10) < 10);
                op = '+';
                break;
            case 'sub_100_simple':
                a = getRandomInt(10, 99);
                {
                    let max_b_ones = a % 10;
                    let max_b_tens = Math.floor(a / 10);
                    let b_tens = getRandomInt(0, max_b_tens);
                    let b_ones = getRandomInt(0, max_b_ones);
                    b = b_tens * 10 + b_ones;
                    if (b === 0) b = 1;
                }
                op = '-';
                break;
            case 'sub_100_carry':
                do {
                    a = getRandomInt(20, 99);
                    b = getRandomInt(1, a - 1);
                } while ((a % 10) >= (b % 10));
                op = '-';
                break;
            case 'mult_2_5_10':
                b = [2, 5, 10][getRandomInt(0, 2)];
                a = getRandomInt(1, 10);
                op = '×';
                break;
            case 'mult_all':
                a = getRandomInt(1, 10);
                b = getRandomInt(1, 10);
                op = '×';
                break;
            case 'div_2_5_10':
                {
                    let divisor = [2, 5, 10][getRandomInt(0, 2)];
                    let result = getRandomInt(1, 10);
                    a = result * divisor;
                    b = divisor;
                }
                op = ':';
                break;
            case 'add_1000':
                a = getRandomInt(100, 899);
                b = getRandomInt(1, 999 - a);
                op = '+';
                res.hasGrid = true;
                break;
            case 'sub_1000':
                a = getRandomInt(100, 999);
                b = getRandomInt(1, a - 1);
                op = '-';
                res.hasGrid = true;
                break;
            case 'mult_advanced':
                a = getRandomInt(11, 20);
                b = getRandomInt(2, 6);
                op = '×';
                break;
            case 'div_100':
                {
                    let divisor = getRandomInt(2, 9);
                    let result = getRandomInt(2, 10);
                    a = result * divisor;
                    b = divisor;
                }
                op = ':';
                break;
            case 'dec_add':
                {
                    let numA = getRandomInt(100, 9999) / 100;
                    let numB = getRandomInt(100, 9999) / 100;
                    a = numA; b = numB; op = '+';
                    res.answer = parseFloat((numA + numB).toFixed(2));
                }
                break;
            case 'dec_sub':
                {
                    let numA = getRandomInt(500, 9999) / 100;
                    let numB = getRandomInt(100, 499) / 100;
                    a = numA; b = numB; op = '-';
                    res.answer = parseFloat((numA - numB).toFixed(2));
                }
                break;
            case 'mult_10_100':
                {
                    a = (getRandomInt(10, 9999) / 100);
                    b = [10, 100, 1000][getRandomInt(0, 2)];
                    op = '×';
                    res.answer = Math.round((a * b) * 1000) / 1000;
                }
                break;
        }

        res.a = a;
        res.b = b;
        res.op = op;
        if (res.answer === undefined) {
            if (op === '+') res.answer = a + b;
            else if (op === '-') res.answer = a - b;
            else if (op === '×') res.answer = a * b;
            else if (op === ':') res.answer = a / b;
        }
        return res;
    }
}

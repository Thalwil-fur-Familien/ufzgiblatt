import { Problem } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export class SpecialArithmeticProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const span = this.span;
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        if (this.data.type === 'missing_addend' || this.data.type === 'married_numbers') {
            const { a, sum, op, answer } = this.data;
            const val = isSolution ? answer : '';
            const gapSize = span <= 3 ? '5px' : '15px';
            const inputWidth = span <= 3 ? '50px' : '70px';

            target.style.display = 'flex';
            target.style.alignItems = 'center';
            target.style.justifyContent = 'center';
            target.style.gap = gapSize;

            target.innerHTML = `
                <span class="number" style="text-align:right; width:auto;">${a}</span>
                <span class="operator" style="width:auto;">${op || '+'}</span>
                <input type="number" class="answer-input" style="width:${inputWidth}; text-align:center; ${style}" 
                       data-expected="${answer}" 
                       value="${val}"
                       oninput="validateInput(this)" ${readonlyAttr}>
                <span class="equals" style="width:auto;">=</span>
                <span class="number" style="text-align:left; width:auto;">${sum}</span>
            `;
        } else if (this.data.type === 'div_remainder') {
            const { a, b, op, answer, remainder } = this.data;
            const valQ = isSolution ? answer : '';
            const valR = isSolution ? remainder : '';

            target.innerHTML = `
                <span class="number">${a}</span>
                <span class="operator">${op}</span>
                <span class="number">${b}</span>
                <span class="equals">=</span>
                <input type="number" class="answer-input" style="width:40px; margin-right:5px; ${style}" 
                       data-expected="${answer}" value="${valQ}" oninput="validateInput(this)" ${readonlyAttr}>
                <span style="font-size:12pt; margin-right:5px;">R</span>
                <input type="number" class="answer-input" style="width:40px; ${style}" 
                       data-expected="${remainder}" value="${valR}" oninput="validateInput(this)" ${readonlyAttr}>
            `;
        } else if (this.data.type === 'doubling_halving') {
            const { subtype, val, answer } = this.data;
            const uiT = (window.T || {});
            const label = subtype === 'double' ? (uiT.ui?.doubleLabel || 'Das Doppelte') : (uiT.ui?.halfLabel || 'Die Hälfte');

            const valAns = isSolution ? answer : '';

            target.style.display = 'flex';
            target.style.alignItems = 'center';
            target.style.justifyContent = 'center';
            target.style.gap = '5px';

            target.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1; margin-right:4px;">
                    <span style="font-weight:bold; font-size:0.75em; margin-bottom:2px;">${label}</span>
                    <span class="number" style="text-align:center; font-size:1.1em; width:auto;">${val}</span>
                </div>
                <span style="margin-right:2px; font-size:0.9em;">➜</span>
                <input type="number" class="answer-input" style="width:50px; ${style}" 
                       data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>
            `;
        } else if (this.data.type === 'rechenstrich') {
            const { start, jump1, mid, jump2, sum } = this.data;
            const sJ1 = isSolution ? jump1 : '';
            const sMid = isSolution ? mid : '';
            const sJ2 = isSolution ? jump2 : '';
            const sSum = isSolution ? sum : '';

            target.style.flexDirection = 'column';
            target.style.alignItems = 'center';
            target.style.padding = '20px 0';

            const equationHtml = `<div style="font-size: 1.2rem; margin-bottom: 20px;">
                ${start} + ${jump1 + jump2} = <input type="number" class="answer-input" style="width:70px;" data-expected="${sum}" value="${sSum}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
            </div>`;

            const vizHtml = `
                <div class="rechenstrich-container" style="position:relative; width:300px; height:80px; margin-top:20px;">
                    <div style="position:absolute; top:50px; left:0; width:100%; height:2px; background:#000;"></div>
                    <div class="rechenstrich-station rechenstrich-fixed" style="left:0; top:55px;">${start}</div>
                    <svg style="position:absolute; top:10px; left:0; width:66.6%; height:40px; overflow:visible;">
                        <path d="M 0 40 Q 50 0 100 40" fill="none" stroke="var(--primary-color)" stroke-width="2" vector-effect="non-scaling-stroke" style="transform: scaleX(2); transform-origin: left;"></path>
                    </svg>
                    <div class="rechenstrich-jump" style="left:33.3%; top:15px;">
                        +<input type="number" class="rechenstrich-input small" data-expected="${jump1}" value="${sJ1}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                    </div>
                    <div class="rechenstrich-station" style="left:66.6%; top:55px;">
                        <input type="number" class="rechenstrich-input" data-expected="${mid}" value="${sMid}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                    </div>
                    <svg style="position:absolute; top:10px; left:66.6%; width:33.3%; height:40px; overflow:visible;">
                        <path d="M 0 40 Q 25 10 50 40" fill="none" stroke="var(--primary-color)" stroke-width="2" vector-effect="non-scaling-stroke" style="transform: scaleX(2); transform-origin: left;"></path>
                    </svg>
                    <div class="rechenstrich-jump" style="left:83.3%; top:15px;">
                        +<input type="number" class="rechenstrich-input small" data-expected="${jump2}" value="${sJ2}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                    </div>
                    <div class="rechenstrich-station rechenstrich-fixed" style="left:100%; top:55px;">
                        <input type="number" class="rechenstrich-input" data-expected="${sum}" value="${sSum}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                    </div>
                </div>
            `;
            target.innerHTML = equationHtml + vizHtml;
        }
    }

    static generate(type, options, lang) {
        switch (type) {
            case 'bonds_10':
                {
                    const a = getRandomInt(0, 10);
                    return { type: 'missing_addend', a: a, sum: 10, op: '+', answer: 10 - a };
                }
            case 'div_remainder':
                {
                    let divisor = getRandomInt(2, 9);
                    let result = getRandomInt(2, 10);
                    let remainder = getRandomInt(1, divisor - 1);
                    let a = (result * divisor) + remainder;
                    let b = divisor;
                    return { type: 'div_remainder', a, b, op: ':', answer: result, remainder };
                }
            case 'doubling_halving':
                {
                    const isDouble = seededRandom() < 0.5;
                    if (isDouble) {
                        let a = getRandomInt(1, 50);
                        return { type: 'doubling_halving', subtype: 'double', val: a, answer: a * 2 };
                    } else {
                        let val = getRandomInt(1, 50) * 2;
                        return { type: 'doubling_halving', subtype: 'halve', val: val, answer: val / 2 };
                    }
                }
            case 'rechenstrich':
                {
                    const a = getRandomInt(10, 60);
                    const b = getRandomInt(11, 39);
                    const sum = a + b;
                    const tens = Math.floor(b / 10) * 10;
                    const ones = b % 10;
                    return { type: 'rechenstrich', start: a, jump1: tens, mid: a + tens, jump2: ones, sum: sum };
                }
            case 'married_100':
                return this.generateMarriedNumbers(options.marriedMultiplesOf10 || false);
        }
    }

    static generateMarriedNumbers(onlyMultiplesOf10) {
        let a;
        if (onlyMultiplesOf10) {
            a = getRandomInt(0, 10) * 10;
        } else {
            a = getRandomInt(1, 99);
        }
        return { type: 'married_numbers', a: a, sum: 100, op: '+', answer: 100 - a };
    }
}

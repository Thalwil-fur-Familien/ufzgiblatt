import { Problem } from '../Problem.js';
import { getRandomInt, gcd } from '../mathUtils.js';

export class FractionProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
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
                <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>
            `;
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
               <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>
            `;
        }
    }

    static generate(type, options, lang) {
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
    }
}

export class RoundingProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const { val, place, answer } = this.data;
        const valAns = isSolution ? answer : '';
        const uiT = (window.T || {});
        const labelTemplate = uiT.ui?.roundingLabel || 'Runde {val} auf {place}:';

        target.style.flexDirection = 'column';
        target.innerHTML = `
             <div style="margin-bottom:5px;">${labelTemplate.replace('{val}', val).replace('{place}', place)}</div>
             <input type="number" class="answer-input" style="width:80px;" 
                    data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
        `;
    }

    static generate(type, options, lang) {
        let val = getRandomInt(1000, 99999);
        let place = [10, 100, 1000][getRandomInt(0, 2)];
        return { type: 'rounding', val, place, answer: Math.round(val / place) * place };
    }
}

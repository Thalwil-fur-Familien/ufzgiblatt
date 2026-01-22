import { Problem } from '../Problem.js';
import { getRandomInt } from '../mathUtils.js';

export class WrittenCalculationProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const { a, b, op, answer } = this.data;
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        if (isSolution && op === '×') {
            target.innerHTML = this.renderWrittenMultiplication(a, b, answer);
        } else if (isSolution && op === ':') {
            target.innerHTML = this.renderWrittenDivision(a, b, answer);
        } else if (op === '+' || op === '-') {
            const strA = a.toLocaleString('de-CH');
            const strB = b.toLocaleString('de-CH');
            const valAns = isSolution ? answer.toLocaleString('de-CH') : '';

            target.innerHTML = `
                <div class="written-vertical">
                    <div class="written-row">${strA}</div>
                    <div class="written-row"><span class="written-operator">${op}</span>${strB}</div>
                    <div class="written-line"></div>
                    <div class="written-row">
                        <input type="text" class="answer-input" style="width:100%; text-align:right; border:none; background:transparent; font-family:inherit; font-size:inherit; padding:0; ${style}" 
                        data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr}>
                    </div>
                </div>
            `;
        } else {
            // General fallback for problems that might not have specialized solution rendering defined yet
            this.renderStandard(target, isSolution);
        }
    }

    renderStandard(target, isSolution) {
        const { a, b, op, answer } = this.data;
        const valAns = isSolution ? answer : '';
        target.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center; width:100%;">
                <span class="number" style="width:auto;">${a}</span>
                <span class="operator">${op}</span>
                <span class="number" style="width:auto;">${b}</span>
                <span class="equals">=</span>
                <input type="number" class="answer-input" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            </div>
            <div class="squared-grid"></div>
        `;
    }

    renderWrittenMultiplication(a, b, answer) {
        const sA = a.toString();
        const sB = b.toString();
        let html = `<div class="written-vertical" style="align-items: flex-end; font-size:1rem;">
            <div class="written-row">${sA} &middot; ${sB}</div>
            <div class="written-line"></div>`;

        for (let i = 0; i < sB.length; i++) {
            const digit = parseInt(sB[i]);
            const partial = a * digit;
            const paddingRight = sB.length - 1 - i;
            html += `<div class="written-row" style="padding-right: ${paddingRight}ch;">${partial}</div>`;
        }

        html += `<div class="written-line"></div>
            <div class="written-row"><strong>${answer}</strong></div>
        </div>`;
        return html;
    }

    renderWrittenDivision(a, divisor, quotient) {
        const sA = a.toString();
        const sAns = quotient.toString();

        let html = `<div class="written-vertical" style="align-items: flex-start; font-size:1.1rem; font-family:'Courier New', monospace; line-height: 1.2;">
            <div class="written-row" style="justify-content: flex-start; letter-spacing: 2px;">${sA} : ${divisor} = ${sAns}</div>`;

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
        html += `</div>`;
        return html;
    }

    static generate(type, options, lang) {
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
    }
}

import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export interface MoneyData extends ProblemData {
    items: number[];
    answer: number;
    currency: string;
}

export class MoneyProblem extends Problem {
    declare data: MoneyData;

    constructor(data: MoneyData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { items, answer, currency } = this.data;
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const valAns = isSolution ? answer : '';

        target.style.flexDirection = 'column';
        target.style.gap = '10px';

        let itemsHtml = '<div class="money-items-container" style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center;">';
        items.forEach(val => {
            const isNote = val >= 10 || (currency === 'EUR' && val >= 5);
            const label = val < 1 ? (val * 100).toFixed(0) : val.toString();
            const unit = val < 1 ? (currency === 'EUR' ? 'c' : 'Rp.') : (currency === 'EUR' ? '€' : 'Fr.');
            const cls = isNote ? 'money-note' : 'money-coin';
            itemsHtml += `<div class="${cls}" data-value="${val}">${label}<span style="font-size:0.6em; margin-left:1px;">${unit}</span></div>`;
        });
        itemsHtml += '</div>';

        const inputHtml = `
            <div style="display:flex; align-items:center; gap:5px; font-weight:bold;">
                Total: <input type="number" step="0.01" class="answer-input" style="width:75px; text-align:center; ${style}" 
                             data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <span>${currency === 'EUR' ? '€' : 'CHF'}</span>
            </div>`;

        target.innerHTML = itemsHtml + inputHtml;
    }

    static generate(type: string, options: any, _lang: string): Partial<MoneyData> {
        const maxVal = type === 'money_10' ? 10 : 100;
        const currency = options.currency || 'CHF';

        let coins: number[], notes: number[];
        let step: number;

        if (currency === 'EUR') {
            coins = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2];
            notes = [5, 10, 20, 50, 100, 200, 500].filter(n => n <= maxVal);
            step = 0.01;
        } else {
            coins = [0.05, 0.10, 0.20, 0.50, 1, 2, 5];
            notes = [10, 20, 50, 100, 200, 1000].filter(n => n <= maxVal);
            step = 0.05;
        }

        let target: number;
        if (maxVal <= 10) {
            target = (getRandomInt(10, 200) * step);
        } else {
            target = (getRandomInt(10, maxVal) * 1.0);
        }

        const inv = 1 / step;
        target = Math.round(target * inv) / inv;

        let remaining = target;
        const items: number[] = [];
        const available = [...notes, ...coins].sort((a, b) => b - a);

        for (const val of available) {
            if (seededRandom() < 0.2) continue;
            while (remaining >= val - (step / 10) && items.length < 12) {
                items.push(val);
                remaining -= val;
                remaining = Math.round(remaining * inv) / inv;
            }
        }
        items.sort(() => seededRandom() - 0.5);

        return { type: 'money', items, answer: target, currency };
    }
}

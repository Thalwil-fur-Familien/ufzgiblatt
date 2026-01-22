import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export interface GeometryData extends ProblemData {
    hours?: number;
    minutes?: number;
    answer?: any;
    digital?: string;
    isComplex?: boolean;
    q?: string;
    grid?: number[];
    parts?: number[];
    total?: number;
    val?: number;
    from?: string;
    to?: string;
    rate?: number;
    base?: number;
}

export class GeometryProblem extends Problem {
    declare data: GeometryData;

    constructor(data: GeometryData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        if (this.data.type === 'time_reading') {
            const { hours, minutes, answer } = this.data;
            const val = isSolution ? answer : '';
            target.innerHTML = this.renderClock(hours!, minutes!) +
                `<input type="text" class="answer-input" style="width:60px; margin-left:10px; ${style}" 
                        placeholder="HH:MM" data-expected="${answer}" value="${val}" oninput="validateInput(this)" ${readonlyAttr}>`;
        } else if (this.data.type === 'time_analog_set') {
            const { hours, minutes, digital } = this.data;
            target.innerHTML = `<div style="text-align:center; font-weight:bold; margin-bottom:5px;">${digital}</div>` +
                this.renderClock(hours!, minutes!, !isSolution);
        } else if (this.data.type === 'time_duration') {
            const { q, answer } = this.data;
            const val = isSolution ? answer : '';
            target.style.flexDirection = 'column';
            target.innerHTML = `<div style="margin-bottom:10px; text-align:center;">${q}</div>
                <input type="text" class="answer-input" style="width:80px; ${style}" 
                       placeholder="HH:MM" data-expected="${answer}" value="${val}" oninput="validateInput(this)" ${readonlyAttr}>`;
        } else if (this.data.type === 'visual_add_100') {
            const { grid, total } = this.data;
            const sAns = isSolution ? total : '';
            target.style.flexDirection = 'column';
            target.style.gap = '10px';

            let gridHtml = '<div class="hundred-grid">';
            grid?.forEach(cell => {
                const cls = cell === 0 ? '' : `filled color-${cell}`;
                gridHtml += `<div class="grid-cell ${cls}"></div>`;
            });
            gridHtml += '</div>';

            target.innerHTML = gridHtml +
                `<div style="display:flex; align-items:center; gap:5px;">
                    Total: <input type="number" class="answer-input" style="width:50px; ${style}" 
                                  data-expected="${total}" value="${sAns}" oninput="validateInput(this)" ${readonlyAttr}>
                 </div>`;
        } else if (this.data.type === 'unit_conv') {
            const { val, from, to, answer } = this.data;
            const sAns = isSolution ? answer : '';
            target.innerHTML = `<span>${val} ${from}</span> <span class="equals">=</span> 
                <input type="number" class="answer-input" style="width:70px; ${style}" 
                       data-expected="${answer}" value="${sAns}" oninput="validateInput(this)" ${readonlyAttr}> <span>${to}</span>`;
        } else if (this.data.type === 'percent') {
            const { rate, base, answer } = this.data;
            const sAns = isSolution ? answer : '';
            target.innerHTML = `<span>${rate}% von ${base}</span> <span class="equals">=</span> 
                <input type="number" class="answer-input" style="width:70px; ${style}" 
                       data-expected="${answer}" value="${sAns}" oninput="validateInput(this)" ${readonlyAttr}>`;
        }
    }

    renderClock(h: number, m: number, hideHands: boolean = false): string {
        const mDeg = m * 6;
        const hDeg = (h % 12) * 30 + m * 0.5;
        const opacity = hideHands ? 0 : 1;
        return `
            <div class="clock">
                <div class="clock-face">
                    ${[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => `<div class="hour-mark mark-${n}">${n}</div>`).join('')}
                    <div class="hand hour-hand" style="transform: rotate(${hDeg}deg); opacity: ${opacity}"></div>
                    <div class="hand minute-hand" style="transform: rotate(${mDeg}deg); opacity: ${opacity}"></div>
                    <div class="clock-center"></div>
                </div>
            </div>`;
    }

    static generate(type: string, _options: any, lang: string): Partial<GeometryData> | undefined {
        switch (type) {
            case 'time_reading':
                {
                    const minutes = getRandomInt(0, 11) * 5;
                    const hours = getRandomInt(1, 12);
                    const minStr = minutes.toString().padStart(2, '0');
                    return { type: 'time_reading', hours, minutes, answer: `${hours}:${minStr}` };
                }
            case 'time_analog_set':
                {
                    const minutes = getRandomInt(0, 3) * 15;
                    const hours = getRandomInt(1, 12);
                    const minStr = minutes.toString().padStart(2, '0');
                    return { type: 'time_analog_set', hours, minutes, digital: `${hours}:${minStr}` };
                }
            case 'time_analog_set_complex':
                {
                    const minutes = getRandomInt(0, 59);
                    const hours = getRandomInt(0, 23);
                    const hStr = hours.toString().padStart(2, '0');
                    const minStr = minutes.toString().padStart(2, '0');
                    return { type: 'time_analog_set', hours, minutes, digital: `${hStr}:${minStr}`, isComplex: true };
                }
            case 'time_duration':
                {
                    const startH = getRandomInt(6, 18);
                    const startM = getRandomInt(0, 11) * 5;
                    const duration = getRandomInt(1, 12) * 5;
                    let endM = startM + duration;
                    let endH = startH;
                    if (endM >= 60) {
                        endH += Math.floor(endM / 60);
                        endM %= 60;
                    }
                    const sH = startH.toString();
                    const sM = startM.toString().padStart(2, '0');
                    const eH = endH.toString();
                    const eM = endM.toString().padStart(2, '0');

                    const uiT = ((window as any).TRANSLATIONS || {});
                    const currentLang = lang || 'de';
                    const qTemplate = uiT[currentLang]?.ui?.timeReadingQuestion || 'It is {time}. What time is it in {duration} min?';
                    const question = qTemplate.replace('{time}', `${sH}:${sM}`).replace('{duration}', duration.toString());

                    return { type: 'time_duration', q: question, answer: `${eH}:${eM}` };
                }
            case 'visual_add_100':
                {
                    const totalVis = getRandomInt(20, 100);
                    const partsCount = getRandomInt(2, 3);
                    const parts: number[] = [];
                    let currentSum = 0;
                    for (let i = 0; i < partsCount - 1; i++) {
                        const maxVal = totalVis - currentSum - (partsCount - 1 - i);
                        const valP = getRandomInt(1, maxVal);
                        parts.push(valP);
                        currentSum += valP;
                    }
                    parts.push(totalVis - currentSum);
                    const grid = new Array(100).fill(0);
                    let cursor = 0;
                    parts.forEach((p, idx) => {
                        const groupId = idx + 1;
                        for (let k = 0; k < p; k++) {
                            if (cursor < 100) { grid[cursor] = groupId; cursor++; }
                        }
                    });
                    return { type: 'visual_add_100', grid, parts, total: totalVis };
                }
            case 'units':
                {
                    const unitTypes = [
                        { from: 'm', to: 'cm', factor: 100 },
                        { from: 'km', to: 'm', factor: 1000 },
                        { from: 'kg', to: 'g', factor: 1000 },
                        { from: 'min', to: 's', factor: 60 },
                        { from: 'h', to: 'min', factor: 60 }
                    ];
                    const u = unitTypes[getRandomInt(0, unitTypes.length - 1)];
                    let val = getRandomInt(1, 20);
                    if (u.factor === 1000 && seededRandom() > 0.5) val = val / 2;
                    return { type: 'unit_conv', val, from: u.from, to: u.to, answer: val * u.factor };
                }
            case 'percent_basic':
                {
                    const rates = [10, 20, 25, 50, 75];
                    const rate = rates[getRandomInt(0, rates.length - 1)];
                    let base = getRandomInt(1, 20) * 100;
                    if (rate === 25 || rate === 75) base = getRandomInt(1, 20) * 4;
                    return { type: 'percent', rate, base, answer: (base * rate) / 100 };
                }
        }
        return undefined;
    }
}

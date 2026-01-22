import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export interface HouseFloor {
    a: number;
    b: number;
    hiddenSide: number;
}

export interface HouseData extends ProblemData {
    roof: number;
    floors: HouseFloor[];
}

export interface TriangleData extends ProblemData {
    inner: number[];
    outer: number[];
    maskMode: 'inner' | 'outer';
}

export class HouseProblem extends Problem {
    declare data: HouseData;

    constructor(data: HouseData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { roof, floors } = this.data;
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        let html = '<div class="house-container">';
        html += `<div class="house-roof">${roof}</div>`;

        floors.forEach(floor => {
            const valA = (floor.hiddenSide === 0 && !isSolution) ? '' : floor.a;
            const valB = (floor.hiddenSide === 1 && !isSolution) ? '' : floor.b;

            html += `
                <div class="house-floor">
                    <div class="house-room">
                        ${floor.hiddenSide === 0 ? `<input type="number" class="house-input answer-input" data-expected="${floor.a}" value="${valA}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${style}">` : floor.a}
                    </div>
                    <div class="house-room">
                        ${floor.hiddenSide === 1 ? `<input type="number" class="house-input answer-input" data-expected="${floor.b}" value="${valB}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${style}">` : floor.b}
                    </div>
                </div>`;
        });
        html += '</div>';

        target.innerHTML = html;
        target.style.display = 'flex';
        target.style.justifyContent = 'center';
    }

    static generate(type: string, _options: any, _lang: string): Partial<HouseData> {
        let maxRoof = 20;
        if (type === 'zahlenhaus_10') maxRoof = 10;
        if (type === 'zahlenhaus_100') maxRoof = 100;

        const roofNum = getRandomInt(10, maxRoof);
        const floorsCount = 3;
        const floors: HouseFloor[] = [];
        const usedValues = new Set<number>();

        for (let i = 0; i < floorsCount; i++) {
            let sideA: number = 0;
            let attempts = 0;
            do {
                sideA = getRandomInt(0, roofNum);
                attempts++;
            } while (usedValues.has(sideA) && attempts < 20);
            usedValues.add(sideA);
            const sideB = roofNum - sideA;
            const hiddenSide = seededRandom() < 0.5 ? 0 : 1;
            floors.push({ a: sideA, b: sideB, hiddenSide });
        }
        return { type: 'house', roof: roofNum, floors };
    }
}

export class TriangleProblem extends Problem {
    declare data: TriangleData;

    constructor(data: TriangleData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const { inner, outer, maskMode } = this.data;
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        const renderField = (val: number, isHidden: boolean) => {
            if (isHidden) {
                const displayVal = isSolution ? val : '';
                return `<input type="number" class="triangle-input answer-input" data-expected="${val}" value="${displayVal}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${style}">`;
            }
            return `<span class="triangle-val">${val}</span>`;
        };

        target.innerHTML = `
            <div class="triangle-container">
                <svg viewBox="0 0 100 100" class="triangle-svg">
                    <path d="M 50 5 L 95 85 L 5 85 Z" fill="none" stroke="#ccc" stroke-width="1.5"></path>
                </svg>
                <div class="t-field t-inner-1">${renderField(inner[0], maskMode === 'inner')}</div>
                <div class="t-field t-inner-2">${renderField(inner[1], maskMode === 'inner')}</div>
                <div class="t-field t-inner-3">${renderField(inner[2], maskMode === 'inner')}</div>
                <div class="t-field t-outer-1">${renderField(outer[0], maskMode === 'outer')}</div>
                <div class="t-field t-outer-2">${renderField(outer[1], maskMode === 'outer')}</div>
                <div class="t-field t-outer-3">${renderField(outer[2], maskMode === 'outer')}</div>
            </div>`;
    }

    static generate(type: string, _options: any, _lang: string): Partial<TriangleData> {
        let maxSum = type === 'rechendreiecke_100' ? 100 : 24;
        let i1: number = 0, i2: number = 0, i3: number = 0, o1: number = 0, o2: number = 0, o3: number = 0;
        let attempts = 0;
        do {
            const maxInner = Math.floor(maxSum / 1.5);
            i1 = getRandomInt(1, maxInner);
            i2 = getRandomInt(1, maxInner);
            i3 = getRandomInt(1, maxInner);
            o1 = i1 + i2;
            o2 = i2 + i3;
            o3 = i3 + i1;
            attempts++;
        } while ((o1 > maxSum || o2 > maxSum || o3 > maxSum) && attempts < 100);

        const maskMode = seededRandom() < 0.5 ? 'inner' : 'outer';
        return { type: 'triangle', inner: [i1, i2, i3], outer: [o1, o2, o3], maskMode };
    }
}

import { Problem } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export class HouseProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const { roof, floors } = this.data;
        target.classList.add('house-problem');
        target.style.display = 'flex';
        target.style.justifyContent = 'center';

        let floorsHtml = '';
        floors.forEach(f => {
            const valA = (f.hiddenSide === 0) ? (isSolution ? f.a : '') : f.a;
            const valB = (f.hiddenSide === 1) ? (isSolution ? f.b : '') : f.b;
            const isHiddenA = f.hiddenSide === 0;
            const isHiddenB = f.hiddenSide === 1;

            const styleA = (isHiddenA && isSolution) ? 'color:var(--primary-color); font-weight:bold;' : '';
            const styleB = (isHiddenB && isSolution) ? 'color:var(--primary-color); font-weight:bold;' : '';

            floorsHtml += `
                <div class="house-floor">
                    <div class="house-cell ${isHiddenA ? 'input' : 'static'}">
                        ${isHiddenA ? `<input type="number" class="answer-input house-input" data-expected="${f.a}" value="${valA}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${styleA}">` : f.a}
                    </div>
                    <div class="house-cell ${isHiddenB ? 'input' : 'static'}">
                        ${isHiddenB ? `<input type="number" class="answer-input house-input" data-expected="${f.b}" value="${valB}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${styleB}">` : f.b}
                    </div>
                </div>
            `;
        });

        target.innerHTML = `
            <div class="house-container">
                <div class="house-roof">${roof}</div>
                <div class="house-body">
                    ${floorsHtml}
                </div>
            </div>
        `;
    }

    static generate(type, options, lang) {
        let maxRoof = 10;
        if (type === 'zahlenhaus_10') maxRoof = 10;
        else if (type === 'zahlenhaus_20') maxRoof = 24;
        else if (type === 'zahlenhaus_100') maxRoof = 100;

        const roofNum = getRandomInt(10, maxRoof);
        const floorsCount = 3;
        const floors = [];
        const usedValues = new Set();
        for (let i = 0; i < floorsCount; i++) {
            let sideA;
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
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const { inner, outer, maskMode } = this.data;
        const isInnerHidden = maskMode === 'inner';

        const renderField = (val, expected, isHidden) => {
            if (isHidden) {
                const solutionVal = isSolution ? expected : '';
                const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
                return `<input type="number" class="answer-input triangle-field" data-expected="${expected}" value="${solutionVal}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${style}">`;
            } else {
                return `<div class="triangle-field static">${val}</div>`;
            }
        };

        target.classList.add('triangle-problem');
        target.style.display = 'flex';
        target.style.justifyContent = 'center';
        target.innerHTML = `
            <div class="triangle-container">
                <svg viewBox="0 0 200 175" class="triangle-svg">
                    <polygon points="100,15 180,145 20,145" fill="none" stroke="#ddd" stroke-width="2"/>
                </svg>
                <div class="triangle-pos corner-top">${renderField(inner[0], inner[0], isInnerHidden)}</div>
                <div class="triangle-pos side-left">${renderField(outer[2], outer[2], !isInnerHidden)}</div>
                <div class="triangle-pos side-right">${renderField(outer[0], outer[0], !isInnerHidden)}</div>
                <div class="triangle-pos corner-left">${renderField(inner[2], inner[2], isInnerHidden)}</div>
                <div class="triangle-pos side-bottom">${renderField(outer[1], outer[1], !isInnerHidden)}</div>
                <div class="triangle-pos corner-right">${renderField(inner[1], inner[1], isInnerHidden)}</div>
            </div>
        `;
    }

    static generate(type, options, lang) {
        let maxSum = 24;
        if (type === 'rechendreiecke_100') maxSum = 100;

        let i1, i2, i3, o1, o2, o3;
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

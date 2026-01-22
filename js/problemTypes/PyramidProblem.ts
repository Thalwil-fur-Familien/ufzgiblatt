import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt } from '../mathUtils.js';

export interface PyramidData extends ProblemData {
    values: number[];
    mask: boolean[];
    levels: number;
}

export class PyramidProblem extends Problem {
    declare data: PyramidData;

    constructor(data: PyramidData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const v = this.data.values;
        const m = this.data.mask;
        const levels = this.data.levels || 3;

        const renderBrick = (idx: number) => {
            if (idx >= v.length) return '';
            const val = v[idx];
            const isHidden = m[idx];

            if (isHidden) {
                const valueToFill = isSolution ? val : '';
                const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
                return `<div class="brick input"><input type="number" class="brick-input answer-input"
                    data-expected="${val}"
                    value="${valueToFill}"
                    oninput="validateInput(this)"
                    ${isSolution ? 'readonly' : ''} style="${style}"></div>`;
            } else {
                return `<div class="brick">${val}</div>`;
            }
        };

        let html = '<div class="pyramid-container">';

        let currentStartIndex = 0;
        let rowStarts: number[] = [];
        let currentRowLen = levels;
        for (let l = 0; l < levels; l++) {
            rowStarts.push(currentStartIndex);
            currentStartIndex += currentRowLen;
            currentRowLen--;
        }

        // Render from Top (last layer) down to Base (layer 0)
        for (let l = levels - 1; l >= 0; l--) {
            let startIdx = rowStarts[l];
            let count = levels - l;

            html += '<div class="pyramid-row">';
            for (let i = 0; i < count; i++) {
                html += renderBrick(startIdx + i);
            }
            html += '</div>';
        }

        html += '</div>';

        target.innerHTML = html;
        target.style.display = 'flex';
        target.style.justifyContent = 'center';
        target.style.padding = '0';
        target.style.border = 'none';
    }

    static generate(type: string, _options: any, _lang: string): Partial<PyramidData> {
        let maxTop = 100;
        let levels = 3;

        if (type === 'rechenmauer_10') maxTop = 10;
        else if (type === 'rechenmauer_100') { maxTop = 200; levels = 3; }
        else if (type === 'rechenmauer_4') { maxTop = 100; levels = 4; }
        else if (type === 'rechenmauer') { maxTop = 100; levels = 3; }

        return this.generatePyramid(maxTop, levels);
    }

    static generatePyramid(maxTop: number, levels: number = 3): Partial<PyramidData> {
        let values: number[] = [];
        let top: number;
        do {
            values = [];
            let baseCount = levels;
            let maxBase = Math.max(1, Math.floor(maxTop / (2 ** (levels - 1))));

            for (let i = 0; i < baseCount; i++) {
                values.push(getRandomInt(1, maxBase));
            }

            let currentLayerStart = 0;
            let currentLayerLength = baseCount;

            for (let l = 1; l < levels; l++) {
                for (let i = 0; i < currentLayerLength - 1; i++) {
                    let val = values[currentLayerStart + i] + values[currentLayerStart + i + 1];
                    values.push(val);
                }
                currentLayerStart += currentLayerLength;
                currentLayerLength--;
            }
            top = values[values.length - 1];
        } while (top > maxTop);

        const totalItems = values.length;
        const relations = this.getPyramidRelations(levels);

        const minHidden = Math.floor(totalItems * 0.4);
        const maxHidden = Math.floor(totalItems * 0.6);
        let targetHidden = getRandomInt(minHidden, maxHidden);
        if (levels === 3) targetHidden = 3;
        if (levels === 4) targetHidden = 6;

        let mask: boolean[] = [];
        let solvable = false;
        let attempts = 0;

        while (!solvable && attempts < 200) {
            mask = new Array(totalItems).fill(false);
            let hiddenCount = 0;
            let currentTarget = targetHidden;

            if (attempts > 50) currentTarget = Math.max(1, targetHidden - 1);
            if (attempts > 100) currentTarget = Math.max(1, targetHidden - 2);

            while (hiddenCount < currentTarget) {
                let idx = getRandomInt(0, totalItems - 1);
                if (!mask[idx]) {
                    mask[idx] = true;
                    hiddenCount++;
                }
            }

            if (this.checkPyramidSolvable(relations, totalItems, mask)) {
                solvable = true;
            } else {
                attempts++;
            }
        }

        if (!solvable) {
            mask.fill(false);
        }

        return { type: 'pyramid', values, mask, levels };
    }

    static getPyramidRelations(levels: number): number[][] {
        const relations: number[][] = [];
        let currentLayerStart = 0;
        let currentLayerLength = levels;

        for (let l = 0; l < levels - 1; l++) {
            for (let i = 0; i < currentLayerLength - 1; i++) {
                const left = currentLayerStart + i;
                const right = currentLayerStart + i + 1;
                const parent = currentLayerStart + currentLayerLength + i;
                relations.push([parent, left, right]);
            }
            currentLayerStart += currentLayerLength;
            currentLayerLength--;
        }
        return relations;
    }

    static checkPyramidSolvable(relations: number[][], _totalItems: number, mask: boolean[]): boolean {
        const known = mask.map(m => !m);
        let progress = true;
        while (progress) {
            progress = false;
            for (const [p, l, r] of relations) {
                const pKnown = known[p];
                const lKnown = known[l];
                const rKnown = known[r];

                if (!pKnown && lKnown && rKnown) {
                    known[p] = true;
                    progress = true;
                } else if (pKnown && !lKnown && rKnown) {
                    known[l] = true;
                    progress = true;
                } else if (pKnown && lKnown && !rKnown) {
                    known[r] = true;
                    progress = true;
                }
            }
        }
        return known.every(k => k);
    }
}

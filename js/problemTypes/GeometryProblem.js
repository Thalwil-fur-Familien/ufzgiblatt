import { Problem } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export class GeometryProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';
        const uiT = (window.T || {});

        if (this.data.type === 'time_reading') {
            const { hours, minutes, answer } = this.data;
            const valH = isSolution ? answer.split(':')[0] : '';
            const valM = isSolution ? answer.split(':')[1] : '';

            const showHours = document.getElementById('showHours')?.checked || false;
            const showMinutes = document.getElementById('showMinutes')?.checked || false;

            const clockHtml = this.renderClock(hours, minutes, showHours, showMinutes);

            target.style.flexDirection = 'column';
            target.innerHTML = `
                ${clockHtml}
                <div style="margin-top:10px; display:flex; align-items:center; gap:2px;">
                    <input type="number" class="answer-input" style="width:45px; text-align:center;" 
                           data-expected="${answer.split(':')[0]}" 
                           value="${valH}" 
                           oninput="validateInput(this)" 
                           ${readonlyAttr}>
                    <span style="font-weight:bold; font-size:1.2rem;">:</span>
                    <input type="number" class="answer-input" style="width:45px; text-align:center;" 
                           data-expected="${answer.split(':')[1]}" 
                           value="${valM}" 
                           oninput="validateInput(this)" 
                           ${readonlyAttr}>
                </div>
            `;
        } else if (this.data.type === 'time_analog_set') {
            const { hours, minutes, digital } = this.data;
            target.style.flexDirection = 'column';
            target.style.alignItems = 'center';
            target.style.gap = '10px';

            const clockHtml = this.renderClock(hours, minutes, false, false, isSolution);
            const displayHtml = `<div style="font-size: 1.4rem; font-weight: bold; margin-bottom: 5px;">${digital}</div>`;

            if (!isSolution) {
                const interactiveClock = this.renderClock(12, 0, false, false, true);
                const complex = this.data.isComplex;
                const hourControls = `
                    <div class="time-control-group no-print">
                        <span class="time-label">Std</span>
                        <div class="arrow-stack">
                            <button class="btn-arrow" 
                                onmousedown="startTimeAdjustment(this, 'h', 1)" 
                                onmouseup="stopTimeAdjustment()" 
                                onmouseleave="stopTimeAdjustment()"
                                ontouchstart="startTimeAdjustment(this, 'h', 1)"
                                ontouchend="stopTimeAdjustment()">▲</button>
                            <button class="btn-arrow" 
                                onmousedown="startTimeAdjustment(this, 'h', -1)" 
                                onmouseup="stopTimeAdjustment()" 
                                onmouseleave="stopTimeAdjustment()"
                                ontouchstart="startTimeAdjustment(this, 'h', -1)"
                                ontouchend="stopTimeAdjustment()">▼</button>
                        </div>
                    </div>
                `;
                const minuteControls = `
                    <div class="time-control-group no-print">
                        <span class="time-label">Min</span>
                        <div class="arrow-stack">
                            <button class="btn-arrow" 
                                onmousedown="startTimeAdjustment(this, 'm', ${complex ? 1 : 5})" 
                                onmouseup="stopTimeAdjustment()" 
                                onmouseleave="stopTimeAdjustment()"
                                ontouchstart="startTimeAdjustment(this, 'm', ${complex ? 1 : 5})"
                                ontouchend="stopTimeAdjustment()">▲</button>
                            <button class="btn-arrow" 
                                onmousedown="startTimeAdjustment(this, 'm', ${complex ? -1 : -5})" 
                                onmouseup="stopTimeAdjustment()" 
                                onmouseleave="stopTimeAdjustment()"
                                ontouchstart="startTimeAdjustment(this, 'm', ${complex ? -1 : -5})"
                                ontouchend="stopTimeAdjustment()">▼</button>
                        </div>
                    </div>
                `;

                target.innerHTML = `
                    ${interactiveClock}
                    <div class="clock-bottom-controls">
                        ${hourControls}
                        ${displayHtml}
                        ${minuteControls}
                    </div>
                `;
                target.dataset.type = 'time_analog_set';
                target.dataset.targetH = hours % 12;
                target.dataset.targetM = minutes;
                target.dataset.currH = 12;
                target.dataset.currM = 0;
            } else {
                target.innerHTML = clockHtml + displayHtml;
            }
        } else if (this.data.type === 'time_duration') {
            const { q, answer } = this.data;
            const valAns = isSolution ? answer : '';
            const label = uiT.ui?.timeLabel || 'Uhr';

            target.style.flexDirection = 'row';
            target.style.alignItems = 'center';
            target.style.justifyContent = 'space-between';
            target.style.width = '100%';
            target.style.padding = '0 0 0 10px';
            target.style.gap = '40px';

            target.innerHTML = `
                <div style="font-size:1.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-grow:1;">${q}</div>
                <div style="display:flex; align-items:center; gap:10px; flex-shrink:0; margin-left:auto;">
                    <input type="text" class="answer-input" style="width:80px; text-align:right;" 
                           data-expected="${answer}" 
                           value="${valAns}" 
                           oninput="validateInput(this)" 
                           ${readonlyAttr}>
                      <span>${label}</span>
                </div>
            `;
        } else if (this.data.type === 'visual_add_100') {
            const { grid, parts, total } = this.data;
            let gridHtml = '<div class="visual-grid-100">';
            grid.forEach(val => {
                const className = val === 0 ? 'circle-empty' : `circle-group-${val}`;
                gridHtml += `<div class="visual-circle ${className}"></div>`;
            });
            gridHtml += '</div>';

            let inputsHtml = '<div style="display:flex; align-items:center; gap:5px; margin-top:5px;">';
            parts.forEach((p, idx) => {
                const valAns = isSolution ? p : '';
                inputsHtml += `<input type="number" class="answer-input circle-input-group-${idx + 1}" style="width:50px; text-align:center;" 
                            data-expected="${p}" 
                            value="${valAns}" 
                            oninput="validateInput(this)" 
                            ${readonlyAttr}>`;
                if (idx < parts.length - 1) inputsHtml += '<span style="font-weight:bold;">+</span>';
            });
            inputsHtml += '<span style="font-weight:bold;">=</span>';
            const totalAns = isSolution ? total : '';
            inputsHtml += `<input type="number" class="answer-input" style="width:60px; text-align:center; font-weight:bold;" 
                        data-expected="${total}" 
                        value="${totalAns}" 
                        oninput="validateInput(this)" 
                        ${readonlyAttr}>`;
            inputsHtml += '</div>';

            target.style.flexDirection = 'column';
            target.innerHTML = gridHtml + inputsHtml;
        } else if (this.data.type === 'unit_conv') {
            const { val, from, to, answer } = this.data;
            const valAns = isSolution ? answer : '';
            target.style.justifyContent = 'center';
            target.style.gap = '10px';
            target.innerHTML = `
                <span class="number" style="width:auto;">${val} ${from}</span>
                <span class="equals" style="width:auto;">=</span>
                <input type="number" class="answer-input" style="width:80px; text-align:center;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                <span class="unit" style="width:auto;">${to}</span>
            `;
        } else if (this.data.type === 'percent') {
            const { rate, base, answer } = this.data;
            const valAns = isSolution ? answer : '';
            target.innerHTML = `
                <span>${rate}% von ${base}</span> <span class="equals">=</span>
                <input type="number" class="answer-input" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
             `;
        }
    }

    renderClock(hours, minutes, showHours = false, showMinutes = false, showHands = true) {
        let html = '<div class="clock-face"><div class="clock-center"></div>';
        if (showHours) {
            for (let i = 1; i <= 12; i++) {
                const angleDeg = i * 30;
                html += `<div class="clock-number-hour" style="transform: rotate(${angleDeg}deg) translate(0, -38px) rotate(-${angleDeg}deg)">${i}</div>`;
            }
        }
        if (showMinutes) {
            for (let i = 1; i <= 12; i++) {
                const angleDeg = i * 30;
                const minVal = i * 5;
                html += `<div class="clock-number-minute" style="transform: rotate(${angleDeg}deg) translate(0, -65px) rotate(-${angleDeg}deg)">${minVal}</div>`;
            }
        }
        for (let i = 0; i < 12; i++) {
            const deg = i * 30;
            html += `<div class="clock-marker" style="transform: rotate(${deg}deg) translate(0, 2px)"></div>`;
        }
        const minDeg = minutes * 6;
        const hourDeg = (hours % 12) * 30 + minutes * 0.5;
        const hColor = showHours ? 'green' : '#333';
        const mColor = showMinutes ? 'blueviolet' : '#000';
        if (showHands) {
            html += `<div class="clock-hand hand-hour" style="background:${hColor}; transform: rotate(${hourDeg}deg)"></div>`;
            html += `<div class="clock-hand hand-minute" style="background:${mColor}; transform: rotate(${minDeg}deg)"></div>`;
        }
        html += '</div>';
        return html;
    }

    static generate(type, options, lang) {
        switch (type) {
            case 'time_reading':
                {
                    const minutes = getRandomInt(0, 11) * 5;
                    const hours = getRandomInt(1, 12);
                    const minStr = minutes.toString().padStart(2, '0');
                    const answer = `${hours}:${minStr}`;
                    return { type: 'time_reading', hours, minutes, answer };
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
                return this.generateTimeDuration(lang);
            case 'visual_add_100':
                return this.generateVisualAdd100();
            case 'units':
                return this.generateUnits();
            case 'percent_basic':
                return this.generatePercentBasic();
        }
    }

    static generateTimeDuration(lang) {
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

        const uiT = (window.T || {});
        const qTemplate = uiT.ui?.timeReadingQuestion || 'Start: {time}, Dauer: {duration} min. Ende?';
        const question = qTemplate.replace('{time}', `${sH}:${sM}`).replace('{duration}', duration);

        return {
            type: 'time_duration',
            q: question,
            answer: `${eH}:${eM}`
        };
    }

    static generateVisualAdd100() {
        const totalVis = getRandomInt(20, 100);
        const partsCount = getRandomInt(2, 3);
        const parts = [];
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
                if (cursor < 100) {
                    grid[cursor] = groupId;
                    cursor++;
                }
            }
        });
        return { type: 'visual_add_100', grid, parts, total: totalVis };
    }

    static generateUnits() {
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

    static generatePercentBasic() {
        const rates = [10, 20, 25, 50, 75];
        let rate = rates[getRandomInt(0, rates.length - 1)];
        let base = getRandomInt(1, 20) * 100;
        if (rate === 25 || rate === 75) base = getRandomInt(1, 20) * 4;
        return { type: 'percent', rate, base, answer: (base * rate) / 100 };
    }
}

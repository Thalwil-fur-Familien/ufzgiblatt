import { Problem } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';

export class MoneyProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const { items, answer, currency } = this.data;
        const valAns = isSolution ? answer.toFixed(2) : '';
        const readonlyAttr = isSolution ? 'readonly' : '';
        const style = isSolution ? 'style="color:var(--primary-color); font-weight:bold;"' : '';
        const basePath = './';
        const uiT = (window.T || {});

        target.style.flexDirection = 'column';
        target.style.alignItems = 'center';
        target.style.padding = '10px 0';
        target.style.gap = '10px';

        const COIN_IMAGES_CHF = {
            '5': basePath + 'images/coins/CHF/smt_coin_5_fr_back.png',
            '2': basePath + 'images/coins/CHF/smt_coin_2_fr_back.png',
            '1': basePath + 'images/coins/CHF/smt_coin_1_fr_back.png',
            '0.5': basePath + 'images/coins/CHF/smt_coin_50rp_back.png',
            '0.2': basePath + 'images/coins/CHF/smt_coin_20rp_back.png',
            '0.1': basePath + 'images/coins/CHF/smt_coin_10rp_back.png',
            '0.05': basePath + 'images/coins/CHF/smt_coin_5rp_back.png'
        };

        const COIN_IMAGES_EUR = {
            '2': basePath + 'images/coins/EUR/Common_face_of_two_euro_coin_(2007).jpg',
            '1': basePath + 'images/coins/EUR/Common_face_of_one_euro_coin.png',
            '0.5': basePath + 'images/coins/EUR/50_eurocent_common_2007.png',
            '0.2': basePath + 'images/coins/EUR/20_eurocent_common_2007.png',
            '0.1': basePath + 'images/coins/EUR/10_eurocent_common_2007.png',
            '0.05': basePath + 'images/coins/EUR/5_eurocent_common_1999.png',
            '0.02': basePath + 'images/coins/EUR/2_eurocent_common_1999.png',
            '0.01': basePath + 'images/coins/EUR/1_cent_euro_coin_common_side.png'
        };

        const COIN_IMAGES = (currency === 'EUR') ? COIN_IMAGES_EUR : COIN_IMAGES_CHF;

        const NOTE_IMAGES_CHF = {
            '10': basePath + 'images/banknotes/CHF/CHF10_8_front.jpg',
            '20': basePath + 'images/banknotes/CHF/CHF20_8_front.jpg',
            '50': basePath + 'images/banknotes/CHF/CHF50_8_front.jpg',
            '100': basePath + 'images/banknotes/CHF/CHF100_8_front.jpg',
            '200': basePath + 'images/banknotes/CHF/CHF200_8_front.jpg',
            '1000': basePath + 'images/banknotes/CHF/CHF1000_8_front.jpg'
        };

        const NOTE_IMAGES_EUR = {
            '5': basePath + 'images/banknotes/EUR/EUR_5_obverse_(2002_issue).jpg',
            '10': basePath + 'images/banknotes/EUR/EUR_10_obverse_(2002_issue).jpg',
            '20': basePath + 'images/banknotes/EUR/EUR_20_obverse_(2002_issue).jpg',
            '50': basePath + 'images/banknotes/EUR/EUR_50_obverse_(2002_issue).jpg',
            '100': basePath + 'images/banknotes/EUR/EUR_100_obverse_(2002_issue).jpg',
            '200': basePath + 'images/banknotes/EUR/EUR_200_obverse_(2002_issue).jpg',
            '500': basePath + 'images/banknotes/EUR/EUR_500_obverse_(2002_issue).jpg'
        };

        const NOTE_IMAGES = (currency === 'EUR') ? NOTE_IMAGES_EUR : NOTE_IMAGES_CHF;

        const COIN_SCALES = {
            '5': 76, '2': 66, '1': 56, '0.5': 44, '0.2': 50, '0.1': 46, '0.05': 42, '0.02': 38, '0.01': 34
        };

        const isNote = (val) => !!NOTE_IMAGES[val.toString()];
        const banknoteItems = items.filter(val => isNote(val));
        const coinItems = items.filter(val => !isNote(val));

        let itemsHtml = '<div class="money-collection" style="display:flex; flex-direction:column; align-items:center; gap:10px; max-width:400px; min-height:100px;">';

        if (banknoteItems.length > 0) {
            const overlapClass = banknoteItems.length >= 2 ? 'overlapping' : '';
            itemsHtml += `<div class="banknotes-container ${overlapClass}" style="display:flex; flex-wrap:nowrap; justify-content:center; align-items:center;">`;
            banknoteItems.forEach((val, idx) => {
                const imgPath = NOTE_IMAGES[val.toString()] || '';
                const label = val + (currency === 'EUR' ? ' €' : ' Fr.');
                if (imgPath) {
                    itemsHtml += `<img src="${imgPath}" class="money-note-img" style="width:107px; height:auto; object-fit:contain; border-radius:2px; box-shadow:1px 2px 4px rgba(0,0,0,0.2); z-index:${idx};" alt="${label}">`;
                } else {
                    itemsHtml += `<div class="money-note m-${val}">${label}</div>`;
                }
            });
            itemsHtml += '</div>';
        }

        if (coinItems.length > 0) {
            itemsHtml += '<div class="coins-container" style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px; align-items:center;">';
            coinItems.forEach(val => {
                let label = (currency === 'EUR') ? (val < 1 ? (Math.round(val * 100)) + ' ct.' : val + ' €') : (val < 1 ? (Math.round(val * 100)) + ' Rp.' : val + ' Fr.');
                const imgPath = COIN_IMAGES[val.toString()] || '';
                const size = COIN_SCALES[val.toString()] || 50;
                if (imgPath) {
                    itemsHtml += `<img src="${imgPath}" class="money-coin-img" style="width:${size}px; height:${size}px; object-fit:contain;" alt="${label}">`;
                } else {
                    itemsHtml += `<div class="money-coin m-${val.toString().replace('.', '_')}">${label}</div>`;
                }
            });
            itemsHtml += '</div>';
        }

        itemsHtml += '</div>';

        const unitLabel = currency === 'EUR' ? '€' : 'Fr.';
        const inputHtml = `<div style="display:flex; align-items:center; gap:10px; font-weight:bold;">
            <span>${uiT.ui?.totalLabel || 'Gesamt:'}</span>
            <input type="number" step="${currency === 'EUR' ? '0.01' : '0.05'}" class="answer-input" style="width:100px;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
            <span>${unitLabel}</span>
        </div>`;

        target.innerHTML = itemsHtml + inputHtml;
    }

    static generate(type, options, lang) {
        const maxVal = type === 'money_10' ? 10 : 100;
        const currency = options.currency || 'CHF';
        return this.generateMoneyProblem(maxVal, currency);
    }

    static generateMoneyProblem(maxVal, currency = 'CHF') {
        let coins, notes, step;
        if (currency === 'EUR') {
            coins = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2];
            notes = [5, 10, 20, 50, 100, 200, 500].filter(n => n <= maxVal);
            step = 0.01;
        } else {
            coins = [0.05, 0.10, 0.20, 0.50, 1, 2, 5];
            notes = [10, 20, 50, 100, 200, 1000].filter(n => n <= maxVal);
            step = 0.05;
        }

        let target = maxVal <= 10 ? (getRandomInt(10, 200) * step) : (getRandomInt(10, maxVal) * 1.0);
        const inv = 1 / step;
        target = Math.round(target * inv) / inv;

        let remaining = target;
        const items = [];
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
        return { type: 'money', items: items, answer: target, currency: currency };
    }
}

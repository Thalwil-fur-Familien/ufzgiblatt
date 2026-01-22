import { Problem } from '../Problem.js';
import { getRandomInt, seededRandom } from '../mathUtils.js';
import { TRANSLATIONS } from '../translations.js';

export class TextProblem extends Problem {
    constructor(data) {
        super(data);
    }

    render(target, isSolution, lang) {
        const uiT = (window.T || {});

        if (this.type === 'word_problems') {
            target.style.flexDirection = 'column';
            target.style.alignItems = 'flex-start';
            target.style.borderBottom = '1px solid #eee';
            target.style.paddingBottom = '9px';

            const answerVal = isSolution ? this.data.a : '';
            const correctClass = isSolution ? 'correct-answer-show' : '';
            const label = uiT.ui?.answerLabel || 'Antwort:';

            target.innerHTML = `
                <div style="font-size: 14pt; margin-bottom:10px;"> ${this.data.q}</div>
                <div style="display:flex; gap:10px; align-items:center; width:100%; justify-content: flex-end;">
                    <span>${label}</span>
                    <input type="number" class="answer-input ${correctClass}" style="width:100px;"
                        data-expected="${this.data.a}"
                        value="${answerVal}"
                        oninput="validateInput(this)"
                        ${isSolution ? 'readonly style="color:var(--primary-color); font-weight:bold;"' : ''}>
                </div>
            `;
        } else if (this.type === 'word_types') {
            target.dataset.type = 'word_types';
            target.style.flexDirection = 'row';
            target.style.flexWrap = 'wrap';
            target.style.justifyContent = 'flex-start';
            target.style.gap = '8px';
            target.style.lineHeight = '0.5';
            target.style.fontSize = '1.3rem';

            let sentenceHtml = "";
            this.data.sentence.forEach((word, idx) => {
                let style = "";
                const isPunctuation = ['.', '!', '?', ',', ';', ':'].includes(word.text);
                const punctuationStyle = isPunctuation ? 'margin-left: -8px;' : '';

                if (isSolution) {
                    if (word.type === 'noun') style = "border-bottom: 3px solid red;";
                    else if (word.type === 'verb') style = "border-bottom: 3px solid blue;";
                    else if (word.type === 'adj') style = "border-bottom: 3px solid green;";
                    else if (word.type === 'artikel') style = "border-bottom: 3px solid orange;";

                    sentenceHtml += `<span style="${style} padding:0 2px; ${punctuationStyle}">${word.text}</span>`;
                } else {
                    sentenceHtml += `<span class="interactive-word" 
                        data-type="${word.type}" 
                        data-state="none"
                        style="${punctuationStyle}"
                        onclick="toggleWordType(this)">${word.text}</span>`;
                }
            });
            target.innerHTML = sentenceHtml;
        } else {
            // Default text/fallback
            target.innerHTML = `<div style="font-size: 12pt;"> ${this.data.q || ''}</div>`;
        }
    }

    static generate(type, options, lang) {
        if (type === 'word_problems') {
            const wordProblems = TRANSLATIONS[lang].word_problems;
            return { type: 'word_problems', ...wordProblems[getRandomInt(0, wordProblems.length - 1)] };
        } else if (type === 'word_types') {
            const currentWordTypes = TRANSLATIONS[lang].word_types;
            const idx = getRandomInt(0, currentWordTypes.length - 1);
            return { type: 'word_types', sentence: currentWordTypes[idx] };
        }
        return { type: 'text', q: '', a: '' };
    }
}

import { Problem, ProblemData } from '../Problem.js';
import { getRandomInt } from '../mathUtils.js';

export interface TextData extends ProblemData {
    q?: string;
    a?: number;
    sentence?: Array<{ text: string; type: string }>;
}

export class TextProblem extends Problem {
    declare data: TextData;

    constructor(data: TextData) {
        super(data);
    }

    render(target: HTMLElement, isSolution: boolean, _lang: string): void {
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        if (this.data.type === 'text') {
            const { q, a } = this.data;
            const val = isSolution ? a : '';
            target.style.flexDirection = 'column';
            target.style.alignItems = 'flex-start';
            target.innerHTML = `<p style="margin-bottom:10px;">${q}</p>
                <div style="display:flex; align-items:center; gap:5px;">
                    Answer: <input type="number" class="answer-input" style="width:60px; ${style}" 
                                   data-expected="${a}" value="${val}" oninput="validateInput(this)" ${readonlyAttr}>
                </div>`;
        } else if (this.data.type === 'word_types') {
            const sentence = this.data.sentence;
            target.style.flexDirection = 'column';
            target.className += ' word-types-problem';

            const uiT = ((window as any).TRANSLATIONS || {});
            const currentLang = ((window as any).lang || 'de');
            const legend = uiT[currentLang]?.ui?.wordTypesLegend || {};

            let legendHtml = `<div class="word-types-legend">
                <span class="legend-item noun" onclick="setWordTypeTool('noun')">${legend.noun}</span>
                <span class="legend-item verb" onclick="setWordTypeTool('verb')">${legend.verb}</span>
                <span class="legend-item adj" onclick="setWordTypeTool('adj')">${legend.adj}</span>
                <span class="legend-item artikel" onclick="setWordTypeTool('artikel')">${legend.artikel}</span>
                <span class="legend-item eraser" onclick="setWordTypeTool('eraser')">⌫</span>
            </div>`;

            let sentenceHtml = '<div class="sentence-container">';
            sentence?.forEach(word => {
                const solutionClass = isSolution && word.type !== 'other' ? `selected ${word.type}` : '';
                sentenceHtml += `<span class="word ${solutionClass}" data-type="${word.type}" onclick="markWord(this)">${word.text}</span> `;
            });
            sentenceHtml += '</div>';

            target.innerHTML = legendHtml + sentenceHtml + `<p class="instruction" style="font-size:0.7em; margin-top:5px; color:#666;">${legend.instruction || ''}</p>`;
        }
    }

    static generate(type: string, options: any, lang: string): Partial<TextData> | undefined {
        const uiT = ((window as any).TRANSLATIONS || {});
        const currentLang = lang || 'de';

        if (type === 'word_problems') {
            const wordProblems = uiT[currentLang]?.word_problems || [];
            if (wordProblems.length === 0) return { type: 'text', q: "No word problems found.", a: 0 };
            const problem = wordProblems[getRandomInt(0, wordProblems.length - 1)];
            return { type: 'text', q: problem.q, a: problem.a };
        } else if (type === 'word_types') {
            const wordTypes = uiT[currentLang]?.word_types || [];
            const index = options.wordTypeIndex !== undefined ? options.wordTypeIndex : -1;
            if (index >= 0 && wordTypes.length > 0) {
                return { type: 'word_types', sentence: wordTypes[index % wordTypes.length] };
            }
            if (wordTypes.length > 0) {
                return { type: 'word_types', sentence: wordTypes[getRandomInt(0, wordTypes.length - 1)] };
            }
        } else if (type === 'text') {
            return { type: 'text', q: 'Sample generic text problem?', a: 42 };
        }
        return undefined;
    }
}

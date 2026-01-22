import { getRandomInt, seededRandom } from './mathUtils.js';
import { TRANSLATIONS } from './translations.js';
import { LAYOUT_CONFIG } from './problemConfig.js';
import { ProblemFactory, ProblemData } from './Problem.js';

export const PAGE_CAPACITY = 540;

export function generateProblemsData(
    type: string,
    availableTopics: string[] = [],
    allowedCurrencies: string[] = ['CHF'],
    options: any = {},
    lang: string = 'de',
    customCapacity: number = PAGE_CAPACITY
): ProblemData[] {
    const data: ProblemData[] = [];
    const getCurrencyForProblem = (): string => {
        if (!allowedCurrencies || allowedCurrencies.length === 0) return 'CHF';
        return allowedCurrencies[getRandomInt(0, allowedCurrencies.length - 1)];
    };

    let currentLoad = 0;
    const topicsToUse = (type === 'custom') ? availableTopics : [type];
    if (topicsToUse.length === 0) return [];

    const currentWordTypes = (TRANSLATIONS as any)[lang].word_types || [];
    const wordTypeIndices = Array.from({ length: currentWordTypes.length }, (_, i) => i);
    wordTypeIndices.sort(() => seededRandom() - 0.5);
    let wordTypeCount = 0;

    let retries = 0;
    while (currentLoad < customCapacity && retries < 50) {
        let topic: string;
        if (type === 'custom') {
            topic = topicsToUse[getRandomInt(0, topicsToUse.length - 1)];
        } else {
            topic = type;
        }

        const config = (LAYOUT_CONFIG as any)[topic] || (LAYOUT_CONFIG as any)['default'];
        const w = config.weight;

        if (currentLoad + w <= customCapacity) {
            const currency = getCurrencyForProblem();
            const wordTypeIndex = topic === 'word_types' ? wordTypeIndices[wordTypeCount++ % currentWordTypes.length] : -1;

            const problemOptions = {
                ...options,
                currency,
                wordTypeIndex
            };

            const problemData = ProblemFactory.generate(topic, problemOptions, lang);
            if (problemData) {
                data.push(problemData);
                currentLoad += w;
                retries = 0;
            } else {
                retries++;
            }
        } else {
            retries++;
        }
    }
    return data;
}

export function generateProblem(type: string, currency: string = 'CHF', options: any = {}, index: number = -1, lang: string = 'de'): ProblemData | null {
    const problemOptions = {
        ...options,
        currency,
        wordTypeIndex: index
    };
    return ProblemFactory.generate(type, problemOptions, lang);
}

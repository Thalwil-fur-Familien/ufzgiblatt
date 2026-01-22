import { getRandomInt, seededRandom, gcd } from './mathUtils.js';
import { TRANSLATIONS } from './translations.js';
import { LAYOUT_CONFIG } from './problemConfig.js';
import { ProblemFactory } from './Problem.js';

export const PAGE_CAPACITY = 540; // 45 rows × 12 columns (increased resolution)

export function generateProblemsData(type, availableTopics = [], allowedCurrencies = ['CHF'], options = {}, lang = 'de', customCapacity = PAGE_CAPACITY) {
    const data = [];
    const getCurrencyForProblem = () => {
        if (!allowedCurrencies || allowedCurrencies.length === 0) return 'CHF';
        return allowedCurrencies[getRandomInt(0, allowedCurrencies.length - 1)];
    };

    let currentLoad = 0;
    const topicsToUse = (type === 'custom') ? availableTopics : [type];
    if (topicsToUse.length === 0) return [];

    // Pre-shuffle indices for word_types if present
    const currentWordTypes = TRANSLATIONS[lang].word_types;
    const wordTypeIndices = Array.from({ length: currentWordTypes.length }, (_, i) => i);
    wordTypeIndices.sort(() => seededRandom() - 0.5);
    let wordTypeCount = 0;

    let retries = 0;
    while (currentLoad < customCapacity && retries < 50) {
        // Pick a topic
        let topic;
        if (type === 'custom') {
            topic = topicsToUse[getRandomInt(0, topicsToUse.length - 1)];
        } else {
            topic = type;
        }

        const config = LAYOUT_CONFIG[topic] || LAYOUT_CONFIG['default'];
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

export function generateProblem(type, currency = 'CHF', options = {}, index = -1, lang = 'de') {
    const problemOptions = {
        ...options,
        currency,
        wordTypeIndex: index
    };
    return ProblemFactory.generate(type, problemOptions, lang);
}

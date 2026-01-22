import { Translation } from './translations.js';
import { ProblemData } from './Problem.js';

export let lang = 'de';
export let T: Translation;
export let globalSeed = Math.floor(Math.random() * 0xFFFFFFFF);
export let currentSheetsData: ProblemData[][] = [];
export let currentTitle = "";
export let currentGeneratorGrade = '1';
export let selectedGeneratorTopics = new Set<string>();

export const GRADE_TOPICS_STRUCTURE: Record<string, string[]> = {
    '1': ['add_10', 'sub_10', 'add_20_simple', 'sub_20_simple', 'bonds_10', 'rechenmauer_10', 'money_10'],
    '2': ['add_20', 'sub_20', 'add_100_simple', 'add_100_carry', 'sub_100_simple', 'sub_100_carry', 'mult_2_5_10', 'mult_all', 'div_2_5_10', 'rechenmauer', 'rechenmauer_4', 'doubling_halving', 'zahlenhaus_20', 'word_problems', 'time_reading', 'time_analog_set', 'visual_add_100', 'rechendreiecke', 'rechenstrich', 'married_100', 'money_100', 'word_types'],
    '3': ['add_1000', 'sub_1000', 'mult_advanced', 'div_100', 'div_remainder', 'rechenmauer_100', 'time_duration', 'time_analog_set_complex', 'rechendreiecke_100', 'zahlenhaus_100'],
    '4': ['add_written', 'sub_written', 'mult_large', 'div_long', 'rounding'],
    '5': ['dec_add', 'dec_sub', 'mult_10_100', 'units'],
    '6': ['frac_simplify', 'frac_add', 'percent_basic']
};

export function setLang(newLang: string) {
    lang = newLang;
    (window as any).lang = lang;
}

export function setT(newT: Translation) {
    T = newT;
    (window as any).T = T;
}

export function setCurrentTitle(title: string) {
    currentTitle = title;
}

export function setCurrentSheetsData(data: ProblemData[][]) {
    currentSheetsData = data;
}

export function setGrade(g: string) {
    currentGeneratorGrade = g;
}

export function setGlobalSeed(seed: number) {
    globalSeed = seed;
}

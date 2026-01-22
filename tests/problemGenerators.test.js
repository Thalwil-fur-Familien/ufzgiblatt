import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { generateProblem, generateProblemsData } from '../js/problemGenerators.js';
import { setSeed } from '../js/mathUtils.js';
import { registerAllProblems } from '../js/problemTypes/index.js';

describe('problemGenerators', () => {
    beforeAll(() => {
        registerAllProblems();
    });

    beforeEach(() => {
        setSeed(123); // Consistent seed for tests
    });

    describe('generateProblem', () => {
        const standardTypes = [
            'add_10', 'sub_10',
            'add_20', 'sub_20',
            'add_100_simple', 'add_100_carry',
            'sub_100_simple', 'sub_100_carry',
            'mult_2_5_10', 'mult_all',
            'div_2_5_10',
            'add_1000', 'sub_1000',
            'dec_add', 'dec_sub',
            'mult_10_100'
        ];

        standardTypes.forEach(type => {
            it(`should generate valid standard problem for ${type}`, () => {
                const p = generateProblem(type);
                expect(p.a).toBeDefined();
                expect(p.b).toBeDefined();
                expect(p.op).toBeDefined();
                expect(p.answer).toBeDefined();
                // Simple math check
                if (p.op === '+') expect(p.answer).toBeCloseTo(p.a + p.b);
                if (p.op === '-') expect(p.answer).toBeCloseTo(p.a - p.b);
                if (p.op === '×') expect(p.answer).toBeCloseTo(p.a * p.b);
                if (p.op === ':') expect(p.a / p.b).toBeCloseTo(p.answer);
            });
        });

        it('should generate "verliebte Zahlen" (bonds_10)', () => {
            const p = generateProblem('bonds_10');
            expect(p.type).toBe('missing_addend');
            expect(p.sum).toBe(10);
            expect(p.a + p.answer).toBe(10);
        });

        it('should generate "verheiratete Zahlen" (married_100)', () => {
            const p = generateProblem('married_100');
            expect(p.type).toBe('married_numbers');
            expect(p.sum).toBe(100);
            expect(p.a + p.answer).toBe(100);
        });

        it('should generate pyramids', () => {
            ['rechenmauer_10', 'rechenmauer', 'rechenmauer_4', 'rechenmauer_100'].forEach(type => {
                const p = generateProblem(type);
                expect(p.type).toBe('pyramid');
                expect(p.values.length).toBeGreaterThan(0);
                if (type === 'rechenmauer_4') expect(p.levels).toBe(4);
            });
        });

        it('should generate triangles (rechendreiecke)', () => {
            const p = generateProblem('rechendreiecke');
            expect(p.type).toBe('triangle');
            // inner[0]+inner[1] = outer[0] etc. (indices vary slightly in impl)
            const i = p.inner;
            const o = p.outer;
            expect(i[0] + i[1]).toBe(o[0]);
            expect(i[1] + i[2]).toBe(o[1]);
            expect(i[2] + i[0]).toBe(o[2]);
        });

        it('should generate houses (zahlenhaus)', () => {
            const p = generateProblem('zahlenhaus_20');
            expect(p.type).toBe('house');
            expect(p.roof).toBeGreaterThan(0);
            expect(p.floors.length).toBeGreaterThan(0);
            p.floors.forEach(f => {
                expect(f.a + f.b).toBe(p.roof);
            });
        });

        it('should generate time reading problems', () => {
            const p = generateProblem('time_reading');
            expect(p.type).toBe('time_reading');
            expect(p.hours).toBeDefined();
            expect(p.minutes).toBeDefined();
            expect(p.answer).toContain(':');
        });

        it('should generate money problems', () => {
            const p = generateProblem('money_100');
            expect(p.type).toBe('money');
            let sum = 0;
            p.items.forEach(val => sum += val);
            expect(sum).toBeCloseTo(p.answer);
        });

        it('should generate rechenstrich', () => {
            const p = generateProblem('rechenstrich');
            expect(p.type).toBe('rechenstrich');
            expect(p.start + p.jump1).toBe(p.mid);
            expect(p.mid + p.jump2).toBe(p.sum);
        });

        it('should generate visual addition', () => {
            const p = generateProblem('visual_add_100');
            expect(p.type).toBe('visual_add_100');
            expect(p.grid.length).toBe(100);

            let sum = 0;
            p.parts.forEach(val => sum += val);
            expect(sum).toBe(p.total);
        });

        it('should generate written arithmetic', () => {
            const p = generateProblem('add_written');
            expect(p.type).toBe('written');
            expect(p.answer).toBe(p.a + p.b);
        });

        it('should generate fractions', () => {
            const p = generateProblem('frac_add');
            expect(p.type).toBe('fraction_op');
            // Simply check existence, logic is complex formatted string
            expect(p.answer).toBeDefined();
        });

    });
});

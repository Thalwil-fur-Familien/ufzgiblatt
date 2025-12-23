import { describe, it, expect, beforeEach } from 'vitest';
import { mulberry32, setSeed, getRandomInt, gcd, globalSeed } from '../js/mathUtils.js';

describe('mathUtils', () => {
    describe('mulberry32', () => {
        it('should yield reproducible sequences with the same seed', () => {
            const seed = 12345;
            const gen1 = mulberry32(seed);
            const gen2 = mulberry32(seed);

            expect(gen1()).toBe(gen2());
            expect(gen1()).toBe(gen2());
            expect(gen1()).toBe(gen2());
        });

        it('should yield different sequences with different seeds', () => {
            const gen1 = mulberry32(12345);
            const gen2 = mulberry32(54321);

            expect(gen1()).not.toBe(gen2());
        });
    });

    describe('setSeed and getRandomInt', () => {
        it('should respect the seed for getRandomInt', () => {
            setSeed(999);
            const val1 = getRandomInt(1, 100);

            setSeed(999);
            const val2 = getRandomInt(1, 100);

            expect(val1).toBe(val2);
        });

        it('should return values within the specified range', () => {
            const min = 5;
            const max = 15;
            for (let i = 0; i < 100; i++) {
                const val = getRandomInt(min, max);
                expect(val).toBeGreaterThanOrEqual(min);
                expect(val).toBeLessThanOrEqual(max);
            }
        });
    });

    describe('gcd', () => {
        it('should calculate the greatest common divisor correctly', () => {
            expect(gcd(12, 8)).toBe(4);
            expect(gcd(7, 3)).toBe(1);
            expect(gcd(100, 25)).toBe(25);
            expect(gcd(0, 5)).toBe(5);
            expect(gcd(5, 0)).toBe(5);
        });

        it('should handle negative numbers', () => {
            expect(gcd(-12, 8)).toBe(4);
            expect(gcd(12, -8)).toBe(4);
            expect(gcd(-12, -8)).toBe(4);
        });
    });
});

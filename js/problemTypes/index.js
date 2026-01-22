import { ProblemFactory } from '../Problem.js';
import { ArithmeticProblem } from './ArithmeticProblem.js';
import { PyramidProblem } from './PyramidProblem.js';
import { SpecialArithmeticProblem } from './SpecialArithmeticProblem.js';
import { GeometryProblem } from './GeometryProblem.js';
import { TextProblem } from './TextProblem.js';
import { HouseProblem, TriangleProblem } from './FormProblems.js';
import { MoneyProblem } from './MoneyProblem.js';
import { WrittenCalculationProblem } from './WrittenCalculationProblem.js';
import { FractionProblem, RoundingProblem } from './MiscProblems.js';

export function registerAllProblems() {
    // Arithmetic
    ['add_10', 'sub_10', 'add_20_simple', 'sub_20_simple', 'add_20', 'sub_20',
        'add_100_simple', 'add_100_carry', 'sub_100_simple', 'sub_100_carry',
        'mult_2_5_10', 'mult_all', 'div_2_5_10', 'add_1000', 'sub_1000',
        'mult_advanced', 'div_100', 'dec_add', 'dec_sub', 'mult_10_100'
    ].forEach(t => ProblemFactory.register(t, ArithmeticProblem));

    // Pyramids
    ['rechenmauer_10', 'rechenmauer_100', 'rechenmauer', 'rechenmauer_4'].forEach(t => ProblemFactory.register(t, PyramidProblem));

    // Special Arithmetic
    ['bonds_10', 'div_remainder', 'doubling_halving', 'rechenstrich', 'married_100'].forEach(t => ProblemFactory.register(t, SpecialArithmeticProblem));

    // Geometry & Units
    ['time_reading', 'time_analog_set', 'time_analog_set_complex', 'time_duration', 'visual_add_100', 'units', 'percent_basic'
    ].forEach(t => ProblemFactory.register(t, GeometryProblem));

    // Text & Word Types
    ['word_problems', 'word_types', 'text'].forEach(t => ProblemFactory.register(t, TextProblem));

    // Forms
    ['zahlenhaus_10', 'zahlenhaus_20', 'zahlenhaus_100'].forEach(t => ProblemFactory.register(t, HouseProblem));
    ['rechendreiecke', 'rechendreiecke_100'].forEach(t => ProblemFactory.register(t, TriangleProblem));

    // Money
    ['money_10', 'money_100'].forEach(t => ProblemFactory.register(t, MoneyProblem));

    // Written
    ['add_written', 'sub_written', 'mult_large', 'div_long'].forEach(t => ProblemFactory.register(t, WrittenCalculationProblem));

    // Misc
    ['frac_simplify', 'frac_add'].forEach(t => ProblemFactory.register(t, FractionProblem));
    ProblemFactory.register('rounding', RoundingProblem);
}

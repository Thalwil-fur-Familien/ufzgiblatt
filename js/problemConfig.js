export const LAYOUT_CONFIG = {
    'default': { weight: 4, span: 4 },

    // Grade 1/2 Essentials (Span 1, Height 1 -> Area 1)
    'add_10': { weight: 1, span: 1 },
    'sub_10': { weight: 1, span: 1 },
    'add_20_simple': { weight: 1, span: 1 },
    'sub_20_simple': { weight: 1, span: 1 },
    'bonds_10': { weight: 1, span: 1 },
    'mult_2_5_10': { weight: 1, span: 1 },

    // Grade 2/3 Arithmetic (Span 1, Height 1 -> Area 1)
    'add_20': { weight: 1, span: 1 },
    'sub_20': { weight: 1, span: 1 },
    'add_100_simple': { weight: 1, span: 1 },
    'sub_100_simple': { weight: 1, span: 1 },
    'add_100_carry': { weight: 1, span: 1 },
    'sub_100_carry': { weight: 1, span: 1 },
    'mult_all': { weight: 1, span: 1 },
    'div_2_5_10': { weight: 1, span: 1 },
    'doubling_halving': { weight: 1, span: 1 },
    'married_100': { weight: 1, span: 1 },

    // Middle Grade Topics
    'add_1000': { weight: 1, span: 1 },
    'sub_1000': { weight: 1, span: 1 },
    'mult_advanced': { weight: 1, span: 1 },
    'div_100': { weight: 1, span: 1 },
    'div_remainder': { weight: 2, span: 1 }, // Taller due to remainder? Actually keep 1 if possible.
    'dec_add': { weight: 2, span: 2 },
    'dec_sub': { weight: 2, span: 2 },
    'mult_10_100': { weight: 2, span: 2 },
    'units': { weight: 1, span: 1 },
    'percent_basic': { weight: 2, span: 2 },
    'rounding': { weight: 1, span: 1 },
    'frac_add': { weight: 4, span: 2 }, // Fractions need height
    'frac_simplify': { weight: 4, span: 2 },

    // Pyramids & Special Forms
    'rechenmauer_10': { weight: 6, span: 2 }, // 2x3 units
    'rechenmauer_100': { weight: 6, span: 2 },
    'rechenmauer': { weight: 6, span: 2 },
    'rechenmauer_4': { weight: 8, span: 2 }, // 4x7 units
    'rechendreiecke': { weight: 8, span: 2 }, // 2x4 units
    'rechendreiecke_100': { weight: 8, span: 2 },
    'zahlenhaus_10': { weight: 4, span: 1 }, // 2x6 units
    'zahlenhaus_20': { weight: 4, span: 1 },
    'zahlenhaus_100': { weight: 4, span: 1 },

    // Large/Taller Problems
    'time_reading': { weight: 4, span: 1 }, // 4x3 units -> 2x3 units
    'time_analog_set': { weight: 4, span: 1 },
    'time_analog_set_complex': { weight: 4, span: 1 },
    'time_duration': { weight: 2, span: 2 }, // 4x2 units
    'word_problems': { weight: 12, span: 4 }, // 4x3 units
    'visual_add_100': { weight: 8, span: 2 }, // 4x4 units
    'add_written': { weight: 8, span: 4 }, // 4x2 units
    'sub_written': { weight: 8, span: 4 },
    'mult_large': { weight: 12, span: 4 }, // 4x3 units
    'div_long': { weight: 12, span: 4 },
    'rechenstrich': { weight: 12, span: 4 }, // 4x3 units
    'money_10': { weight: 10, span: 2 }, // 4x4 units
    'money_100': { weight: 10, span: 2 },
    'word_types': { weight: 8, span: 4 } // 4x2 units
};

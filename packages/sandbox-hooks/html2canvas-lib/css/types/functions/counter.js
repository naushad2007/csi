import { LIST_STYLE_TYPE } from '../../property-descriptors/list-style-type';
import { fromCodePoint } from 'css-line-break';
import { contains } from '../../../core/bitwise';
export class CounterState {
    constructor() {
        this.counters = {};
    }
    getCounterValue(name) {
        const counter = this.counters[name];
        if (counter && counter.length) {
            return counter[counter.length - 1];
        }
        return 1;
    }
    getCounterValues(name) {
        const counter = this.counters[name];
        return counter ? counter : [];
    }
    pop(counters) {
        counters.forEach(counter => this.counters[counter].pop());
    }
    parse(style) {
        const counterIncrement = style.counterIncrement;
        const counterReset = style.counterReset;
        let canReset = true;
        if (counterIncrement !== null) {
            counterIncrement.forEach(entry => {
                const counter = this.counters[entry.counter];
                if (counter && entry.increment !== 0) {
                    canReset = false;
                    counter[Math.max(0, counter.length - 1)] += entry.increment;
                }
            });
        }
        const counterNames = [];
        if (canReset) {
            counterReset.forEach(entry => {
                let counter = this.counters[entry.counter];
                counterNames.push(entry.counter);
                if (!counter) {
                    counter = this.counters[entry.counter] = [];
                }
                counter.push(entry.reset);
            });
        }
        return counterNames;
    }
}
const ROMAN_UPPER = {
    integers: [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
    values: ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
};
const ARMENIAN = {
    integers: [
        9000,
        8000,
        7000,
        6000,
        5000,
        4000,
        3000,
        2000,
        1000,
        900,
        800,
        700,
        600,
        500,
        400,
        300,
        200,
        100,
        90,
        80,
        70,
        60,
        50,
        40,
        30,
        20,
        10,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
        1
    ],
    values: [
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??'
    ]
};
const HEBREW = {
    integers: [
        10000,
        9000,
        8000,
        7000,
        6000,
        5000,
        4000,
        3000,
        2000,
        1000,
        400,
        300,
        200,
        100,
        90,
        80,
        70,
        60,
        50,
        40,
        30,
        20,
        19,
        18,
        17,
        16,
        15,
        10,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
        1
    ],
    values: [
        '????',
        '????',
        '????',
        '????',
        '????',
        '????',
        '????',
        '????',
        '????',
        '????',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '????',
        '????',
        '????',
        '????',
        '????',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??',
        '??'
    ]
};
const GEORGIAN = {
    integers: [
        10000,
        9000,
        8000,
        7000,
        6000,
        5000,
        4000,
        3000,
        2000,
        1000,
        900,
        800,
        700,
        600,
        500,
        400,
        300,
        200,
        100,
        90,
        80,
        70,
        60,
        50,
        40,
        30,
        20,
        10,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
        1
    ],
    values: [
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???',
        '???'
    ]
};
const createAdditiveCounter = (value, min, max, symbols, fallback, suffix) => {
    if (value < min || value > max) {
        return createCounterText(value, fallback, suffix.length > 0);
    }
    return (symbols.integers.reduce((string, integer, index) => {
        while (value >= integer) {
            value -= integer;
            string += symbols.values[index];
        }
        return string;
    }, '') + suffix);
};
const createCounterStyleWithSymbolResolver = (value, codePointRangeLength, isNumeric, resolver) => {
    let string = '';
    do {
        if (!isNumeric) {
            value--;
        }
        string = resolver(value) + string;
        value /= codePointRangeLength;
    } while (value * codePointRangeLength >= codePointRangeLength);
    return string;
};
const createCounterStyleFromRange = (value, codePointRangeStart, codePointRangeEnd, isNumeric, suffix) => {
    const codePointRangeLength = codePointRangeEnd - codePointRangeStart + 1;
    return ((value < 0 ? '-' : '') +
        (createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, isNumeric, codePoint => fromCodePoint(Math.floor(codePoint % codePointRangeLength) + codePointRangeStart)) +
            suffix));
};
const createCounterStyleFromSymbols = (value, symbols, suffix = '. ') => {
    const codePointRangeLength = symbols.length;
    return (createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, false, codePoint => symbols[Math.floor(codePoint % codePointRangeLength)]) + suffix);
};
const CJK_ZEROS = 1 << 0;
const CJK_TEN_COEFFICIENTS = 1 << 1;
const CJK_TEN_HIGH_COEFFICIENTS = 1 << 2;
const CJK_HUNDRED_COEFFICIENTS = 1 << 3;
const createCJKCounter = (value, numbers, multipliers, negativeSign, suffix, flags) => {
    if (value < -9999 || value > 9999) {
        return createCounterText(value, LIST_STYLE_TYPE.CJK_DECIMAL, suffix.length > 0);
    }
    let tmp = Math.abs(value);
    let string = suffix;
    if (tmp === 0) {
        return numbers[0] + string;
    }
    for (let digit = 0; tmp > 0 && digit <= 4; digit++) {
        let coefficient = tmp % 10;
        if (coefficient === 0 && contains(flags, CJK_ZEROS) && string !== '') {
            string = numbers[coefficient] + string;
        }
        else if (coefficient > 1 ||
            (coefficient === 1 && digit === 0) ||
            (coefficient === 1 && digit === 1 && contains(flags, CJK_TEN_COEFFICIENTS)) ||
            (coefficient === 1 && digit === 1 && contains(flags, CJK_TEN_HIGH_COEFFICIENTS) && value > 100) ||
            (coefficient === 1 && digit > 1 && contains(flags, CJK_HUNDRED_COEFFICIENTS))) {
            string = numbers[coefficient] + (digit > 0 ? multipliers[digit - 1] : '') + string;
        }
        else if (coefficient === 1 && digit > 0) {
            string = multipliers[digit - 1] + string;
        }
        tmp = Math.floor(tmp / 10);
    }
    return (value < 0 ? negativeSign : '') + string;
};
const CHINESE_INFORMAL_MULTIPLIERS = '????????????';
const CHINESE_FORMAL_MULTIPLIERS = '????????????';
const JAPANESE_NEGATIVE = '????????????';
const KOREAN_NEGATIVE = '????????????';
export const createCounterText = (value, type, appendSuffix) => {
    const defaultSuffix = appendSuffix ? '. ' : '';
    const cjkSuffix = appendSuffix ? '???' : '';
    const koreanSuffix = appendSuffix ? ', ' : '';
    const spaceSuffix = appendSuffix ? ' ' : '';
    switch (type) {
        case LIST_STYLE_TYPE.DISC:
            return '???' + spaceSuffix;
        case LIST_STYLE_TYPE.CIRCLE:
            return '???' + spaceSuffix;
        case LIST_STYLE_TYPE.SQUARE:
            return '???' + spaceSuffix;
        case LIST_STYLE_TYPE.DECIMAL_LEADING_ZERO:
            const string = createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
            return string.length < 4 ? `0${string}` : string;
        case LIST_STYLE_TYPE.CJK_DECIMAL:
            return createCounterStyleFromSymbols(value, '??????????????????????????????', cjkSuffix);
        case LIST_STYLE_TYPE.LOWER_ROMAN:
            return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, LIST_STYLE_TYPE.DECIMAL, defaultSuffix).toLowerCase();
        case LIST_STYLE_TYPE.UPPER_ROMAN:
            return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
        case LIST_STYLE_TYPE.LOWER_GREEK:
            return createCounterStyleFromRange(value, 945, 969, false, defaultSuffix);
        case LIST_STYLE_TYPE.LOWER_ALPHA:
            return createCounterStyleFromRange(value, 97, 122, false, defaultSuffix);
        case LIST_STYLE_TYPE.UPPER_ALPHA:
            return createCounterStyleFromRange(value, 65, 90, false, defaultSuffix);
        case LIST_STYLE_TYPE.ARABIC_INDIC:
            return createCounterStyleFromRange(value, 1632, 1641, true, defaultSuffix);
        case LIST_STYLE_TYPE.ARMENIAN:
        case LIST_STYLE_TYPE.UPPER_ARMENIAN:
            return createAdditiveCounter(value, 1, 9999, ARMENIAN, LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
        case LIST_STYLE_TYPE.LOWER_ARMENIAN:
            return createAdditiveCounter(value, 1, 9999, ARMENIAN, LIST_STYLE_TYPE.DECIMAL, defaultSuffix).toLowerCase();
        case LIST_STYLE_TYPE.BENGALI:
            return createCounterStyleFromRange(value, 2534, 2543, true, defaultSuffix);
        case LIST_STYLE_TYPE.CAMBODIAN:
        case LIST_STYLE_TYPE.KHMER:
            return createCounterStyleFromRange(value, 6112, 6121, true, defaultSuffix);
        case LIST_STYLE_TYPE.CJK_EARTHLY_BRANCH:
            return createCounterStyleFromSymbols(value, '????????????????????????????????????', cjkSuffix);
        case LIST_STYLE_TYPE.CJK_HEAVENLY_STEM:
            return createCounterStyleFromSymbols(value, '??????????????????????????????', cjkSuffix);
        case LIST_STYLE_TYPE.CJK_IDEOGRAPHIC:
        case LIST_STYLE_TYPE.TRAD_CHINESE_INFORMAL:
            return createCJKCounter(value, '??????????????????????????????', CHINESE_INFORMAL_MULTIPLIERS, '???', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
        case LIST_STYLE_TYPE.TRAD_CHINESE_FORMAL:
            return createCJKCounter(value, '??????????????????????????????', CHINESE_FORMAL_MULTIPLIERS, '???', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
        case LIST_STYLE_TYPE.SIMP_CHINESE_INFORMAL:
            return createCJKCounter(value, '??????????????????????????????', CHINESE_INFORMAL_MULTIPLIERS, '???', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
        case LIST_STYLE_TYPE.SIMP_CHINESE_FORMAL:
            return createCJKCounter(value, '??????????????????????????????', CHINESE_FORMAL_MULTIPLIERS, '???', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
        case LIST_STYLE_TYPE.JAPANESE_INFORMAL:
            return createCJKCounter(value, '??????????????????????????????', '????????????', JAPANESE_NEGATIVE, cjkSuffix, 0);
        case LIST_STYLE_TYPE.JAPANESE_FORMAL:
            return createCJKCounter(value, '??????????????????????????????', '????????????', JAPANESE_NEGATIVE, cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
        case LIST_STYLE_TYPE.KOREAN_HANGUL_FORMAL:
            return createCJKCounter(value, '??????????????????????????????', '????????????', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
        case LIST_STYLE_TYPE.KOREAN_HANJA_INFORMAL:
            return createCJKCounter(value, '??????????????????????????????', '????????????', KOREAN_NEGATIVE, koreanSuffix, 0);
        case LIST_STYLE_TYPE.KOREAN_HANJA_FORMAL:
            return createCJKCounter(value, '??????????????????????????????', '?????????', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
        case LIST_STYLE_TYPE.DEVANAGARI:
            return createCounterStyleFromRange(value, 0x966, 0x96f, true, defaultSuffix);
        case LIST_STYLE_TYPE.GEORGIAN:
            return createAdditiveCounter(value, 1, 19999, GEORGIAN, LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
        case LIST_STYLE_TYPE.GUJARATI:
            return createCounterStyleFromRange(value, 0xae6, 0xaef, true, defaultSuffix);
        case LIST_STYLE_TYPE.GURMUKHI:
            return createCounterStyleFromRange(value, 0xa66, 0xa6f, true, defaultSuffix);
        case LIST_STYLE_TYPE.HEBREW:
            return createAdditiveCounter(value, 1, 10999, HEBREW, LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
        case LIST_STYLE_TYPE.HIRAGANA:
            return createCounterStyleFromSymbols(value, '????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????');
        case LIST_STYLE_TYPE.HIRAGANA_IROHA:
            return createCounterStyleFromSymbols(value, '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????');
        case LIST_STYLE_TYPE.KANNADA:
            return createCounterStyleFromRange(value, 0xce6, 0xcef, true, defaultSuffix);
        case LIST_STYLE_TYPE.KATAKANA:
            return createCounterStyleFromSymbols(value, '????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????', cjkSuffix);
        case LIST_STYLE_TYPE.KATAKANA_IROHA:
            return createCounterStyleFromSymbols(value, '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????', cjkSuffix);
        case LIST_STYLE_TYPE.LAO:
            return createCounterStyleFromRange(value, 0xed0, 0xed9, true, defaultSuffix);
        case LIST_STYLE_TYPE.MONGOLIAN:
            return createCounterStyleFromRange(value, 0x1810, 0x1819, true, defaultSuffix);
        case LIST_STYLE_TYPE.MYANMAR:
            return createCounterStyleFromRange(value, 0x1040, 0x1049, true, defaultSuffix);
        case LIST_STYLE_TYPE.ORIYA:
            return createCounterStyleFromRange(value, 0xb66, 0xb6f, true, defaultSuffix);
        case LIST_STYLE_TYPE.PERSIAN:
            return createCounterStyleFromRange(value, 0x6f0, 0x6f9, true, defaultSuffix);
        case LIST_STYLE_TYPE.TAMIL:
            return createCounterStyleFromRange(value, 0xbe6, 0xbef, true, defaultSuffix);
        case LIST_STYLE_TYPE.TELUGU:
            return createCounterStyleFromRange(value, 0xc66, 0xc6f, true, defaultSuffix);
        case LIST_STYLE_TYPE.THAI:
            return createCounterStyleFromRange(value, 0xe50, 0xe59, true, defaultSuffix);
        case LIST_STYLE_TYPE.TIBETAN:
            return createCounterStyleFromRange(value, 0xf20, 0xf29, true, defaultSuffix);
        case LIST_STYLE_TYPE.DECIMAL:
        default:
            return createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
    }
};

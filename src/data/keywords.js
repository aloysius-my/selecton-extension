/// Look for these words to find that selected text is address, in order to show "Show on map" button
const addressKeywords = [
    /// English keywords
    ' street',
    'broadway',
    ' st.',
    ' str.',
    ' city',

    /// Russian
    'ул.',
    'пр.',
    'г.',
    'улица ',
    'переулок ',
    'город ',
    'проспект ',

    /// Ukrainian
    'вулиця ',
    'вул. ',
    'м. ',
    'місто ',

    /// Belorussian
    'вуліца ',
    'горад ',
    'праспект ',

    /// Spanish
    'calle ',
    'ciudad ',

    /// French
    'ville ',
    'rue ',

    /// German
    'straße',
    'strasse',
    ' stadt',
];


/// Literal multipliers for numeric values
/// With the help of these, "2 thousand" will be converted to "2000"
const thousandMultipliers = [
    'thousand',
    'тысяч',
    'тыс',
];

const millionMultipliers = [
    'million',
    'millón',
    'millones',
    'млн',
    'миллион',
    'мільйон',
];

const billionMultipliers = [
    'billion',
    'milliard',
    'mil millones',
    'млрд',
    'миллиард',
    'більйон',
    'мільярд',
];


/// Unit conversion units
/// Each key is a keyword, which will be searched for in the selected text
/// 'ratio' is the ratio to multiply, in order to get the value in 'covertsTo'
/// Temperature units provide "convertFunction" instead - code will look for this if selected value contains "°"
const convertionUnits = {
    "inch": {
        "convertsTo": "cm",
        "ratio": 2.54,
        "type": "imperial",
        "variations": [
            "pouces", /// fr
            "pulgadas", /// sp
            "дюймов", /// ru
            "дюйма",
        ]
    },
    "feet": {
        "convertsTo": "m",
        "ratio": 0.3048,
        "type": "imperial",
        "variations": [
            " ft",
            " foot",
            "pieds", /// fr
            "pies", /// sp
            ' фута',
            "футов"
        ]
    },
    "pound": {
        "convertsTo": "kg",
        "ratio": 0.453592,
        "variations": [
            " lb",
            "lbs",
            " libras", /// sp
            " livres", /// fr
            " фунтов", /// ru
            " фунта",
        ]
    },
    "mph": {
        "convertsTo": "km/h",
        "ratio": 1.60934,
    },
    " mile": {
        "convertsTo": "km",
        "ratio": 1.60934,
        "variations": [
            'millas', /// sp
            'milles', /// fr
            /// rus
            ' миль',
            ' мили',
        ],
    },
    "yard": {
        "convertsTo": "m",
        "variations": [
            ' yd',
            ' ярдов',
        ],
        "ratio": 0.9144,
    },
    " oz": {
        "convertsTo": "gr",
        "ratio": 28.3495,
        "variations": [
            'oz.',
            ' унций',
            ' унции',
            ' унция',
        ],
    },
    "°F": {
        "convertsTo": "°C",
        "convertFunction": function (value) {
            if (configs.preferredMetricsSystem == 'metric')
                return (value - 32) * (5 / 9);
            return (value * 9 / 5) + 32;
        },
    },
    "°K": {
        "convertsTo": "°C",
        "convertFunction": function (value) {
            return value - 273.15;
        },
    },
};

/// Unit conversion units when preferred system is imprerial
const imprerialConvertionUnits = {
    "cm": {
        "convertsTo": "inch",
        "ratio": 2.54,
        "variations": [
            "см", /// ru
        ]
    },
    "meter": {
        "convertsTo": "ft.",
        "ratio": 0.3048,
        "variations": [
            " m.",
            " metros", // sp
            " mètres", // fr
        ]
    },
    "kg": {
        "convertsTo": "lbs",
        "ratio": 0.453592,
        "variations": [
            " kilogram",
        ]
    },
    "km/h": {
        "convertsTo": "mph",
        "ratio": 1.60934,
    },
    "km": {
        "convertsTo": "miles",
        "ratio": 1.60934,
        "variations": [
            'killometer',
            'kilometr',
            'kilómetros',
        ],
    },
    " gr": {
        "convertsTo": "oz",
        "ratio": 28.3495,
        "variations": [
            ' gramm',
            ' gramos',
        ],
    },
    "°C": {
        "convertsTo": "°F",
        "convertFunction": function (value) {
            return (value * 9 / 5) + 32;
        },
    },
    "°K": {
        "convertsTo": "°F",
        "convertFunction": function (value) {
            return value * (9 / 5) - 459.67;
        },
    },
};



/// Convert timezones
const timeZoneKeywords = {
    'GMT': 'GMT',
    'UTC': 'UTC',
    'WET': 'UTC',
    'AKST': '-0900',
    'PST': '-0800',
    'PDT': '-0700',
    'MST': '-0700',
    'MDT': '-0600',
    'CST': '-0600',
    'EST': '-0500',
    'AST': '-0400',
    'EDT': '-0400',
    'NST': '-0330',
    'HAST': '-1000',
    'AEST': '+1000',
    'CET': '+0100',
    'WAT': '+0100',
    'BST': '+0100',
    'MET': '+0100',
    'CEST': '+0100',
    'EET': '+0200',
    'EEST': '+0200',
    'EET': '+0200',
    'CAT': '+0200',
    'MSK': '+0300',
    'EAT': '+0300',
    'IST': '+0530',
    'AWST': '+0800',
    'JST': '+0900',
    'KST': '+0900',
    'ACST': '+0930',

    /// Russian keywords
    'по Московскому времени': '+0300',
    'по московскому времени': '+0300',
    'по Москве': '+0300',
    'по центральноевропейскому времени': '+0100',
    'по европейскому времени': '+0100',
    'по тихоокеанскому времени': '-0800',
    'по Гринвичу': 'GMT',
};


/// Those will be ignored when looking for URL in selected text
/// So that, for example, when selected "somefile.txt" - it won't be recognized as a website for "Open link" button
const filetypesToIgnoreAsDomains = [
    "txt",
    "zip",
    "rar",
    "7z",
    "mp3",
    "mp4",
    "jpg",
    "wav",
    "exe",
    "cfg",
    "ini",
    "js",
    "html",
    "css",
    "log",
];

/// Search for these keywords to detect if selected text looks like code (in order to disable word snapping)
const codeMarkers = [
    'const ',
    'var ',
    'let ',
    'async ',
    'await ',
    '/>',
    '{',
    '}',
    '()',
    ' = ',
    ');',
    `='`,
    `="`,
    `('`,
    `("`,
    `": "`,
];


/// Keywords to recognize selected text as a website
/// Not in use
// const websiteKeywords = [
//     '.com',
//     '.org',
//     '.net',
//     '.int',
//     '.edu',
//     '.gov',
//     '.mil',
//     '.xyz',
//     '.website',
//     '.video',
//     '.travel',
//     '.support',
//     '.store',
//     '.site',
//     '.pub',
//     '.photo',
//     '.info',
//     '.eu',

//     /// Russian/Ukrainian domains
//     '.ru',
//     '.ру',
//     '.ua',
// ];
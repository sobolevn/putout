'use strict';

const test = require('@putout/test')(__dirname, {
    'try-catch': require('..'),
});

test('plugin-apply-destructuring: transform: report', (t) => {
    t.report('try-catch', 'Use tryCatch instead of try-catch block');
    t.end();
});

test('plugin-apply-destructuring: transform: try-catch', (t) => {
    t.transform('try-catch');
    t.end();
});


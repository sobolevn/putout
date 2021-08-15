'use strict';

const {join} = require('path');
const {
    readFileSync,
    writeFileSync,
    existsSync,
} = require('fs');

const tryCatch = require('try-catch');
const test = require('supertape');
const putout = require('putout');
const {checkTypes} = require('putout/register');
const currify = require('currify');

const isCorrectPlugin = require('./is-correct-plugin');

const isString = (a) => typeof a === 'string';
const {isArray} = Array;
const {keys, entries} = Object;

const {UPDATE} = process.env;
const TS = {
    ENABLED: true,
    DISABLED: false,
};

const readFixture = (name) => {
    const [e, data] = tryCatch(readFileSync, `${name}.ts`, 'utf8');
    
    if (!e)
        return [data, TS.ENABLED];
    
    return [readFileSync(`${name}.js`, 'utf8'), TS.DISABLED];
};

checkTypes();

module.exports = (dir, plugin, rules) => {
    
    dir = join(dir, 'fixture');
    const plugins = getPlugins(plugin);
    
    preTest(test, plugin);
    
    return test.extend({
        transform: transform({dir, plugins, rules}),
        noTransform: noTransform({dir, plugins, rules}),
        transformCode: transformCode({plugins, rules}),
        noTransformCode: noTransformCode({plugins, rules}),
        
        transformWithOptions: transformWithOptions({dir, plugins}),
        noTransformWithOptions: noTransformWithOptions({dir, plugins}),
        
        report: report({dir, plugins, rules}),
        noReport: noReport({dir, plugins, rules}),
        noReportAfterTransform: noReportAfterTransform({dir, plugins, rules}),
        reportWithOptions: reportWithOptions({dir, plugins}),
        noReportWithOptions: noReportWithOptions({dir, plugins}),
        reportCode: reportCode({
            plugins,
            rules,
        }),
        
        formatSave: formatSave({dir, plugins, rules}),
        format: (UPDATE ? formatSave : format)({dir, plugins, rules}),
        formatManySave: formatManySave({dir, plugins, rules}),
        formatMany: (UPDATE ? formatManySave : formatMany)({dir, plugins, rules}),
        noFormat: noFormat({dir, plugins, rules}),
    });
};

const format = currify(({dir, plugins, rules}, t, formatter, name, formatterOptions = {}) => {
    const full = join(dir, name);
    const outputName = `${full}-format`;
    const [input, isTS] = readFixture(full);
    const [expected] = readFixture(outputName);
    
    const {places} = putout(input, {fixCount: 1, isTS, plugins, rules});
    
    const report = putout.initReport();
    const result = report(formatter, {
        formatterOptions,
        name,
        source: input,
        places,
    });
    
    const {is, output} = t.equal(result, expected);
    
    return {is, output, result};
});

const noFormat = currify(({dir, plugins, rules}, t, formatter, name, formatterOptions = {}) => {
    const full = join(dir, name);
    const [input] = readFixture(full);
    
    const {places} = putout(input, {plugins, rules});
    
    const report = putout.initReport();
    const result = report(formatter, {
        name,
        places,
        formatterOptions,
    });
    
    const {is, output} = t.equal(result, '', 'should not format');
    
    return {is, output, result};
});

const formatMany = currify(({dir, plugins, rules}, t, formatter, names, formatterOptions = {}) => {
    const joinTwo = (a) => (b) => join(a, b);
    const fullNames = names.map(joinTwo(dir));
    
    let result = '';
    
    const count = names.length;
    const report = putout.initReport();
    for (let index = 0; index < count; index++) {
        const name = names[index];
        const full = fullNames[index];
        const [input] = readFixture(full);
        
        const {places} = putout(input, {
            fixCount: 1,
            plugins,
            rules,
        });
        
        result += report(formatter, {
            name,
            formatterOptions,
            source: input,
            places,
            index,
            count,
        });
    }
    
    const outputName = join(dir, `${names.join('-')}-format`);
    const [expected] = readFixture(outputName);
    
    const {is, output} = t.equal(result, expected);
    
    return {is, output, result};
});

const formatManySave = currify(({dir, plugins, rules}, t, formatter, names, options = {}) => {
    const name = `${names.join('-')}-format.js`;
    const outputName = join(dir, name);
    
    if (!existsSync(outputName))
        writeFileSync(outputName, '');
    
    const {
        is,
        output,
        result,
    } = formatMany(
        {dir,
            plugins,
            rules},
        t,
        formatter,
        names,
        options,
    );
    
    writeFileSync(outputName, result);
    
    return {is, output, result};
});

const formatSave = currify(({dir, plugins, rules}, t, formatter, name, options = {}) => {
    const full = join(dir, name);
    const outputName = `${full}-format.js`;
    
    if (!existsSync(outputName))
        writeFileSync(outputName, '');
    
    const {
        is,
        output,
        result,
    } = format(
        {dir,
            plugins,
            rules},
        t,
        formatter,
        name,
        options,
    );
    
    writeFileSync(outputName, result);
    
    return {
        is,
        output,
    };
});

const transform = currify(({dir, plugins, rules}, t, name, transformed = null, addons = {}) => {
    const full = join(dir, name);
    const [input, isTS] = readFixture(full);
    const isStr = isString(transformed);
    
    const [output] = isStr ? [transformed] : readFixture(`${full}-fix`);
    
    if (!isStr)
        addons = transformed;
    
    addons = addons || {};
    
    plugins[0] = {
        ...plugins[0],
        ...addons,
    };
    
    const {code} = putout(input, {isTS, plugins, rules});
    
    if (UPDATE)
        writeFileSync(`${full}-fix.js`, code);
    
    return t.equal(code, output, 'should equal');
});

const transformWithOptions = currify(({dir, plugins}, t, name, options) => {
    const full = join(dir, name);
    const [input, isTS] = readFixture(full);
    
    const [output] = readFixture(`${full}-fix`);
    const [plugin] = plugins;
    const [rule] = keys(plugin);
    
    const rules = {
        [rule]: ['on', options],
    };
    
    const {code} = putout(input, {isTS, plugins, rules});
    
    if (UPDATE)
        writeFileSync(`${full}-fix.js`, code);
    
    return t.equal(code, output, 'should equal');
});

const noTransformWithOptions = currify(({dir, plugins}, t, name, options) => {
    const full = join(dir, name);
    const [input, isTS] = readFixture(full);
    
    const [plugin] = plugins;
    const [rule] = keys(plugin);
    
    const rules = {
        [rule]: ['on', options],
    };
    
    const {code} = putout(input, {isTS, plugins, rules});
    
    return t.equal(code, input, 'should equal');
});

const noTransform = currify(({dir, plugins, rules}, t, name, addons = {}) => {
    const full = join(dir, name);
    const [fixture] = readFixture(full);
    
    return transform({dir, plugins, rules}, t, name, fixture, addons);
});

const transformCode = currify(({plugins, rules}, t, input, output, isTS = false) => {
    const {code} = putout(input, {isTS, plugins, rules});
    return t.equal(code, output, 'should equal');
});

const noTransformCode = currify(({plugins, rules}, t, input) => {
    const {code} = putout(input, {plugins, rules});
    return t.equal(code, input, 'should equal');
});

const getMessage = ({message}) => message;

const report = currify(({dir, plugins, rules}, t, name, message) => {
    const full = join(dir, name);
    const [source, isTS] = readFixture(full);
    
    return reportCode({plugins, rules, isTS}, t, source, message);
});

const noReport = currify(({dir, plugins, rules}, t, name) => {
    const full = join(dir, name);
    const [source, isTS] = readFixture(full);
    
    return noReportCode({plugins, rules, isTS}, t, source);
});
module.exports._createNoReport = noReport;

const noReportAfterTransform = currify(({dir, plugins, rules}, t, name) => {
    const full = join(dir, name);
    const [source, isTS] = readFixture(full);
    
    return noReportCodeAfterTransform({plugins, rules, isTS}, t, source);
});
module.exports._createNoReportAfterTransform = noReportAfterTransform;

const reportWithOptions = currify(({dir, plugins}, t, name, message, options) => {
    const full = join(dir, name);
    const [source, isTS] = readFixture(full);
    
    const [plugin] = plugins;
    const [rule] = keys(plugin);
    
    const rules = {
        [rule]: ['on', options],
    };
    
    return reportCode({plugins, rules, isTS}, t, source, message);
});

const noReportWithOptions = currify(({dir, plugins}, t, name, options) => {
    const full = join(dir, name);
    const [source, isTS] = readFixture(full);
    
    const [plugin] = plugins;
    const [rule] = keys(plugin);
    
    const rules = {
        [rule]: ['on', options],
    };
    
    return noReportCode({plugins, rules, isTS}, t, source);
});

const reportCode = currify(({plugins, rules, isTS}, t, source, message) => {
    const fix = false;
    const {places} = putout(source, {
        fix,
        isTS,
        rules,
        plugins,
    });
    
    const resultMessages = places.map(getMessage);
    
    if (isArray(message))
        return t.deepEqual(resultMessages, message, 'should equal');
    
    return t.equal(resultMessages[0], message, 'should equal');
});

const noReportCode = currify(({plugins, rules, isTS}, t, source) => {
    const fix = false;
    const {places} = putout(source, {
        fix,
        isTS,
        rules,
        plugins,
    });
    
    return t.deepEqual(places, [], 'should not report');
});

const noReportCodeAfterTransform = currify(({plugins, rules, isTS}, t, source) => {
    const fix = true;
    const {places} = putout(source, {
        fix,
        isTS,
        rules,
        plugins,
    });
    
    return t.deepEqual(places, [], 'should not report after transform');
});

function getPlugins(plugin) {
    return [
        plugin,
    ].filter(Boolean);
}

function preTest(test, plugin) {
    const [name, {
        report,
        find,
        traverse,
        include,
        exclude,
        fix,
        rules,
        replace,
        filter,
        match,
    }] = entries(plugin).pop();
    
    if (rules) {
        test(`${name}: rules is an object`, (t) => {
            t.equal(typeof rules, 'object', 'should export "rules" object');
            t.end();
        });
        
        const entries = Object.entries(rules);
        for (const [entryName, plugin] of entries) {
            preTest(test, {
                [`${name}/${entryName}`]: plugin,
            });
        }
        
        return;
    }
    
    test(`${name}: report: is function`, (t) => {
        t.equal(typeof report, 'function', 'should export "report" function');
        t.end();
    });
    
    test(`${name}: plugins should be of type: replace, template, traverse or find`, (t) => {
        const result = isCorrectPlugin({
            find,
            fix,
            
            traverse,
            
            include,
            exclude,
            
            filter,
            match,
            replace,
        });
        
        t.ok(result, 'should export "replace", "find", "traverse", "include", "exclude" function');
        t.end();
    });
}


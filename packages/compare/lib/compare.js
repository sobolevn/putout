'use strict';

const {template} = require('@putout/engine-parser');
const {
    isIdentifier,
    isExpressionStatement,
} = require('@babel/types');

const {
    findVarsWays,
    getValues,
    setValues,
    getTemplateValues,
} = require('./vars');

const {runComparators} = require('./comparators');

const {
    isStr,
    isPath,
    isEqualType,
    isEqualAnyObject,
    isEqualAnyArray,
    isLinkedNode,
    isEqualNop,
    isTemplate,
    parseTemplate,
} = require('./is');

const {keys} = Object;

const compareType = (type) => (path) => path.type === type;
const extractExpression = (a) => isExpressionStatement(a) ? a.expression : a;
const superPush = (array) => (a, b) => array.push([a, b]);

const findParent = (path, type) => {
    const newPathNode = path.findParent(compareType(type));
    
    if (!newPathNode)
        return null;
    
    return newPathNode.node;
};

function parseNode(a) {
    if (isStr(a))
        return template.ast(a);
    
    if (!a.node)
        return a;
    
    return a.node;
}

module.exports.compare = compare;
module.exports.parseTemplate = parseTemplate;
module.exports.isTemplate = isTemplate;

module.exports.findVarsWays = findVarsWays;
module.exports.getValues = getValues;
module.exports.setValues = setValues;
module.exports.getTemplateValues = getTemplateValues;

function compare(path, template) {
    if (!path && !template)
        return true;
    
    if (!path)
        return false;
    
    const node = extractExpression(parseNode(path));
    const templateNode = extractExpression(parseNode(template));
    
    if (node.type === template)
        return true;
    
    if (isEqualAnyObject(node, templateNode))
        return true;
    
    if (isEqualAnyArray(node, templateNode))
        return true;
    
    if (isEqualNop(node, templateNode))
        return true;
    
    if (isIdentifier(node) && isLinkedNode(templateNode))
        return true;
    
    if (isPath(path) && !isEqualType(node, templateNode)) {
        const {type} = templateNode;
        const newPathNode = findParent(path, type);
        
        return superCompareIterate(newPathNode, templateNode);
    }
    
    return superCompareIterate(node, templateNode);
}

module.exports.compareAny = (path, templateNodes) => {
    for (const template of templateNodes) {
        if (compare(path, template))
            return true;
    }
    
    return false;
};

module.exports.compareAll = (path, templateNodes) => {
    for (const template of templateNodes) {
        if (!compare(path, template))
            return false;
    }
    
    return true;
};
// @babel/template creates empty array directives
// extra duplicate value
const ignore = [
    'loc',
    'start',
    'end',
    'directives',
    'extra',
    'raw',
    'comments',
    'leadingComments',
    'innerComments',
    'parent',
    'range',
    'trailingComments',
    'importKind',
    'exportKind',
];

function superCompareIterate(node, template) {
    let item = [node, template];
    
    const array = [item];
    const templateStore = {};
    const add = superPush(array);
    
    while (item = array.pop()) {
        const [node, template] = item;
        
        if (!node)
            return false;
        
        for (const key of keys(template)) {
            if (ignore.includes(key))
                continue;
            
            const nodeValue = extractExpression(node[key]);
            const value = extractExpression(template[key]);
            
            const is = runComparators(nodeValue, value, {
                add,
                templateStore,
            });
            
            if (!is)
                return false;
        }
    }
    
    return true;
}


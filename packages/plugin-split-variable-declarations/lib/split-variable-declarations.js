'use strict';

const {
    types,
    operate,
} = require('putout');

const {
    isForStatement,
    variableDeclaration,
    variableDeclarator,
} = types;

const {replaceWithMultiple} = operate;

const {assign} = Object;

module.exports.report = () => 'Variables should be declared separately';

module.exports.fix = (path) => {
    const varNodes = getVarNodes(path.node);
    replaceWithMultiple(path, varNodes);
};

module.exports.traverse = ({push}) => {
    return {
        VariableDeclaration(path) {
            const {node, parent} = path;
            const {declarations} = node;
            
            if (declarations.length === 1)
                return;
            
            const init = node;
            
            if (isForStatement(parent, {init}))
                return;
            
            push(path);
        },
    };
};

function getVarNodes(node) {
    const {
        kind,
        declarations,
    } = node;
    
    const result = [];
    
    for (const {id, loc, init} of declarations) {
        const declaration = createVariableDeclarator({
            id,
            loc,
            init,
        });
        
        const declarations = [
            declaration,
        ];
        
        const declarationLoc = getDeclarationLoc({
            node,
            declaration,
            declarations,
        });
        
        result.push(createVariableDeclaration({
            loc: declarationLoc,
            kind,
            declarations,
        }));
    }
    
    return result;
}

function getDeclarationLoc({node, declaration, declarations}) {
    const i = declarations.indexOf(declaration);
    const {loc} = node;
    const {start} = loc;
    
    const line = start.line + i;
    
    const newStart = {
        line,
        column: start.column,
    };
    
    const newEnd = {
        line,
        column: declaration.loc.end.column,
    };
    
    return {
        start: newStart,
        end: newEnd,
    };
}

function createVariableDeclarator({id, loc, init}) {
    const declaration = variableDeclarator(id, init);
    return assign(declaration, {
        loc,
    });
}

function createVariableDeclaration({kind, loc, declarations}) {
    const declaration = variableDeclaration(kind, declarations);
    return assign(declaration, {
        loc,
    });
}


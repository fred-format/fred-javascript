const { FREDLexer } = require('./lexer')
const parser = require('./parser')
const { FREDToAstVisitor, FredDocument, FredStream, FredValue } = require('./visitor')

function parse(text) {
    const lexingResult = FREDLexer.tokenize(text)
    parser.input = lexingResult.tokens

    const cst = parser.document()
    const visitor = new FREDToAstVisitor()

    if (parser.errors.length > 0) {
        console.log(parser.errors)
        throw new Error("Parsing errors detected")
    }
    else {
        const ast = visitor.visit(cst)
        return ast
    }
}

module.exports = parse, FredDocument, FredStream, FredValue
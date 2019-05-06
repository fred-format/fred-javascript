const { Parser, Lexer, createToken } = require("chevrotain")

// LEXER
const True = createToken({ name: "True", pattern: /true/ })
const False = createToken({ name: "False", pattern: /false/ })
const Null = createToken({ name: "Null", pattern: /null/ })
const LCurly = createToken({ name: "LCurly", pattern: /{/ })
const RCurly = createToken({ name: "RCurly", pattern: /}/ })
const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", pattern: /]/ })
const LParens = createToken({ name: "LParens", pattern: /\(/ })
const RParens = createToken({ name: "RParens", pattern: /\)/ })
const Equal = createToken({ name: "Equal", pattern: /=/ })
const Colon = createToken({ name: "Colon", pattern: /:/ })
const T = createToken({ name: "T", pattern: /T/ })
const _ = createToken({ name: "_", pattern: /_/ })
const SymbolInit = createToken({ name: "SymbolInit", pattern: /\$/ })
const BlobInit = createToken({ name: "BlobInit", pattern: /#/ })

const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|x[0-9a-fA-F]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]))*"/
})

const BlobString = createToken({
    name: "BlobString",
    pattern: /"(?:[^\\"\u\U]|\\(?:[bfnrtv"\\/]|x[0-9a-fA-F]))*"/,
    line_breaks: false
})

const QuotedVariable = createToken({
    name: "QuotedVariable",
    pattern: /`(?:[^\\`]|\\(?:[bfnrtv`\\/]|x[0-9a-fA-F]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]))*`/
})

const Variable = createToken({
    name: "Variable",
    pattern: /[^#\"`$:;{}\[\]=\(\)\t\r\n ,0-9]{1}[^#\"`$:;{}\[\]=\(\)\t\r\n ,]*/
})

const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
})

const HexLiteral = createToken({
    name: "HexLiteral",
    pattern: /0x[0-9a-fA-F]{1}([0-9a-fA-F]{1}|_[0-9a-fA-F]{1})*/
})

const OctLiteral = createToken({
    name: "OctLiteral",
    pattern: /0o[0-8]{1}([0-8]{1}|_[0-8]{1})*/
})

const BinLiteral = createToken({
    name: "BinLiteral",
    pattern: /0b[01]{1}([01]{1}|_[01]{1})*/
})

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r,]+/,
    group: Lexer.SKIPPED
})

const Comment = createToken({
    name: "Comment",
    pattern: /;.*/,
    group: Lexer.SKIPPED
})

const DateFormat = createToken({
    name: "DateFormat",
    pattern: /\d{4}-\d{2}-\d{2}/
})

const Time = createToken({
    name: "Time",
    pattern: /\d{2}:\d{2}:\d{2}(\.\d+)?/
})

const TimeOffSet = createToken({
    name: "TimeOffSet",
    pattern: /Z|[+-]\d{2}:\d{2}/
})

const allTokens = [
    WhiteSpace,
    Comment,
    NumberLiteral,
    HexLiteral,
    OctLiteral,
    BinLiteral,
    StringLiteral,
    BlobString,
    DateFormat,
    Time,
    TimeOffSet,
    LCurly,
    RCurly,
    LParens,
    RParens,
    LSquare,
    RSquare,
    Equal,
    Colon,
    T,
    _,
    SymbolInit,
    BlobInit,
    True,
    False,
    Null,
    Variable,
    QuotedVariable
]

const FREDLexer = new Lexer(allTokens);


class FREDParser extends Parser {
    constructor(config) {
        super(allTokens, config)

        const $ = this

        $.RULE("value", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.tagged) },
                { ALT: () => $.SUBRULE($.atom) }
            ])
        })

        $.RULE("atom", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.object) },
                { ALT: () => $.SUBRULE($.array) },
                { ALT: () => $.SUBRULE($.dateOrDateTime) },
                { ALT: () => $.CONSUME(Time) },
                { ALT: () => $.SUBRULE($.symbol) },
                { ALT: () => $.SUBRULE($.number) },
                { ALT: () => $.SUBRULE($.string) },
                { ALT: () => $.SUBRULE($.bool) },
                { ALT: () => $.CONSUME(Null) },
            ])
        })

        $.RULE("tagged", () => {
            $.OR([
                {
                    ALT: () => {
                        $.SUBRULE($.name)
                        $.OPTION(() => {
                            $.SUBRULE($.attrs)
                        })
                        $.SUBRULE($.atom)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(LParens)
                        $.SUBRULE1($.name)
                        $.MANY(() => {
                            $.SUBRULE($.attr)
                        })
                        $.CONSUME(RParens)
                    }
                },
            ])

        })

        $.RULE("attrs", () => {
            $.CONSUME(LParens)
            $.MANY(() => {
                $.SUBRULE($.attr)
            })
            $.CONSUME(RParens)
        })

        $.RULE("attr", () => {
            $.SUBRULE($.name)
            $.CONSUME(Equal)
            $.SUBRULE($.atom)
        })

        $.RULE("object", () => {
            $.CONSUME(LCurly)
            $.MANY(() => {
                $.SUBRULE($.pair)
            })
            $.CONSUME(RCurly)
        })

        $.RULE("pair", () => {
            $.SUBRULE($.name)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })

        $.RULE("array", () => {
            $.CONSUME(LSquare)
            $.MANY(() => {
                $.SUBRULE($.atom)
            })
            $.CONSUME(RSquare)

        })

        $.RULE("bool", () => {
            $.OR([{ ALT: () => $.CONSUME(True) }, { ALT: () => $.CONSUME(False) }])
        })

        $.RULE("symbol", () => {
            $.CONSUME(SymbolInit)
            $.SUBRULE($.name)
        })

        $.RULE("dateOrDateTime", () => {
            $.CONSUME(DateFormat)
            $.OPTION(() => {
                $.OR([{ ALT: () => $.CONSUME(T) }, { ALT: () => $.CONSUME(_) }])
                $.CONSUME(Time)
                $.OPTION1(() => { $.CONSUME(TimeOffSet) })
            })
        })

        $.RULE("number", () => {
            $.OR([
                { ALT: () => $.CONSUME(NumberLiteral) },
                { ALT: () => $.CONSUME(HexLiteral) },
                { ALT: () => $.CONSUME(OctLiteral) },
                { ALT: () => $.CONSUME(BinLiteral) }
            ])
        })

        $.RULE("string", () => {
            $.OR([{ ALT: () => $.CONSUME(StringLiteral) }, { ALT: () => $.SUBRULE($.blobString) }])
        })

        $.RULE("blobString", () => {
            $.CONSUME(BlobInit)
            $.CONSUME(BlobString)
        })

        $.RULE("name", () => {
            $.OR([
                { ALT: () => { $.CONSUME(Variable) } },
                { ALT: () => { $.CONSUME(QuotedVariable) } }
            ])
        })

        this.performSelfAnalysis()
    }
}

// ONLY ONCE
const parser = new FREDParser([])


const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

class FREDToAstVisitor extends BaseCstVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    value(ctx) {
        if (ctx.tagged != null) {
            return { FREDValue: this.visit(ctx.tagged) }
        }
        if (ctx.atom != null) {
            return { FREDValue: this.visit(ctx.atom) }
        }
    }


    tagged(ctx) {
        let tagName = this.visit(ctx.name)
        let attrs = this.visit(ctx.attrs)
        let atom = this.visit(ctx.atom)

        return {
            tag: tagName,
            attrs: attrs,
            atom: atom
        }
    }

    atom(ctx) {
        console.log(ctx)
        if (ctx.object) {
            return this.visit(ctx.object)
        }
        else if (ctx.array) {
            return this.visit(ctx.array)
        }
        else if (ctx.dateOrDateTime) {
            return this.visit(ctx.array)
        }
        else if (ctx.Time) {
            return this.Time[0].image
        }
        else if (ctx.symbol) {
            return this.visit(ctx.symbol)
        }
        else if (ctx.number) {
            return this.visit(ctx.number)
        }
        else if (ctx.string) {
            return this.visit(ctx.string)
        }
        else if (ctx.bool) {
            console.log(ctx.bool)
            return this.visit(ctx.bool)
        }
        else if (ctx.Null) {
            return undefined
        }
    }

    attrs(ctx) {
        console.log(ctx.attr)

        return ctx.attr.map(node => this.visit(node))
    }
    attr(ctx) {
        console.log("entrou attr")
        console.log(ctx.name)
        console.log(ctx.atom)

        let name = this.visit(ctx.name)
        let atom = this.visit(ctx.atom)

        return { name, atom }
    }
    object(ctx) {
        return this.visit(ctx.pair)
    }
    pair(ctx) {
        let key = this.visit(ctx.name)
        let value = this.visit(ctx.value)
        return { key, value }
    }
    array(ctx) {
        return this.visit(ctx.atom)
    }

    bool(ctx) {
        console.log(ctx)
        if (ctx.True) {
            console.log(ctx.True)
            return true
        }
        else {
            return false
        }
    }
    symbol(ctx) {
        return "Symbol" + this.visit(ctx.name)
    }
    dateOrDateTime(ctx) {
        return ctx.DateFormat[0].image + "T" + ctx.Time[0].image + ctx.TimeOffSet[0].image
    }
    number(ctx) {
        if (ctx.NumberLiteral) {
            return ctx.NumberLiteral[0].image
        }
        else if (ctx.HexLiteral) {
            return ctx.HexLiteral[0].image
        }
        else if (ctx.OctLiteral) {
            return ctx.OctLiteral[0].image
        }
        else if (ctx.BinLiteral) {
            return ctx.BinLiteral[0].image
        }
    }
    string(ctx) {
        if (ctx.StringLiteral) {
            return ctx.StringLiteral[0].image
        }
        else {
            return this.visit(blobString)
        }
    }
    blobString(ctx) {
        return ctx.BlobString[0].image
    }
    name(ctx) {
        if (ctx.Variable) {
            console.log(ctx.Variable[0].image)
            return ctx.Variable[0].image
        }
        else {
            return ctx.QuotedVariable[0].image
        }
    }

}

function parseInput(text) {
    const lexingResult = FREDLexer.tokenize(text)
    parser.input = lexingResult.tokens

    const cst = parser.value()

    const visitor = new FREDToAstVisitor()

    const ast = visitor.visit(cst)
    console.log("AST: " + ast)

    if (parser.errors.length > 0) {
        console.log(parser.errors)
        throw new Error("sad sad panda, Parsing errors detected")
    }
}

const inputText = "tag1 ;coment \n (h1=true h2=\"str\" ) {  ;coment \n key : \"str\"}"
parseInput(inputText)

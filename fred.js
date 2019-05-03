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
    pattern: /"(?:[^\\"\u\U]|\\(?:[bfnrtv"\\/]|x[0-9a-fA-F]))*"/
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
    NumberLiteral,
    HexLiteral,
    OctLiteral,
    BinLiteral,
    QuotedVariable,
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
    Variable
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
            $.OR([{ ALT: $.CONSUME(True) }, { ALT: $.CONSUME(False) }])
        })

        $.RULE("symbol", () => {
            $.CONSUME(SymbolInit)
            $.SUBRULE($.name)
        })

        $.RULE("dateOrDateTime", () => {
            $.CONSUME(DateFormat)
            $.OPTION(() => {
                $.OR([{ ALT: $.CONSUME(T) }, { ALT: $.CONSUME(_) }])
                $.CONSUME(Time)
                $.OPTION1(() => { $.CONSUME(TimeOffSet) })
            })
        })

        $.RULE("number", () => {
            $.OR([
                { ALT: $.CONSUME(NumberLiteral) },
                { ALT: $.CONSUME(HexLiteral) },
                { ALT: $.CONSUME(OctLiteral) },
                { ALT: $.CONSUME(BinLiteral) }
            ])
        })

        $.RULE("string", () => {
            $.OR([{ ALT: $.CONSUME(StringLiteral) }, { ALT: $.SUBRULE($.blobString) }])
        })

        $.RULE("blobString", () => {
            $.CONSUME(BlobInit)
            $.CONSUME(BlobString)
        })

        $.RULE("name", () => {
            $.OR([{ ALT: $.CONSUME(Variable) }, { ALT: $.CONSUME(QuotedVariable) }])
        })

        this.performSelfAnalysis()
    }
}

// ONLY ONCE
const parser = new FREDParser([])

function parseInput(text) {
    const lexingResult = FREDLexer.tokenize(text)
    // "input" is a setter which will reset the parser's state.
    parser.input = lexingResult.tokens
    parser.value()
    console.log(parser.errors)

    if (parser.errors.length > 0) {
        throw new Error("sad sad panda, Parsing errors detected")
    }

}

const inputText = "tag { key : \"str\"}"
parseInput(inputText)
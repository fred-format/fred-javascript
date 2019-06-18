const { Lexer, createToken } = require("chevrotain")

const True = createToken({ name: "True", pattern: /true/ })
const False = createToken({ name: "False", pattern: /false/ })
const Null = createToken({ name: "Null", pattern: /null/ })
const LCurly = createToken({ name: "LCurly", pattern: /{/ })
const RCurly = createToken({ name: "RCurly", pattern: /}/ })
const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", pattern: /]/ })
const LParens = createToken({ name: "LParens", pattern: /\(/ })
const RParens = createToken({ name: "RParens", pattern: /\)/ })
const StreamSep = createToken({ name: "StreamSep", pattern: /---/ })
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
    DateFormat,
    Time,
    TimeOffSet,
    NumberLiteral,
    HexLiteral,
    OctLiteral,
    BinLiteral,
    StringLiteral,
    BlobString,
    LCurly,
    RCurly,
    LParens,
    RParens,
    LSquare,
    RSquare,
    StreamSep,
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
const FREDLexer = new Lexer(allTokens)

module.exports = {
    FREDLexer, tokens: {
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
        StreamSep,
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
    }, allTokens
}
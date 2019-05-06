const { Parser } = require("chevrotain")
const { tokens, allTokens } = require('./lexer')

class FREDParser extends Parser {
    constructor(allTokens, config) {
        super(allTokens, config)

        const $ = this
        $.RULE("document", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.stream) },
                { ALT: () => $.SUBRULE($.value) }
            ])
        })

        $.RULE("stream", () => {
            $.CONSUME(tokens.StreamSep)
            $.MANY(() => {
                this.SUBRULE($.value)
                $.CONSUME1(tokens.StreamSep)
            })
        })

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
                { ALT: () => $.CONSUME(tokens.Time) },
                { ALT: () => $.SUBRULE($.symbol) },
                { ALT: () => $.SUBRULE($.number) },
                { ALT: () => $.SUBRULE($.string) },
                { ALT: () => $.SUBRULE($.bool) },
                { ALT: () => $.CONSUME(tokens.Null) },
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
                        $.CONSUME(tokens.LParens)
                        $.SUBRULE1($.name)
                        $.MANY(() => {
                            $.SUBRULE($.attr)
                        })
                        $.CONSUME(tokens.RParens)
                    }
                },
            ])

        })

        $.RULE("attrs", () => {
            $.CONSUME(tokens.LParens)
            $.MANY(() => {
                $.SUBRULE($.attr)
            })
            $.CONSUME(tokens.RParens)
        })

        $.RULE("attr", () => {
            $.SUBRULE($.name)
            $.CONSUME(tokens.Equal)
            $.SUBRULE($.atom)
        })

        $.RULE("object", () => {
            $.CONSUME(tokens.LCurly)
            $.MANY(() => {
                $.SUBRULE($.pair)
            })
            $.CONSUME(tokens.RCurly)
        })

        $.RULE("pair", () => {
            $.SUBRULE($.name)
            $.CONSUME(tokens.Colon)
            $.SUBRULE($.value)
        })

        $.RULE("array", () => {
            $.CONSUME(tokens.LSquare)
            $.MANY(() => {
                $.SUBRULE($.atom)
            })
            $.CONSUME(tokens.RSquare)

        })

        $.RULE("bool", () => {
            $.OR([{ ALT: () => $.CONSUME(tokens.True) }, { ALT: () => $.CONSUME(tokens.False) }])
        })

        $.RULE("symbol", () => {
            $.CONSUME(tokens.SymbolInit)
            $.SUBRULE($.name)
        })

        $.RULE("dateOrDateTime", () => {
            $.CONSUME(tokens.DateFormat)
            $.OPTION(() => {
                $.OR([{ ALT: () => $.CONSUME(tokens.T) }, { ALT: () => $.CONSUME(tokens._) }])
                $.CONSUME(tokens.Time)
                $.OPTION1(() => { $.CONSUME(tokens.TimeOffSet) })
            })
        })

        $.RULE("number", () => {
            $.OR([
                { ALT: () => $.CONSUME(tokens.NumberLiteral) },
                { ALT: () => $.CONSUME(tokens.HexLiteral) },
                { ALT: () => $.CONSUME(tokens.OctLiteral) },
                { ALT: () => $.CONSUME(tokens.BinLiteral) }
            ])
        })

        $.RULE("string", () => {
            $.OR([{ ALT: () => $.CONSUME(tokens.StringLiteral) }, { ALT: () => $.SUBRULE($.blobString) }])
        })

        $.RULE("blobString", () => {
            $.CONSUME(tokens.BlobInit)
            $.CONSUME(tokens.BlobString)
        })

        $.RULE("name", () => {
            $.OR([
                { ALT: () => { $.CONSUME(tokens.Variable) } },
                { ALT: () => { $.CONSUME(tokens.QuotedVariable) } }
            ])
        })

        this.performSelfAnalysis()
    }
}

const parser = new FREDParser(allTokens, [])

module.exports = parser
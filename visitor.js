const parser = require('./parser')

const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

class FREDToAstVisitor extends BaseCstVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    value(ctx) {
        if (ctx.tagged != null) {
            return this.visit(ctx.tagged)
        }
        if (ctx.atom != null) {
            return this.visit(ctx.atom)
        }
    }


    tagged(ctx) {
        let tagName = this.visit(ctx.name)
        let attrs = this.visit(ctx.attrs)
        let atom = this.visit(ctx.atom)

        return {
            tagName: tagName,
            attrs: attrs,
            atom: atom
        }
    }

    atom(ctx) {
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
            return this.visit(ctx.bool)
        }
        else if (ctx.Null) {
            return undefined
        }
    }

    attrs(ctx) {
        return ctx.attr.map(node => this.visit(node))
    }
    attr(ctx) {
        let attr = {};
        let name = this.visit(ctx.name)
        let atom = this.visit(ctx.atom)

        attr[name] = atom;

        return attr
    }
    object(ctx) {
        return ctx.pair.map(node => this.visit(node))
    }
    pair(ctx) {
        let pair = {};
        let key = this.visit(ctx.name)
        let value = this.visit(ctx.value)
        pair[key] = value;

        return pair
    }
    array(ctx) {
        return ctx.atom.map(node => this.visit(node))
    }

    bool(ctx) {
        if (ctx.True) {
            return true
        }
        else {
            return false
        }
    }
    symbol(ctx) {
        return Symbol(this.visit(ctx.name))
    }
    dateOrDateTime(ctx) {
        let dateStr = ctx.DateFormat[0].image + "T" + ctx.Time[0].image + ctx.TimeOffSet[0].image
        let date = new Date(dateStr)
        return date
    }
    number(ctx) {
        if (ctx.NumberLiteral) {
            let numStr = ctx.NumberLiteral[0].image.replace(/_/g, "")
            let num = Number(numStr)
            return num
        }
        else if (ctx.HexLiteral) {
            let hexStr = ctx.NumberLiteral[0].image.substr(2).replace(/_/g, "")
            let hex = parseInt(hexStr, 16)
            return hex
        }
        else if (ctx.OctLiteral) {
            let octStr = ctx.OctLiteral[0].image.substr(2).replace(/_/g, "")
            let oct = parseInt(octStr, 8)
            return oct
        }
        else if (ctx.BinLiteral) {
            let binStr = ctx.BinLiteral[0].image.substr(2).replace(/_/g, "")
            let bin = parseInt(binStr, 2)
            return bin
        }
    }
    string(ctx) {
        if (ctx.StringLiteral) {
            return ctx.StringLiteral[0].image.replace(/"/g, "")
        }
        else {
            return this.visit(blobString)
        }
    }
    blobString(ctx) {
        return ctx.BlobString[0].image.replace(/"/g, "")
    }
    name(ctx) {
        if (ctx.Variable) {
            return ctx.Variable[0].image
        }
        else {
            return ctx.QuotedVariable[0].image
        }
    }

}

module.exports = FREDToAstVisitor
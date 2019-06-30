const parser = require('./parser')

const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

class FREDToAstVisitor extends BaseCstVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    document(ctx) {
        if (ctx.stream) {
            let doc = new FredStream(this.visit(ctx.stream));
            return doc;
        }
        else {
            let doc = new FredDocument(this.visit(ctx.value));
            return doc;
        }
    }

    stream(ctx) {
        return ctx.value.map((node) => this.visit(node))
    }

    value(ctx) {
        if (ctx.tagged) {
            return this.visit(ctx.tagged)
        }
        else {
            let value = new FredValue(null, null, this.visit(ctx.atom));
            return value
        }
    }


    tagged(ctx) {
        if (ctx.tag) {
            return this.visit(ctx.tag)
        }
        else {
            return this.visit(ctx.voidTag);
        }
    }

    tag(ctx) {
        let tag = this.visit(ctx.name);
        let meta = this.visit(ctx.attrs);
        if (meta == undefined) {
            meta = null;
        }
        let value = this.visit(ctx.atom)

        let tagValue = new FredValue(tag, meta, value);
        return tagValue
    }


    voidTag(ctx) {
        let tag = this.visit(ctx.name)
        let meta = ctx.attr.reduce(
            (acc, node) =>
                Object.assign(acc, this.visit(node)), {}
        )

        let voidTagValue = new FredValue(tag, meta, null);

        return voidTagValue;
    }

    atom(ctx) {
        if (ctx.object) {
            return this.visit(ctx.object)
        }
        else if (ctx.array) {
            return this.visit(ctx.array)
        }
        else if (ctx.dateOrDateTime) {
            return this.visit(ctx.dateOrDateTime)
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
            return null
        }
    }

    attrs(ctx) {
        return ctx.attr.reduce(
            (acc, node) =>
                Object.assign(acc, this.visit(node)), {}
        )
    }

    attr(ctx) {
        let attr = {};
        let name = this.visit(ctx.name)
        let atom = this.visit(ctx.atom)

        attr[name] = atom;

        return attr
    }
    object(ctx) {
        return ctx.pair.reduce(
            (acc, node) =>
                Object.assign(acc, this.visit(node)), {}
        )
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
        let dateStr = ctx.DateFormat[0].image
        if (ctx.Time != undefined) {
            dateStr = dateStr + "T" + ctx.Time[0].image;
            if (ctx.TimeOffSet != undefined) {
                dateStr = dateStr + ctx.TimeOffSet[0].image;
            }
        }

        return dateStr
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

class FredDocument {
    constructor(value) {
        this.value = value;
    }
    minify() {
        return this.value.minify();
    }
}

class FredStream {
    constructor(value) {
        this.value = value;
    }
    minify() {
        return this.value.reduce(minifyStream, "") + "---"
    }
}

function minifyStream(acc, value) {
    return acc + "---" + value.minify();
}

class FredValue {
    constructor(tag, meta, value) {
        this.tag = tag;
        this.meta = meta;
        this.value = value;
    }
    minify() {
        if (this.tag && this.meta && this.value) {
            return this.tag + "(" + minifyMeta(this.meta) + ")" + minifyValue(this.value);
        }
        if (this.tag && this.meta == null && this.value) {
            return this.tag + minifyValue(this.value);
        }
        if (this.tag && this.meta && this.value == null) {
            return "(" + this.tag + " " + minifyMeta(this.meta) + ")"
        }
        if (this.tag == null && this.meta == null) {
            return minifyValue(this.value);
        }
    }
}

function minifyMeta(meta) {
    const entries = Object.entries(meta)
    let str = ""
    for (const [key, value] of entries) {
        str = str + " " + key + "=" + value
    }
    return str.slice(1)
}

function minifyValue(value) {
    if (value instanceof FredValue) {
        return value.minify();
    }
    if (value === null) {
        return "null"
    }
    if (value === true) {
        return "true"
    }
    if (value === false) {
        return "false"
    }
    if (typeof value == 'number') {
        return value.toString();
    }
    if (typeof value === 'string') {
        return "\"" + value + "\""
    }
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            let arr = value
            let str = ""
            for (const v of arr) {
                str = str + " " + minifyValue(v);
            }
            return "[" + str.slice(1) + "]"
        }
        if (value === Object(value)) {
            const entries = Object.entries(value)
            let str = ""
            for (const [key, value] of entries) {
                str = str + " " + key + ":" + minifyValue(value);
            }
            return "{" + str.slice(1) + "}"
        }
    }
}

module.exports = { FREDToAstVisitor, FredDocument, FredStream, FredValue }
const parse = require('./index');
const { FredDocument, FredStream, FredValue } = require('./visitor')
const { execSync } = require('child_process');
const fs = require('fs');

execSync('rm -rf fred-test && git clone https://github.com/fred-format/fred-test.git');
let validTests = getValidTests();

describe('Valid FRED Documents', () => {
    for (let i = 0; i < validTests.length; i++) {
        for (let j = 0; j < validTests[i].length; j++) {
            it(validTests[i][j].dir + " " + validTests[i][j].name, () => {
                const input = validTests[i][j].input;
                const output = validTests[i][j].output;

                const parsedInput = toTestEncoding(parse(input));
                const jsonInput = JSON.stringify(parsedInput, null, 4);
                expect(jsonInput).toBe(output);
            });
        }
    }
});

let invalidTests = getInvalidTests();

describe('Invalid FRED Documents', () => {
    for (let i = 0; i < invalidTests.length; i++) {
        for (let j = 0; j < invalidTests[i].length; j++) {
            it(invalidTests[i][j].dir + " " + invalidTests[i][j].name, () => {
                const input = invalidTests[i][j].input;

                expect(() => parse(input)).toThrow(Error);
            });
        }
    }
});


// HELPER FUNCTIONS

function getValidTests() {
    let dirs = fs.readdirSync("./fred-test/tests/valid");

    return dirs.map((dir) => {
        let tests = fs.readdirSync("./fred-test/tests/valid/" + dir);

        let filtered = tests.filter((test) => {
            let name = test.split('.')[1];
            if (name === "fred") {
                return true;
            }
            else {
                return false;
            }
        });

        return filtered.reduce((acc, test) => {
            let name = test.split('.')[0];
            let input = fs.readFileSync("./fred-test/tests/valid/" + dir + "/" + name + ".fred", { encoding: "utf-8" });
            let output = fs.readFileSync("./fred-test/tests/valid/" + dir + "/" + name + ".json", { encoding: "utf-8" });
            let t = { dir, name, input, output };

            acc.push(t);

            return acc;
        }, [])
    });
}

function getInvalidTests() {
    let dirs = fs.readdirSync("./fred-test/tests/invalid");

    return dirs.map((dir) => {
        let tests = fs.readdirSync("./fred-test/tests/invalid/" + dir);

        return tests.reduce((acc, test) => {
            let name = test.split('.')[0];
            let input = fs.readFileSync("./fred-test/tests/invalid/" + dir + "/" + name + ".fred", { encoding: "utf-8" });
            let t = { dir, name, input };

            acc.push(t);

            return acc;
        }, [])
    });
}


function toTestEncoding(fred) {
    if (fred instanceof FredDocument) {
        tag = fred.value.tag;
        value = transformToEncode(fred.value.value);
        meta = getMeta(fred.value.meta);

        encodedObj = {
            tag: tag,
            value: value,
            meta: meta
        }

        return encodedObj;
    }

    if (fred instanceof FredValue) {
        tag = fred.tag;
        value = transformToEncode(fred.value);
        meta = getMeta(fred.meta);

        encodedObj = {
            tag: tag,
            value: value,
            meta: meta
        }

        return encodedObj;
    }


    if (fred instanceof FredStream) {
        return transformToEncode(fred.value);
    }
}

function transformToEncode(value) {

    if (typeof value == 'string') {
        return value;
    }

    if (typeof value == 'number') {
        return value.toString();
    }

    if (typeof value == 'boolean') {
        return value.toString();
    }

    if (typeof value == 'symbol') {
        return value.toString(); // TO DO IMPROVE SYMBOL RETRIEVE
    }

    if (value == null) {
        return "null";
    }

    if (typeof value == 'object') {
        if (Array.isArray(value)) {
            return value.map((elem) => {
                return transformToEncode(elem);
            });
        }
        if (value === Object(value)) {
            let o = objectMap(value, (v) => {
                return toTestEncoding(v);
            });
            return o;
        }
    }
}

function getMeta(meta) {
    if (meta != null) {
        let m = objectMap(meta, (v) => {
            return transformToEncode(v);
        });
        return m;
    }
    else {
        return null;
    }
}

function objectMap(object, mapFn) {
    return Object.keys(object).reduce(function (result, key) {
        result[key] = mapFn(object[key])
        return result
    }, {})
}



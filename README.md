# fred-javascript

Implementation of FRED (Flexible REpresentation of Data) for JavaScript

To install just run: `npm install fred-js`

# What is FRED?

FRED (Flexible REpresentation of Data) is a data-interchange format. It was created with the goal to be easy for humans to read and write but also easy to create parsers.

It has more data types than JSON and some features like support for metadata and tags.

# FRED Specification and Grammar

The FRED Spec and Grammar is being developed here [FRED Grammar and Specification](https://github.com/fred-format/grammar)

# How was implemented?

fred-js was implemented with [chevrotain](https://sap.github.io/chevrotain/docs/) and follows the FRED Spec. It exposes only a function that 
receives a FRED Text and returns a JavaScript Object.

# How to use?

```
const parse = require('fred-js')

fredValue = parse("tag (h1=42) { key : true }")
console.log(fredValue) 
/*
Print of the console.log
{   
  tagName: 'tag',
  attrs: [ { h1: 42 } ],
  atom: [ { key: true } ] 
} 
*/
```
"use strict";
var global = require('./global.js');
var soon = exports;

if (global.process.versions && global.process.versions.node && global.process.versions.node >= '0.11') {
    soon.asPossible = require('./soon-asPossible-node011.js');
}
else {
    soon.asPossible = require('./soon-asPossible.js');
}

soon.ish = require('./soon-setImmediate.js');

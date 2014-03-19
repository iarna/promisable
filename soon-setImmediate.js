"use strict";
var global = require('./global.js');
module.exports = global.setImmediate ? global.setImmediate : function (CB) { setTimeout(CB,0) }

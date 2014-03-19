"use strict";
var global = require('./global.js');
var next = (global.process && global.process.nextTick) ? global.process.nextTick : require('./soon-setImmediate.js');

var todo = [];
module.exports = function(CB){ todo.push(CB); if(todo.length) next(run_queue); }

var run_queue = function(){
    while (todo.length) {
        var fn = todo.shift();
        fn.apply(null);
    }
}

"use strict";
var soon = exports;
var immediate = soon.immediate = setImmediate ? setImmediate : function (CB) { setTimeout(CB,0) }
var next =  (process && process.nextTick) ? process.nextTick : immediate;

if (process.versions && process.versions.node && process.versions.node >= '0.11') {
    soon.nextTick = next;
}
else {
    var maybeBind = function (CB) { return !CB.domain && process.domain ? process.domain.bind(CB) : CB };

    soon.nextTick = soon.install = function(CB){ soon.todo.push(maybeBind(CB)); soon.nextTick = soon.push; next(soon.run) }
    soon.todo = [];
    soon.push = function(CB){ soon.todo.push(maybeBind(CB)) };

    soon.run = function(){
        while (soon.todo.length) {
            var todo = soon.todo;
            soon.todo = [];
            for (var ii in todo) {
                try {
                    todo[ii].apply(null);
                }
                catch (e) {
                    if (todo[ii].domain) {
                        todo[ii].domain.emit('error',e);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
        soon.nextTick = soon.install;
    }
}

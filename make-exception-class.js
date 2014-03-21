"use strict";
var util = require('util');

module.exports = function(name,ctor) {
    var NewError;
    if (ctor) {
        NewError = function() {
            this.name = name;
            ctor.apply(this,arguments);
            Error.captureStackTrace(this, NewError);
        }
    }
    else {
        NewError = function(msg) {
            this.name = name;
            this.message = msg;
            Error.captureStackTrace(this, NewError);
        }
    }
    util.inherits(NewError,Error);
    return NewError;
}

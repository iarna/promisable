"use strict";

var interop = require('../interop.js');
var name = "bluebird";

interop( name,
    function(){ return require('bluebird') },
    function (bluebird,cb) {
        return new bluebird(function(resolve,reject) {
            cb( resolve, reject );
        });
    });

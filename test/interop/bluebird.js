"use strict";

var interop = require('../interop.js');
var name = "bluebird";

interop( name,
    function(){ return require('bluebird') },
    function (bluebird,cb) {
        var deferred = new bluebird(function(resolve,reject) {
            cb( resolve, reject );
        });
        return deferred;
    });

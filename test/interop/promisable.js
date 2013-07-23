"use strict";

var interop = require('../interop.js');
var name = "promisable";

interop( name,
    function(){ return require('../../index.js') },
    function (P,cb) {
        return P(function(R){ cb( R.fulfill, R.reject ) });
    });

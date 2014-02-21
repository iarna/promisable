"use strict";

var Continue = require('../index.js'),
    test  = require('tape');

var create = {
    immediate: {
        success: function () { return Continue(function(R) { R(null,'OK') }) },
        failure: function () { return Continue(function(R) { throw new Error('NOK') }) },
    },
    deferred: {
        success: function () { return Continue(function(R) { process.nextTick(function(){ R(null,'OK') }) }) },
        failure: function () { return Continue(function(R) { process.nextTick(function(){ R(new Error('NOK')) }) }) },
    },
};

function map(A,F) { for (var K in A) F(K,A[K]) }

test("Continuable Style Tests", function(T) {
    T.plan(22);
    map( create, function(kind,statuses) {
        map( statuses, function(result,create) {
            create()(function(E,V) {
                var M="basic "+kind + " " + result;
                result == 'success'
                    ? T.is(V,'OK',M)
                    : T.ok( E instanceof Error, M);
            })

            create()(function(E,V){ })
            (function(E,V) {
                var M="chained "+kind + " " + result;
                result == 'success'
                    ? T.is(V,'OK',M)
                    : T.ok( E instanceof Error, M);
            })

            create()(function(E,V){
                return Continue.resolve(E,V);
            })
            (function(E,V) {
                var M = "chained w/deferred return "+kind + " " + result;
                result == 'success'
                    ? T.is(V,'OK',M)
                    : T.ok( E instanceof Error, M);
            })

            create()(function(E,V){
                if (V) { return V }
            })
            (function(E,V) {
                var M = "chained w/immediate return "+kind + " " + result;
                result == 'success'
                    ? T.is(V,'OK',M)
                    : T.ok( E instanceof Error, M);
            })

            if ( result == 'success' ) {
                create()(function(E,V){
                    return "STILL OK";
                })
                (function(E,V){
                    T.is(V, "STILL OK", "chained w/success->new val");
                });
            }
        })
    })

    Continue(function(R){
        R.withoutErrors("OK");
    })
    (function(E,V){
        T.is(V,'OK', 'resolve without errors');
    });

    var C1 = Continue(function(R){ R(null,'OK') });
    Continue(function(R){ R(C1) })
            (function(E,V){ T.is(V,'OK', 'chained continuable resolve') });

    var C2 = function(CB) { CB(null,'OK') }
    Continue(function(R){ R(C2) })
            (function(E,V){ T.is(V,'OK', 'chained continuable resolve w/raw function') });

    var msg = 'Promise that fails without catch throws the error';
    require('domain').create()
        .on('error', function(E){ T.is(E,'boom',msg) })
        .run(function() {
            Continue.reject('boom');
        });
});

"use strict";

var Promise = require('../index.js'),
    test  = require('tape');

var create = {
    immediate: {
        success: function () { return Promise(function(R) { R.fulfill('OK') }) },
        failure: function () { return Promise(function(R) { throw new Error('NOK') }) },
    },
    deferred: {
        success: function () { return Promise(function(R) { process.nextTick(function(){ R.fulfill('OK') }) }) },
        failure: function () { return Promise(function(R) { process.nextTick(function(){ R.reject(new Error('NOK')) }) }) },
    },
};

function map(A,F) { for (var K in A) F(K,A[K]) }

test("Promise Style Tests", function(T) {
    T.plan(26);
    map( create, function(kind,statuses) {
        map( statuses, function(result,create) {
            (function (){
                var M="basic then/catch "+kind + " " + result;
                result == 'success'
                    ? create().then(function(V) { T.is(V,'OK',M) })
                    : create().catch(function(E) { T.ok(E instanceof Error,M) });
            })();
            (function (){
                var M="basic then(do,else) "+kind + " " + result;
                result == 'success'
                    ? create().then(function(V) { T.is(V,'OK',M) },function(E) { T.fail(M) })
                    : create().then(function(V) { T.fail(M) },function(E) { T.ok(E instanceof Error,M) });
            })();
            (function (){
                var M="basic chained thens and catches "+kind + " " + result;
                result == 'success'
                    ? create().then(function(V){}).then(function(V) { T.is(V,'OK',M) })
                    : create().catch(function(E){}).catch(function(E) { T.ok(E instanceof Error,M) });
            })();
            (function(){
                var M="then chained to catch "+kind+" "+result;
                result == 'success'
                    ? create().then(function (V){ T.is(V,'OK',M) }).catch(function(E){ T.fail(M) })
                    : create().then(function (V){ T.fail(M) }).catch(function(E){ T.ok(E instanceof Error,M)});
            })();
            (function(){
                var M="catch chained to then "+kind+" "+result;
                result == 'success'
                    ? create().catch(function(E){ T.fail(M) }).then(function (V){ T.is(V,'OK',M) })
                    : create().catch(function(E){ T.ok(E instanceof Error,M) }).then(function (V){ T.fail(M) });
            })();
            if ( result == 'success' ) {
                create().then(function (V){ return "STILL OK"})
                        .then(function (V){ T.is(V,"STILL OK", "chained w/success->new val" ) });
            }
        })
    })
    Promise(function(R){ R.withoutErrors("OK") })
            (function(E,V){ T.is(V,'OK', 'resolve without errors') });

    var C1 = Promise(function(R){ R(null,'OK') });
    Promise(function(R){ R(C1) })
            (function(E,V){ T.is(V,'OK', 'chained continuable resolve') });

    var C2 = function(CB) { CB(null,'OK') }
    Promise(function(R){ R(C2) })
            (function(E,V){ T.is(V,'OK', 'chained continuable resolve w/raw function') });

    var msg = 'Promise that fails without catch throws the error';
    require('domain').create()
        .on('error', function(E){ T.is(E,'boom',msg) })
        .run(function() {
            Promise(function(R){ R('boom') })
                .then(function(V){ T.fail(msg) })
        });
});

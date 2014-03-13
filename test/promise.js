"use strict";

var Promise = require('../index.js'),
    test  = require('tape');

var createWith = function(F){ return function(msg,cb) { var P = Promise(F); cb ? cb(P,P+" "+msg) : msg(P) } }
var create = {
    immediate: {
        success: createWith(function(R) { R.fulfill('OK') }),
        failure: createWith(function(R) { throw new Error('NOK') })
    },
    deferred: {
        success: createWith(function(R) { process.nextTick(function(){ R.fulfill('OK') }) }),
        failure: createWith(function(R) { process.nextTick(function(){ R.reject(new Error('NOK')) }) })
    },
};

function forEach(A,F) { for (var K in A) F(K,A[K]) }

test("Promise Style Tests", function(T) {
    T.plan(25);
    forEach( create, function(kind,statuses) {
        forEach( statuses, function(result,create) {
            create("basic then/catch "+kind + " " + result,function (P,M){
                result == 'success'
                    ? P.then(function(V) { T.is(V,'OK',M) })
                    : P.catch(function(E) { T.ok(E instanceof Error,M) });
            });
            create("basic then(do,else) "+kind + " " + result, function (P,M){
                result == 'success'
                    ? P.then(function(V) { T.is(V,'OK',M) },function(E) { T.fail(M) })
                    : P.then(function(V) { T.fail(M) },function(E) { T.ok(E instanceof Error,M) });
            });
            create(function (P){
                var chained = result == 'success' ? P.then(function(V){}) : P.catch(function(E){});
                var M = chained + " "+"basic chained thens and catches "+kind + " " + result;
                result == 'success'
                    ? chained.then(function(V) { T.is(V,'OK',M) })
                    : chained.catch(function(E) { T.ok(E instanceof Error,M) });
/*
                result == 'success'
                    ? P.then(function(V){}).then(function(V) { T.is(V,'OK',M) })
                    : P.catch(function(E){}).catch(function(E) { T.ok(E instanceof Error,M) });
*/
            });
            create("then chained to catch "+kind+" "+result, function(P,M){
                result == 'success'
                    ? P.then(function (V){ T.is(V,'OK',M) }).catch(function(E){ T.fail(M) })
                    : P.then(function (V){ T.fail(M) }).catch(function(E){ T.ok(E instanceof Error,M)});
            });
            create("catch chained to then "+kind+" "+result, function(P,M){
                result == 'success'
                    ? P.catch(function(E){ T.fail(M) }).then(function (V){ T.is(V,'OK',M) })
                    : P.catch(function(E){ T.ok(E instanceof Error,M) }).then(function (V){ T.fail(M) });
            });
            if ( result == 'success' ) {
                create(function(P) {
                    var CP = P.then(function (V){ return "STILL OK"});
                    CP.then(function (V){ T.is(V,"STILL OK", CP+" chained w/success->new val" ) });
                });
            }
        })
    })
    var WoE = Promise(function(R){ R.withoutErrors("OK") });
    WoE.then(function(V){ T.is(V,'OK', WoE+' resolve without errors') });

    var Chained = Promise.fulfill(Promise.fulfill('OK'))
    Chained.then(function(V){ T.is(V,'OK', Chained+' chained promise resolve') });

    var msg = 'Promise that fails without catch throws the error';
    require('domain').create()
        .on('error', function(E){  T.is(E.message,'boom',msg) })
        .run(function() {
            var P = Promise(function(R){ R(new Error('boom')) });
            msg = P+" "+msg;
            P.then(function(V){ T.fail(msg) })
        });
});

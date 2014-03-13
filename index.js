"use strict";
var soon = require('./soon.js');
var is_thenable = function (P) { return P!=null && typeof(P.then)==='function' }

var id = 0;
var Promisable = module.exports = function Promisable(resolvecb) {
    var chained = [];
    var sendResult = null;
    var chaincount = 0;
    var passThroughErrors = false;
    var objid = ++id;
    var resolve = function resolve() {
        if (sendResult) { throw new Error(promisable+" already resolved") }
        var A = arguments;
        if ( A.length == 1 && is_thenable(A[0]) ) {
            if (A[0].promiseableResolve) {
                A[0].promisableResolve(promisable,resolve);
            }
            else {
                A[0].then(resolve.fulfill, resolve.reject);
            }
        }
        else if ( A.length == 2 && A[0]==null && is_thenable(A[1]) ) {
            if (A[1].promiseableResolve) {
                A[1].promisableResolve(promisable,resolve);
            }
            else {
                A[1].then(resolve.fulfill, resolve.reject);
            }
        }
        else {
            sendResult = function(){ chained.forEach(function(T){ ++chaincount; T.apply(null,A) }); chained=[] }
            if (chained.length) sendResult();
            if (A[0]==null || chaincount>0 || passThroughErrors) return;

            soon.nextTick(function() {
                if (chained.length) sendResult();
                if (chaincount>0 || passThroughErrors) return;
                throw A[0];
            });
        }
    };

    resolve.toString = function () { return "Promise(#"+objid+")" }

    resolve.passThroughErrors = function () { passThroughErrors = true }

    resolve.fulfill = resolve.withoutErrors = function () {
        var A = Array.prototype.slice.call(arguments);
        A.unshift(null);
        resolve.apply(null, A);
    };

    resolve.reject = function (E) {
        if (arguments.length > 0 && (arguments.length!=1 || E!=null)) {
            resolve.apply(null,arguments);
        }
        else {
            resolve(new Error("Promise rejected"));
        }
    };

    var chainedErrorHandler = true;

    var promisable = function(then) {
        if (sendResult) { soon.nextTick(sendResult) }
        var chained_promise = Promisable( function (chained_resolve) {
            chained.push(function() {
                try {
                    var value = then.apply(null,arguments);
                    var next_result = typeof(value) !== 'undefined' ? [null,value] : arguments;
                    if ((passThroughErrors || chainedErrorHandler) && ! is_thenable(value)) {
                        chained_resolve.passThroughErrors();
                    }
                    chained_resolve.apply(null, next_result);
                }
                catch (e) {
                    chained_resolve(e);
                }
            });
        });
        return chained_promise;
    }
    promisable.toString = resolve.toString;
    promisable.promisableResolve = function(resolve) {
        if (sendResult) soon.nextTick(sendResult);
        chained.push(function() {
            resolve.apply(null,arguments);
        });
    }

    promisable.then = function (success,failure) {
        if (!failure) chainedErrorHandler = false;
        return promisable(function (E,V) {
            if (E==null) {
                if (success) return success(V);
            }
            else {
                if (failure) return failure(E);
            }
        });
    };
    promisable.thenPromise = function (resolvecb) {
        var args = arguments;
        return promisable.then(function(){ return Promisable.apply(null,args) });
    };
    promisable.catch = function (failure) { return promisable.then(null,failure) };
    promisable.finally = function (action) {
        chainedErrorHandler = false;
        return promisable(action);
    }

    try {
        var A = Array.prototype.slice.call(arguments,1);
        A.unshift(resolve);
        resolvecb.apply(null,A);
    }
    catch (E) {
        resolve(E);
    }


    return promisable;
};
Promisable.resolve = function (E,V) { return Promisable(function(R){ R(E,V) }) }
Promisable.fulfill = function (V) { return Promisable(function(R){ R.fulfill(V) }) }
Promisable.reject  = function (E) { return Promisable(function(R){ R.reject(E) }) }
Promisable.andMaybeCallback = function (then,resolvecb) { var P = Promisable(resolvecb); if (then) P(then); return P; }

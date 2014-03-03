"use strict";

var is_undefish = function (V) { return V===null || typeof(V) === 'undefined' }
var is_thenable = function (P) { return (! is_undefish(P)) && typeof(P.then)==='function' }
var soon;
if (process && process.nextTick) {
    // We have to wrap older Node as error domains may swap out what
    // process.nextTick actually refers to =(
    soon = (process.versions && process.versions.node && process.versions.node < '0.11')
         ? function (CB) { process.nextTick(CB) }
         : process.nextTick;
}
else {
    soon = setImmediate ? setImmediate : function (CB) { setTimeout(CB,0) }
}

var Promisable = module.exports = function Promisable(resolvecb) {
    var chained = [];
    var sendResult = null;
    var chaincount = 0;
    var passThroughErrors = false;

    var resolve = function resolve() {
        if (sendResult) { throw new Error("Promisable already resolved") }
        var A = arguments;
        if ( A.length == 1 && is_thenable(A[0]) ) {
            A[0].then(resolve.fulfill, resolve.reject);
        }
        else if ( A.length == 2 && is_undefish(A[0]) && is_thenable(A[1]) ) {
            A[1].then(resolve.fulfill, resolve.reject);
        }
        else {
            sendResult = function(){ chained.forEach(function(T){ ++chaincount; T.apply(null,A) }); chained=[] }
            if (chained.length) sendResult();
            if (is_undefish(A[0]) || chaincount>0 || passThroughErrors) return;

            // If we were resolved with an error and there are no attached
            // handlers for it.
            soon(function() {
                if (chained.length) sendResult();
                if (chaincount>0 || passThroughErrors) return;
                throw A[0];
            });
        }
    };

    resolve.passThroughErrors = function () { passThroughErrors = true }

    resolve.fulfill = resolve.withoutErrors = function () {
        var A = Array.prototype.slice.call(arguments);
        A.unshift(null);
        resolve.apply(null, A);
    };

    resolve.reject = function (E) {
        if (arguments.length > 0 && (arguments.length!=1 || !is_undefish(E))) {
            resolve.apply(null,arguments);
        }
        else {
            resolve(new Error("Promise rejected"));
        }
    };

    try {
        var A = Array.prototype.slice.call(arguments,1);
        A.unshift(resolve);
        resolvecb.apply(null,A);
    }
    catch (E) {
        resolve(E);
    }

    var chainedErrorHandler = true;

    var promisable = function(then) {
        if (sendResult) { soon(sendResult) }
        var chained_promise = Promisable( function (chained_resolve) {
            chained.push(function(E) {
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
    };
    promisable.then = function (success,failure) {
        if (!failure) chainedErrorHandler = false;
        return promisable(function (E,V) {
            if (is_undefish(E)) {
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
    return promisable;
};
Promisable.resolve = function (E,V) { return Promisable(function(R){ R(E,V) }) }
Promisable.fulfill = function (V) { return Promisable(function(R){ R.fulfill(V) }) }
Promisable.reject  = function (E) { return Promisable(function(R){ R.reject(E) }) }
Promisable.andMaybeCallback = function (then,resolvecb) { var P = Promisable(resolvecb); if (then) P(then); return P; }

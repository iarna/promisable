"use strict";

var is_undefish = function (V) { return V===null || typeof(V) === 'undefined' }
var is_thenable = function (P) { return (! is_undefish(P)) && typeof(P.then)==='function' };

var Promisable = module.exports = function Promisable(resolvecb) {
    var todo = [];
    var result = null;

    var resolve = function resolve() {
        if (result) { throw new Error("Promisable already resolved") }
        var A = arguments;
        if ( A.length == 1 && typeof(A[0])==='function' ) {
            A[0]( resolve );
        }
        else if ( A.length == 1 && is_thenable(A[0]) ) {
            A[0].then(resolve.fulfill, resolve.reject);
        }
        else if ( A.length == 2 && is_undefish(A[0]) && is_thenable(A[1]) ) {
            A[1].then(resolve.fulfill, resolve.reject);
        }
        else {
            (result = function(){ todo.forEach(function(T){ T.apply(null,A) }); todo=[] })();
        }
    };

    resolve.fulfill = resolve.withoutErrors = function () {
        var A = Array.prototype.slice.call(arguments);
        A.unshift(null);
        resolve.apply(null, A);
    };

    resolve.reject = function (E) {
        if (arguments.length > 0) {
            resolve.apply(null,arguments);
        }
        else {
            resolve(new Error("Promise rejected"));
        }
    };

    try {
        resolvecb(resolve);
    }
    catch (E) {
        resolve(E);
    }

    var promisable = function(then) {
        if (result) { process.nextTick(result) }
        return Promisable( function (chained_resolve) {
            todo.push(function() {
                var value = then.apply(null,arguments);
                var next_result = typeof(value) === 'undefined' ? arguments : [null,value];
                chained_resolve.apply(null, next_result);
            });
        });
    };
    promisable.then = function (success,failure) {
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
        return promisable.then(function(){ return Promisable(resolvecb) });
    };
    promisable.catch = function (failure,success) { return promisable.then(success,failure) };
    promisable.finally = promisable;
    return promisable;
};
Promisable.resolve = function (E,V) { return Promisable(function(R){ R(E,V) }) }
Promisable.fulfill = function (V) { return Promisable(function(R){ R(null,V) }) }
Promisable.reject  = function (E) { return Promisable(function(R){ R(E) }) }
Promisable.withCB = function (then,resolvecb) { var P = Promisable(resolvecb); if (then) P(then); return P; }

Promiseable
-----------

Promises meet continuables 

Features
--------

* Minimal implementation, lower conceptual overhead to reading code.
* Can either directly call the result a la continuables and get node
  callback style args,
* Or use then(do,else) or catch(else) methods for a promise-style API.
* Both forms are chainable and composable (if you resolve with another
  promisable or promise then the result of the other promisable/promise
  will be used as the result of this one.

Deviations From Prior Art
-------------------------

* Continuables, as defined by creationix, take signature of (onFullfill,onReject)
  much like the `then` method in Promises/A+, where onFullfill's signature
  (value) and onRejec's is (error). By contrast, promisables take a
  signature of (onContinue), whose signature is (error,result), just like
  with normal node callbacks.
* Promises/A+ make resolving a promise more then once silently ignored.
  Resolving the same promise more then once is an error and should throw an
  exception rather then just ignoring its input. (One might argue that
  resolving a promise with the same result shouldn't be an error. Pull
  requests would be welcome.)
* Promises/A+ says that resolving a promise should always wait until
  nextTick to execute already existing callbacks. This slows down processing
  without any actual value. Proponents of this conflate this with ensuring
  that callback is not immediately called when it is declared, which is
  valuable. (Relatedly, some implementations execute EACH callback in its
  own nextTick callback, further slowing them down.)

Usage
-----

To return one from your library:

    var Promisable = require('promisable');

    function example() {
        return Promisable(function (resolve) {
            fs.open( '/file', 'r', resolve );
        });
    }

To use one like a continuable kind of thing:

    example()(function (err,fd) {
        if (err) {
            // ...
            return;
        }
        // ...
    });

To use one like a promise:

    example()
        .then(function(fd) {
            // ...
        ,function(error) {
            // ...
        });

    // Or with chaining and a catch method, which I prefer:
    example()
        .then(function(fd) {
            // ...
        })
        .catch(function(err) {
            // ...
        });

Constructing
------------

The module export is a function that when called, will return a new
promisable.  For the purposes of this documentation we will assume you named
it `Promisable`.

* `Promisable(callback = function(resolve)) -> promise`

Your `callback` will immediately be called with a `resolve` object as
described below.  This will execute before the promise is returned.

If `callback` throws an exception, the promise will be resolved in error
with the exception object.


Resolver Object
---------------

* `resolve(error, result)`

This completes the promise and ultimately calls the promise callbacks below
with the error or result.

* `resolve(promise)`

If you pass a promise as a value to resolve, it will use the result of that
promise to resolve this promise.

* `resolve.fulfill(result)`
* `resolve.reject(error)`

If you prefer to use a separate method for values and errors, you can use
fulfill and reject.  Like resolve, they will accept a promise as an
argument.


Promise Object
--------------

As an end user, consuming promises from libraries, this is the only section
you really care about.

All of these functions return a promise that will be resolved after the
callback is called with its return value.  If there is no return value then
it will be resolved with same result it was resolved with.

These callbacks will never be called immediately when you declare them, even
if the promise is already resolved.  If the promise IS already resolved,
they'll be executed at nextTick.  If it is NOT resolved, they'll be executed
AS SOON as the promise is resolved.

* `promise(callback = function(error,result) ?-> resolveWith) -> promise`

When the promise is resolved, your callback will be called with
`(error,result)` arguments, like typical node callbacks.

* `promise.then(callback = function(result) ?-> resolveWith) -> promise`

If a promise is resolved successfully, your callback will be called with the
result.

* `promise.catch(callback = function(error) ?-> resolveWith) -> promise`

If a promise is rejected/resolved with an error, your callback will be
called with that error.

Interop
-------

For the most part, these are compatible with Promises/A+ and their ilk, in
so far as you can resolve an A+ promise with a promisable and vice versa.

Prior Art
---------

* w3c

* commonjs

* continuables

* etc

* futures / scala

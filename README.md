Promisable
----------

Promises meet continuables

Making Promises
---------------

    var Promisable = require('promisable');

Let's make a promise that'll be resolved with the contents of a directory.

    var promise = Promisable(function(resolve){
        fs.readdir('/', resolve);
    });

You'll notice that the resolve function can be used directly for Node
callbacks.  That's because it has a signature of `(error,value)`, just like
most callbacks.

For callbacks that don't produce errors you can pass through
resolve.withoutErrors which has a signature of `(value)`.

    var promise = Promisable(function(resolve){
        fs.unlink('/path/to/file', resolve.withoutErrors);
    });

Of course, you can directly call resolve yourself:

    var promise = Promisable(function(resolve){ resolve(null, 23) });

Or:

    var promise = Promisable(function(resolve){ resolve.fulfill(23) });

Similarly, you can resolve with an error:

    var promise = Promisable(function(resolve){ resolve(new Error("Bad")) });

Or:

    var promise = Promisable(function(resolve){ resolve.reject(new Error("Bad")) });

Or even:

    var promise = Promisable(function(resolve){ throw new Error("Bad") });

We also have shortcuts for making pre-resolved promises:

    var promise = Promisable.resolve(error,value);
    var promise = Promisable.fulfill(value);
    var promise = Promisable.reject(error);

Promising Time
--------------

When a promise is resolved its callbacks are called as soon as possible, but
no sooner then nextTick after the promise object is created.  This means
that:

    Promisable(function(R){ R.fulfill(23) })
        .then(function(V){ console.log(V) });

Will print 23 at nextTick, but that:

    Promisable(function(R){ setTimeout(function(){ R.fulfill(23) }, 1000)
        .then(function(V){ console.log(V) });

Will print 23 in one second, at the moment the setTimeout callback is
called.

Using Promisables
-----------------

    var promise = Promisable(function(resolve){
        fs.readdir('/', resolve);
    });

So imagine we have the promise from above:

    promise(function(error, files) {
        if (error) { console.error( error ); return }
        // do stuff with files
    });

The above is straight forward and looks not entirely unlike a continuable.
But because these are full fledged promises you can chain them:

    promise(function(error, files) {
        if (error) { console.error( error ); return }
        return files[0];
    })(function(error, filename) {
        if (error) return;
        // do more things
    })

You can chain to promises too:

    promise(function(error, files) {
        if (error) { console.error( error ); return }
        return Promisable(function(resolve){ fs.unlink(files[0], resolve.withoutErrors) });
    })(function() {
        if (error) return;
        // do more things
    })

Because we also support A+ style promise APIs, including catch for capturing errors.

    promise.then(function(files) {
        return Promisable(function(resolve){ fs.unlink(files[0], resolve.withoutErrors) });
    })
    .then(function() {
        // do more things
    }, function (error) {
        console.error( error );
    })

That first pattern where we return another promise is useful enough that there's sugar for it:

    promise.thenPromise(function(resolve,files) {
        fs.unlink(files[0], resolve.withoutErrors);
    })

We also support catch:

    .then(function() {
        // do more things
    })
    .catch(function (error) {
        console.error( error );
    })

If you throw an error in your then clause (or your catch clause) it'll be
forwarded down the chain as an error/rejection:

    .then(function() {
        throw new Error("bad");
    })
    .catch(function(error) {
    })

And, *ahem*, finally, sometimes you want to execute something regardless if
it succeeded or failed.  That's where `finally` comes in:

    promise.thenPromise(function(resolve,files) {
        fs.unlink(files[0], resolve.withoutErrors);
    })
    .catch(function (error) {
        console.error( error );
    })
    .finally(function (error, value) {
        // do things
    })

Error Handling
--------------

If a promise emits an error and you haven't either caught it, or handled it
using the callback style then it will be thrown as an exception.  Think of
this as being the promise equivalent of streams and their error event.

    Promisable.reject(); // throws an exception at nextTick
    Promisable.reject().catch(function(E){ … }); // ok
    Promisable.reject()(function(E,V){ … }); // also ok
    Promisable.reject().then(function(V){ … }); // throws an exception
    Promisable.reject().then(function(V){ … }).catch(function(E){ … }); // ok
    Promisable.reject().catch(function(E){ … }).then(function(V){ … }); // also ok, but weird
    Promisable.fulfill().then(function(V){ return Promisable.reject() }); //throws an exception
    Promisable.reject().finally(function(E,V){ … }); // throws an exception
    Promisable.reject().catch(function(E){ … }).finally(function(E,V){ … }); // ok

Basically, if your promise can fail then you should always have a catch or
otherwise handle the exception.  If you don't do this, we'll throw the
exception rather then have it be silently ignored.

API Guide
---------

    var Promisable = require('promisable');

## `Promisable( resolvercb[, args...] ) -> Promise`

Arguments:

* resolvercb = function (Resolve[, args...])
* args... - Some number of arguments to pass to resolvercb when its called.

Returns:

* Promise - A new promise object.

You call the Promisable object as a function to get a new promise. The
resolvecb is called immediately to give you a Resolve object in order to
fulfill or reject the promise.

If resolvecb throws an error then the promise will be rejected with that error.

See below for details on methods on the Resolve and Promise objects.

### `Promisable.fulfill([value]) -> Promise`

Arguments:

* value - The value you want the promise resolved with

Returns:

* Promise - A new promise object already fulfilled with value (or fulfilled
  with null if no value were passed).

### `Promisable.reject([error]) -> Promise`

Arguments:

* error - The error object or message you want to reject the promise with

Returns:

* Promise - A new promise object already rejected with error. If no error
  was specified the promise will be rejected with an error object equivalent
  to `new Error("Promise rejected")`

### `Promisable.resolve(error,value) -> Promise`

Arguments:

* error - The error object or message to reject the promise with, or null not to reject.
* value - The value to fulfill the promise with

Returns:

* Promise - A promise preresolved with error and value.

## `Resolve(error,value)`
## `Resolve(promise)

Arguments:

* error - The error object or message to reject the promise with, or null not to reject.
* value - The value to fulfill the promise with
* promise - A promise to chain this promise on to

The resolve object, when called as a function, takes the same arguments as a
Node style callback, that is an error and a value.  Normally you'd only pass
one or the other, passing null for the error when you pass a value.

If you pass in a promise as the only argument to resolve, it will use the
result of that promise to resolve this one, thus chaining them.  That is,
the following two lines are semantically identical:

    Resolve(promise);
    promise.then( Resolve.fulfill, Resolve.reject );

### `Resolve.fulfill(value)`
### `Resolve.withoutErrors(value)`

Arguments:

* value - The value to fulfill the promise with

The fulfill and withoutErrors resolve the promise with a value.  The
withoutErrors form is there to be passed as a callback to an async function.

As with calling Resolve as a function, if value is a promise then this
promise will chain off of value.

### `Resolve.reject(error)`

Arguments:

* error - The error to reject the promise with

If no error was specified the promise will be rejected with an error object
equivalent to `new Error("Promise rejected")`

## `Promise(resultcb) -> Promise`

Arguments:

* resultcb = function (error,value) [-> newresult]

Returns:

* Promise - A chained promise

When you call a promise as a function, you pass a callback that will be
called when the promise is resolved, or on nextTick, whichever is later.  If
the promise was rejected, the error argument will have what it was rejected
with.  If the promise was fulfilled, the value argument will have the value
it was fulfilled with.

If resultcb throws an error then the chained promise will be rejected with it.

If your callback returns a value, it will be used to fulfill the chained
promise.  If you don't return a value then the chained promise will be
resolved the same was as the current promise.

If you consume a promise this way it will be assumed you handled any errors.

## `Promise.then(thencb,errorcb) -> Promise`

Arguments:

* thencb = function (value) [-> newresult]
* errorcb = function (error) [-> newresult]

Returns:

* Promise - A chained promise

If the promise was fulfilled then thencb will be called with the value it
was fulfilled with. If it was rejected then errorcb will be called with the
value it was rejected with.

If thencb or errorcb throw an error then the chained promise will be
rejected with it.

Return values from the callbacks are handled as with calling the promise as
a function.

If you provide an errorcb then it will be assumed you handled any errors.


## `Promise.thenPromise(resolvecb) -> Promise`

Arguments:

* resolvecb = function (Resolve, value...)

Returns:

* Promise - The new promise

If the current promise is fulfilled then a new promise will be created with
resolvecb as its resolver callback.  The resolvecb callback will be passed
the usual Resolve object, plus the value that the current promise was
fulfilled with. The new promise is then returned.  Errors thrown in
resolvecb result in rejecting the new promise.

If the current promise is rejected then that reject is just chained through
to the returned promise.

## `Promise.catch(errorcb) -> Promise`

Arguments:

* errorcb = function (error) [-> newresult]

If the promise was rejected then errorcb will be called with the error it
was rejected with.

If errorcb throws an error then the chained promise will be rejected with
it.  If errorcb returns a value then the chained promise will be fulfilled
with it.  If nothing is returned then the chained promise will be rejected
with the same error the current promise was.

If you have a catch it will be assumed you handled any errors.  If you
didn't handle the error and want to pass it on to a later catch, throw the
error.

## `Promise.finally(resultcb) -> Promise`

Arguments:

* resultcb = function (error,value) [-> newresult]

This works exactly the same as calling the Promise as a function, except
that using a finally clause does not count as handling any errors.  Finally
clauses are intended for things that should happen regardless of error
status.

Features
--------

How exactly does this stand out from the dozens of other promise
implementations?

* Errors have to be handled or they'll be thrown, saving you from having to
  debug the phantom promise problem.
* Very small code size compared to other promise implementations due to
  taking a mostly functional point of view.  OO bits are more sugar then
  implementation. (Why do you care that it's small? It's easier to keep it
  all in your head.)
* Easy to produce code that lets your users, not you, decide their preferred
  metaphor-- be that callbacks, continuations or promises.

Interop
-------

For the most part, these are compatible with Promises/A+ and their ilk, in
so far as you can resolve an A+ promise with a promisable and vice versa.
There are specific tests for Q and bluebird.

Deviations From Promises
------------------------

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
* Not catching errors is fatal-- to the best of my knowledge, no one else
  does this.


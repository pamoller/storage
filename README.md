#Storage

##use storages in webbrowsers easily

With [Storage](http://pamoller.com/Storage.html) there is no need to implement different types of data storages in webbrowsers. Storage is an Open Source Javascript Library who provides a unified and asynchronus API to store Javascript objects in one of the underlying data storages: [IndexedDB](http://www.w3.org/TR/IndexedDB/), [WebSQL](http://www.w3.org/TR/webdatabase/) or [localStorage](http://www.w3.org/TR/webstorage/). The objects are stored in data stores and referenced by a unique key simliar to the IndexedDB API.

    try { 
     var stg = Storage.autoConnect(); // constructor
     var crq = stg.init({db: 'storages', version:2, stores:['datas']}); // initialization
     crq.onsuccess = function() {
       var req = stg.put({key: 'XQ121', datas:[5,7,8,9]}, 'XQ121', 'datas'); // asynchronous operation
       req.onsuccess = function(obj) {console.log('inserted successfully');}
       req.onerror = function(code, msg) {throw new Error(code);}
     }
    } catch(e) {
      alert('no storage available');
    }

##Introduction

Currently there are three different types of permanent data storages in webbrowsers. localStorage is found on most webbrowsers, but it is not a database like IndexedDB or WebSQL. So localStorage is the most unadvanced choice. The most advanced choice is IndexedDB. But implementations are not found on all browsers. Safari and Opera don't support IndexedDB. They serve WebSQL. But the WebSQL standard is dropped from development for years. IndexedDB is it's replacement. It is an API for databases of records holding simple values and hierachical objects. Storage serves a unified API for storeing Javascript objects refrenced by keys similar to IndexedDB API, even if no IndexedDB implementation is found. In this cases WebSQL or LocalStorage are used as underlying data storage. The storages are accessed technically by StorageObjects. There are three types: Storage.IndexedDB, Storage.WebSQL and Storage.LocalStorage.

##Storage interface

The top level object Storage provides an interface for createing StorageObjects. To choose the best accessible storage of the browser use Storage.autoConnect:

`StorageObject Storage.autoConnect ( String db, String store )`

The first parameter is the name of the database, who is connected. The secound parameter is a handy default for the store-parameter. If set, store parameter of many method calls can be obmitted. Both parameters are optional. Storage.autoConnect returns the first StorageObject that can be created successfully in order from: Storage.IndexedDB, Storage.WebSQL or Storage.LocalStorage. If no StorageObject can be created the  exception is thrown.

    try {
      var stg = Storage.autoConnect();
    } catch(e) {
      alert("no storage available");
    }

To create a StorageObject of either IndexedDB, WebSQL or LocalStorage use:

`Storage.IndexedDB Storage.connectIndexedDB ( String db, String store )`

`Storage.WebSQL Storage.connectWebSQL ( String db, String store )`

`Storage.LocalStorage Storage.connectLocalStorage ( String db, String store )`

The parameter list and their handling is the same as for the autoConnect-method. The methods return a StorageObject of the requested type, or the  exception is thrown.

    try {
      var localStg = Storage.connectLocalStorage(); // use default db: storage
      var sqlStg = Storage.connectWebSQL('websql');
      var idxStg = Storage.connectIndexedDB('idx', 'defaultStore');
    } catch(e) {
      alert("some storage is not available");
    }

##StorageRequest interface

Most of StorageObject methods returns a StorageRequest object. The request object, can be used to define the success, error and complete callbacks.

`function onsuccess ::= null`

`function onerror ::= null`

`function oncomplete ::= null`

The success callback recives the result of the request as first parameter. The error callback recives the error code and a textual error message as input parameters. The complete callback recives no input parameters and is called last.

    try {
      var obj =  {key:'X17', values:[2,6,3]};
      var stg = Storage.autoConnect();
      var req = stg.put(obj, obj.key, 'datas');
      req.onsuccess = function(req) {}
      req.onerror = function(code, msg) {}
      req.oncomplete = function() {}
    } catch(e) {
      alert("no storage available");
    }

The request object servers has several instance variables:

`int onsuccessCounter ::= 0`

onsuccessCounter counts the number of invocations of the success callback.

`Number errorCode ::= undefined`

errorCode is the error code of the last error.

`String errorMessage ::= undefined`

errorMessage is a human readable error message of the last error.

`Array stack ::= []`

stack is a helper array to store [filtered results]() from onscussess handler. It allows to implement map-reduce.

`Boolean stackClosed ::= false`

stackClosed is also helper variable for marking stack as closed.

`Array timerids ::= []`

timerids is the array of all timerids started by the request. The first timerid is the timerid of the request itself.

##StorageObject interface

All types of StorageObjects (Storage.IndexedDB, Storage.WebSQL or Storage.LocalStorage) serve the same interface. The StorageObject has at least two instance variables:

`String db ::= storage`

The name of the connected database. It can be set by the [Storage interface]() and be overwritten by the configuration object of the init method, see below. By default the database storage is connected.

`String store ::= null`

store is a handy default for the store-parameter. If, set it can be obmitted in the call of the following methods.

A data storage has to be initialized first by init:

`StorageRequest init ( Object {db:String, version:Number, stores:Array, deleteStores:Array} )`

The configuration object includes all information to set up a database and the data stores. If version is not a valid number greater than 1 the error callback with error code 2 is fired. stores references an array of stores to be created, deleteStores an array of stores to be deleted.

If you want to initialize or upgrade the database, the version number must be *higher* than the *actual version* number. *Use at least 2 as minimum version, cause 1 is the version of the vacuum database*. If version is not higher, init terminates successfully. When initializing or upgradeing the stores referenced by stores are created (if not existing) and the stores referenced by deleteStores are deleted. Deletion takes place before creation. So you can reinitialize stores with the init.

    try {
      var stg = Storage.autoConnect();
      var req = stg.init({version:2, stores:['bluedor', 'reddor'], deleteStores:['reddor']});
      req.onsuccess = function() { }; // import defaults to stores
    } catch(e) {
      alert("no storage available");
    }

*Note:* Changes of the database configuration need exclusive rights. So it can be done only secure, if all opened database connections are closed before. If there remains open database connections, the change operation waits until they will be finished also. So - best call init only as first database operation. Otherwise your applicatin may hang. It is not a problem of Storage, it is given by the design of the underlying storages.

    try {
      var stg = Storage.autoConnect();
      stg.init({version:1, stores:[bluedor]}); // nothing to do
      stg.init({version:2, stores:[bluedor]}); // initilization only
      stg.init({version:3, stores:[bluedor]}); // blocks initilization, if actual version is 1
    } catch(e) {
      alert("no storage available");
    }

To populate the storage with records or update existing use put:

`StorageRequest put ( Object obj, key key, String store )`

The first parameter is the object to be stored. The second is the key. If key is not valid the error callback with error code 6 is fired. The third parameter the name of the data stores. store is optional, as long the default instance variable store is not null. If store is not an existing, the error callback with error code 5 is fired. The onsuccess callback is called with obj as result. To read obejcts from the storage use get:

`StorageRequest get ( key key, String store )`

The first parameter has to be a valid key, the second an existing store. The error handlig is same as for put. The onsuccess callback is called with the requested object. If no object can be found by key, the error callback is called with eroorcode 4.

    try {
      var stg = Storage.autoConnect();
      var req = stg.get("unsure", "probably");
      req.onsuccess = function(res) {
        show_result(res);
      };
      req.onerror = function (code, msg) {
        switch(code) {
          case 4:
            alert("there is no object referenced by this key");
          break;
          case 5:
            alert("data store does not exist");
          break;
          case 6:
            alert("key is not a valid key");
          break;
        }
      }
    } catch(e) {
      alert("no store available");
    }

To read all objects of a data store or to a map-reduce over this set use list:

`StorageRequest list ( String store )`

list accepts only one parameter. If store is not a valid data store, even the instance variable of StorageObject set before, the error callback is fired with error code 5. The onsuccess callback is called for  record in the data store. If the data store is empty the error callback is fired with error code 3.

The onsuccess handler can be used to filter the objects by a map-reduce. Therefore all selected objects are put to the request's stack. The completed stack is accessiable by the oncomplete handler, as shown in the following example of a pageing.

    try {
     var stg = Storage.autoConnect();
     for(var i = 0; i < 100; i++) {
       var obj = {key: i, vaule: i}; // key is 0...99
       stg.put(obj, obj.key, 'datas'); // populate the data store
     }
     var req = stg.list('datas'); // map
     req.onsuccess = function(res) { // reduce
       if  (10 <= res.key < 20) { // filter objects of second page
         req.stack.push(res);
       }
     };
     req.oncomplete = function(res) {
      show_results(req.stack); // show second page
      };
    } catch(e) {
      alert("no storage available");
    }

To empty a data store use the clear:

`StorageRequest clear ( String store )`

The parameter list and their handling is the same as for list. The onsuccess callback is called with an empty result.

##Error Codes


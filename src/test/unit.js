jQuery(document).ready(function() {
  var last = null; // should be found by Storage.autoConnect

  if (window.localStorage) {
    last = bundle("localStorage (no defaults)", Storage.LocalStorage, undefined, undefined, 'bluedor');
    last = bundle("localStorage", Storage.LocalStorage, 'db', 'reddor', undefined);
  }
  if (window.openDatabase) {
    last = bundle("WebSQL (no defaults)", Storage.WebSQL, undefined, undefined, 'bluedor');
    last = bundle("WebSQL", Storage.WebSQL, 'db', 'reddor', undefined);
  }
  if (window.IndexedDB || window.webkitIndexedDB || window.mozIndexedDB) {// not yet || window.msIndexedDB) {
    last = bundle("IndexedDB (no defaults)", Storage.IndexedDB, undefined, undefined, 'bluedor');
    last = bundle("IndexedDB", Storage.IndexedDB, 'db', 'reddor', undefined);
  }

  test("Storage.autoConnect", function() {
    ok(Storage.autoConnect() instanceof last, "found best data Storage");
  });  

  function bundle(label, storage, db, defStore, store) {	
    var version = new Date().getTime();
    var obj1 = {key:'abc', arr:[{1:2}, 4], created:version};
    var obj1m = {key:'abc', arr:[{1:3}, 4], created:version};
    var obj2 = {key:'def', created:version, arr:null};
    var deleteStore = 'reddor';

    module(label)

    test("this.versionString()", function() {
      strictEqual(false, new storage().versionString({}), "No version string");
      strictEqual(true, new storage().versionString({version:version}), "Correct version string");
      strictEqual(false, new storage().versionString({version:"abc"}), "Incorrect type of version string");
    });

    asyncTest("this.init()", function() {
	  asyncStart(2); // don't forget do apply here!
      handler(new storage(db, defStore).init({version:version, stores: [store?store:defStore, deleteStore], deleteStores:[deleteStore]}), 'init');		
	});

    asyncTest("this.init() - reinit same version", function() {
	  asyncStart(2);
      handler(new storage(db, defStore).init({version:version, stores: [store?store:defStore]}), 'reinit');		
	});

    asyncTest("this.version()", function() {
	  asyncStart(2);
      handler(new storage(db, defStore).version(), "actual db version", function(res) {
        equal(res, version, "actual db version");
        start();
      });
    });

    // it hangs if db connections before are not closed!!
    asyncTest("this.init() - next version", function() {
	  asyncStart(2);
      handler(new storage(db, defStore).init({version:version+1, stores: [store?store:defStore]}), 'next version');		
	});

    asyncTest("this.init() - oncomplete", function() {
	  asyncStart(4);
      var orq = new storage(db, defStore).init({version:version+2, stores: [store?store:defStore]});		
      orq.oncomplete = function() {
        handler(new storage(db, defStore).put(obj1, obj1.key, store), 'insert by put', function(res) {
          deepEqual(res, obj1, 'insert by put');
          start();
        });
        handler(new storage(db, defStore).clear(store), "clear store");
      }; 
	});
	
    asyncTest("this.get()", function() {
	  asyncStart(6);
	  err_handler(new storage(db).get(undefined, undefined), 5, "store not present");
      err_handler(new storage(db, defStore).get(undefined, store), 6, "not a key");
      err_handler(new storage(db, defStore).get("not existing", store), 4, "object does not exist");
	});

    asyncTest("this.put()", function() {
	  asyncStart(4);
	  err_handler(new storage(db, undefined).put({}, undefined, undefined), 5, "store not present");
	  err_handler(new storage(db, defStore).put({}, undefined, store), 6, "not a key");
	});

    asyncTest("this.list()", function() {
	  asyncStart(4);
	  err_handler(new storage(db).list(undefined), 5, "store not present");
	  err_handler(new storage(db, defStore).list(store), 3, "no objects in store");
	});

    asyncTest("this.delete()", function() {
	  asyncStart(6);
	  err_handler(new storage(db).delete(undefined, undefined), 5, "store not present");
	  err_handler(new storage(db, defStore).delete(undefined, store), 6, "not a key");
	  err_handler(new storage(db, defStore).delete("not existing", store), 4, "obj does not exist");
	});

    asyncTest("this.clear()", 2,  function() { //todo missing asyncStart - bug not trivial!
	  err_handler(new storage(db).clear(undefined), 5, "store not present");
	});



/*    QUnit.log(function( details ) {
      console.log( "Log: ", details.result, details.message );
    });*/

    asyncTest("Data lifetime cycle", function() {
      asyncStart(26);
      handler(new storage(db, defStore).put(obj1, obj1.key, store), 'insert by put', function(res) {
        deepEqual(res, obj1, 'insert by put');
        start();
      });

      handler(new storage(db, defStore).put(obj1m, obj1m.key, store), 'update by put', function(res) {
	    deepEqual(res, obj1m, 'update by put');
	    start();
	  });

      handler(new storage(db, defStore).get(obj1m.key, store), 'reread object', function(res) {
        deepEqual(res, obj1m, 'reread object');
        start();
	  });

	  handler(new storage(db, defStore).list(store), 'list object', function(res) {
        deepEqual(res, obj1m, 'list object');
        start();
	  });
	  
	  handler(new storage(db, defStore).delete(obj1m.key, store), 'delete object', function(res) {
        deepEqual(res, obj1m.key, 'delete object');
        start();
      });

      err_handler(new storage(db, defStore).get(obj1m.key, store), 4, 'obj not in store');

	  err_handler(new storage(db, defStore).list(store), 3, 'store is empty');
      
      handler(new storage(db, defStore).put(obj1, obj1.key, store), 'insert fst object by put', function(res) {
        deepEqual(res, obj1, 'insert fst object by put');
        start();
      });

      handler(new storage(db, defStore).put(obj2, obj2.key, store), 'insert sec object by put', function(res) {
        deepEqual(res, obj2, 'insert sec object by put');
        start();
      });

      handler(new storage(db, defStore).list(store), "list objects", function(res, cnt) {
		if (cnt == 1) {
          deepEqual(res, obj1, 'List first inserted object first');
        } else if (cnt == 2) {
		  deepEqual(res, obj2, 'List second inserted object second');
		} else {
		  ok(false, 'Result not allowed in list');
		}
        start();
	  });

      var res = []
      var stg = new storage();
      for(var i = 0; i < 100; i++) {
         var obj = {key: i, vaule: i}; 
         stg.put(obj, i, store);
         if ( 10 < i < 100) {
           res.push(obj);
         }
      }
      var req = stg.list(store);
      req.onsuccess = function(res) {
	    if ( 10 < res.key < 100) {
		  req.stack.push(res);
		}
	  };	 
      req.oncomplete = function(res) {
        deepEqual(res, req.stack, 'Can ref all listed items');
        start();   
	  }
         
      handler(new storage(db, defStore).clear(store), "clear store");
      
	  err_handler(new storage(db, defStore).list(store), 3, 'store is empty');

    });  

    return storage;
  }
   
  function asyncStart(expected) {
    expect(expected);
    stop(expected-1);
  }
  
  function error(c, m, msg) {
    return "fatal error: "+c+" "+m.name+" on: "+msg;
  }  

  function handler(req, title, succ, err, comp) {
    req.onsuccess = (typeof succ === 'function')?succ:success(title);
    req.onerror = (typeof err === 'function')?err:failure(title);
    req.oncomplete = success("completed request: "+title);
  }

  function err_handler(req, code, msg) {
    req.onsuccess = function() {ok(false, msg); start();},
    req.onerror = function(c, m) {equal(c, code, msg); start();}
    // errcode set after call of error handler!!
    req.oncomplete = function() {equal(code, req.errorCode, "completed: "+msg); start();}
  }

  function success(msg) {
    return function() {ok(true, msg); start();};
  }
  
  function failure(msg) {
	return function(c, m) {ok(false, error(c, m, msg)); start();};
  }
});
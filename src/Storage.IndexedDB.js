Storage.IndexedDB = function(db, store) {
  this.initDefaults(db, store);
  this.indexedDB = this.storageInit();  // reference to indexedDB
}

Storage.IndexedDB.prototype = new Storage.Prototype();
Storage.IndexedDB.prototype.constructor = Storage.IndexedDB;

Storage.IndexedDB.prototype.storageInit = function() {
  var ref = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB; // await MSIE 10 || window.msIndexedDB;
  if (!ref) {
    throw new Error('NOTASTORAGE');
  }
  return ref;
}

/** api functions **/
Storage.IndexedDB.prototype.initRequest = function(req, cfg) {  
  if (cfg) { // pass on no config
    if (req.ref.hasProperty(cfg, 'version') && req.ref.versionString(cfg)) { // version required
      var orq = this.indexedDB.open(this.db);
      orq.onsuccess = function(e) {
        // important for upgradeneeded or onchange event,
        // it hangs otherwise!
        e.target.result.close();
        // chrome opens initial to '', firefox to '1'
        var vers = e.target.result.version;
        if (vers === ''  || vers === 1 || vers < cfg.version) { //todo testing +1
		// this gurantees that initialization takes place only if wanted!
          req.ref.changeRequest(req, cfg);
        } else {
          req.finish();
        }
      };
      orq.onerror = req.ref.onerror(req);
    } else {
      req.abort(2, 'version missing or not a number');
    }
  } else {
    req.finish();
  }
};

Storage.IndexedDB.prototype.changeRequest = function(req, cfg) {
  if (req.ref.versionString(cfg)) {
    // can not upgrade if opened before any db connection!!
    var orq = req.ref.indexedDB.open(req.ref.db, cfg.version);
    // firefox (standard conform)
    orq.onupgradeneeded = function(e) {
      req.ref.initStores(req, cfg, e.target.result);
      e.target.result.close(); // experimental !!
    }; 
    // chormium (not standard conform)
    orq.onsuccess = function(e) {
      if (e.target.result.setVersion) { //chormium?!
        var crq = e.target.result.setVersion(cfg.version);
        crq.onsuccess = function(e) {
          req.ref.initStores(req, cfg, e.target.source);
          e.target.source.close(); // experimental !!
  	    }
  	    crq.onerror = req.ref.onerror(req);
  	  }
    };
    orq.onerror = req.ref.onerror(req);
  } else {
    req.errorCallback(2, 'version missing or not a number');
  }
};

Storage.IndexedDB.prototype.clearRequest = function(req, store) {
  req.ref.open(req, store?store:req.ref.store, function(obst) {
    var rqt = obst.clear();
    rqt.onsuccess = req.ref.onsuccess(req);
    rqt.onerror = req.ref.onerror(req);
  });
};

Storage.IndexedDB.prototype.deleteRequest = function(req, key, store) {
  req.ref.open(req, store?store:req.ref.store, function(obst) {
    if (req.ref.isKey(key)) {
      var rqt = obst.get(key);
      rqt.onsuccess = function(e) {
	    if (e.target.result) {
		  var irq = e.target.source.delete(key);
		  irq.onsuccess = req.ref.onsuccess(req, key);
		  irq.onerror = req.ref.onerror(req);
		} else {
		  req.errorCallback(4, 'obj not in store');
		}
      };
      rqt.onerror = req.ref.onerror(req);
    } else {
      req.errorCallback(6, 'not a key');
    }
  });
};

Storage.IndexedDB.prototype.getRequest = function(req, key, store) {
  req.ref.openRead(req, store?store:req.ref.store, function(obst) {
    if (req.ref.isKey(key)) {
      var rqt = obst.get(key);
      rqt.onsuccess = function(e) {
	    if (e.target.result === undefined) {
		  req.errorCallback(4, 'obj not in store');
		} else {
		  req.successCallback(e.target.result);
		}
      };
      rqt.onerror = req.ref.onerror(req);
    } else {
	  // aborts transaction, cause no action!!
      req.errorCallback(6, 'not a key');
    }  		
  });
};

Storage.IndexedDB.prototype.listRequest = function(req, store) {
  req.ref.openRead(req, store?store:req.ref.store, function(obst) {
    var rqt = obst.openCursor();
  	rqt.onsuccess = function(e) {
       var cur = e.target.result; 
       if (cur) { // undefined if no actual value!
         req.successCallback(cur.value);
         cur.continue();
       } else if (req.onsuccessCounter === 0) {
		  req.errorCallback(3, 'No objects in store');
	   }
    };
    rqt.onerror = req.ref.onerror(req);
  });
};


Storage.IndexedDB.prototype.putRequest = function(req, obj, key, store) {
  req.ref.open(req, store?store:req.ref.store, function(obst) {
    if (req.ref.isKey(key)) {
       var rqt = obst.put(obj, key);
       rqt.onsuccess = req.ref.onsuccess(req, obj);
       rqt.onerror = req.ref.onerror(req);
    } else {
      req.errorCallback(6, 'not a key');
    } 
  });

};

Storage.IndexedDB.prototype.versionRequest = function(req) {
  var orq = this.indexedDB.open(req.ref.db);
  orq.onsuccess = function(e) { e.target.result.close(); req.finish(e.target.result.version)};	
  orq.onerror = function(e) {e.target.result.close(); req.errorCallback(null, e.target.error)};
};

Storage.IndexedDB.prototype.deleteDatabaseRequest = function(req) {
  var orq = req.ref.indexedDB.deleteDatabase(this.db);
  orq.onsuccess = function(e) {e.target.result.close(); req.finish(e.target.result.version)};	
  orq.onerror = function(e) {e.target.result.close(); req.errorCallback(null, e.target.error)};
}
  
/** utilities **/
Storage.IndexedDB.prototype.formatErrorMessage = function(e) {
  return 'fatal IndexedDB error message: '+this.hashValue(e, "name", "None");
};

Storage.IndexedDB.prototype.onerror = function(req) {
  return function(e) {req.errorCallback(8, req.ref.formatErrorMessage(e.target.error));};
};

Storage.IndexedDB.prototype.onsuccess = function(req, ovr) {
  return function(e) {req.successCallback(ovr?ovr:e.target.result);};
};

Storage.IndexedDB.prototype.oncomplete = function(req) {
  return function(e) {
	  e.target.db.close();
	  req.completeCallback();};
};

Storage.IndexedDB.prototype.openRead = function(req, store, cbk) {
  this.open(req, store, cbk, 0);
};

Storage.IndexedDB.prototype.open = function(req, store, cbk, mode) {
  var orq = this.indexedDB.open(req.ref.db);
  orq.onsuccess = function(e) {
	req.dbconn = e.target.result;
    try {
      req.ref.openStore(req, store, cbk, e.target.result, ((mode === 0)?0:1));
    } catch(l) {
      req.ref.openStore(req, store, cbk, e.target.result, ((mode === 0)?'readonly':'readwrite'));
    }
  };
  orq.onerror = req.ref.onerror(req);
};

Storage.IndexedDB.prototype.openStore = function(req, store, cbk, db, mode) {
  if (db.objectStoreNames.contains(store)) {
	var t = db.transaction([store], mode);
	t.onerror = req.ref.onerror(req);
	// oncomplete coupled to transaction
	// abort may happen, e.g. if no method acts!
	t.oncomplete = t.onabort = req.ref.oncomplete(req);
    cbk(t.objectStore(store));
  } else {
    req.errorCallback(5, 'store not existing');
    req.completeCallback();
  }
};

Storage.IndexedDB.prototype.initStores = function(req, cfg, db) {
  req.ref.createStores(req, cfg, db);
  req.ref.deleteStores(req, cfg, db);
  req.finish();
  db.close(); //todo why is it working?
};

Storage.IndexedDB.prototype.createStoreStatement = function(req, store, db) {
  if (!db.objectStoreNames.contains(store)) {
    db.createObjectStore(store, {autoIncrement:false});
  }
};

Storage.IndexedDB.prototype.deleteStoreStatement = function(req, store, db) {
  if (db.objectStoreNames.contains(store)) {
    db.deleteObjectStore(store);
  }
};
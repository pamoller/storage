Storage.LocalStorage = function(db, store) {
  this.initDefaults(db, store);
  this.localStorage = this.storageInit();  // reference to localStorage
};

Storage.LocalStorage.prototype = new Storage.Prototype();
Storage.LocalStorage.prototype.constructor = Storage.LocalStorage;

Storage.LocalStorage.prototype.storageInit = function() {
  if (!window.localStorage) {
    throw new Error('NOTASTORAGE');
  }
  return window.localStorage;
}

Storage.LocalStorage.prototype.changeRequest = function(req, cfg) {
  if (req.ref.versionString(cfg)) {
    req.ref.createDatabaseStatement(cfg);
    req.ref.createStores(req, cfg);
    req.ref.deleteStores(req, cfg);
    req.finish();
  } else {
    req.abort(2, 'version missing or not a number');
  }
};

Storage.LocalStorage.prototype.clearRequest = function(req, store) {
  this.open(req, store, function(qst) {
    req.ref.close(qst);
    req.finish();
  });
};

Storage.LocalStorage.prototype.deleteRequest = function(req, key, store) {
  this.open(req, store, function(qst, ocol) {
    if (req.ref.isKey(key)) {
      if (ocol.hasOwnProperty(key)) {
        delete(ocol[key]);
        req.ref.close(qst, ocol);
        req.finish(key);
      } else {
         req.abort(4, 'obj not in store');
      }
    } else {
      req.abort(6, 'not a key');
    }
  });
};

Storage.LocalStorage.prototype.getRequest = function(req, key, store) {
  this.open(req, store, function(qst, ocol) {
    if (req.ref.isKey(key)) {
      if (ocol.hasOwnProperty(key)) {
        req.finish(ocol[key]);
      } else {
        req.abort(4, 'obj not in store');
      }
    } else {
      req.abort(6, 'not a key');
    }  
  });
};

Storage.LocalStorage.prototype.listRequest = function (req, store) {
  this.open(req, store, function(qst, ocol) {
    for(var key in ocol) {
	  if (ocol.hasOwnProperty(key)) {
	    req.successCallback(ocol[key]);
	  }
	}
	if (req.onsuccessCounter === 0) {
      req.abort(3, 'no objects in store');
    } else {
	  req.completeCallback();
	}
  });
};

Storage.LocalStorage.prototype.putRequest = function(req, obj, key, store) {
  this.open(req, store, function(qst, ocol) {
    if (req.ref.isKey(key)) {
	  ocol[key] = obj;
	  req.ref.close(qst, ocol);
	  req.finish(obj);
    } else {
      req.abort(6, 'not a key');
    } 
  });
};

Storage.LocalStorage.prototype.deleteDatabaseRequest = function(req) {
  this.deleteDatabaseStatement();
  req.finish();
}

/** utilities **/
Storage.LocalStorage.prototype.hasStore = function(qstore) {
	return (this.localStorage.getItem(qstore) === null)?false:true;
}

Storage.LocalStorage.prototype.dbVersion = function() {
  var config = this.qualifiedStoreName('__config');
  if (this.hasStore(config)) {
    return this.jsonParse(this.localStorage.getItem(config))['version'];	
  }
  return 0;
}

Storage.LocalStorage.prototype.open = function(req, store, cbk, force) {
  var qstore = this.qualifiedStoreName(store);
  if (force === true || this.hasStore(qstore)) {
    cbk(qstore, this.jsonParse(this.localStorage.getItem(qstore)));
  } else {
    req.abort(5, 'store not existing');
  }
};

Storage.LocalStorage.prototype.close = function(qstore, ocol, force) {
  if (force == true || this.hasStore(qstore)) {
    this.localStorage.setItem(qstore, this.stringify((typeof ocol === "object")?ocol:{}));
  } else {
    throw new Error('store not existing');
  }
}

Storage.LocalStorage.prototype.qualifiedStoreName = function(store) {
  return (this.isStoreName(store))?this.db+'_'+store:undefined; // qualified store name
};

Storage.LocalStorage.prototype.createDatabaseStatement = function(cfg) {
  if (!this.hasStore('__config')) {
    var ocl = new Object();
    ocl.version = this.versionString(cfg)?cfg.version:0;
    this.close(this.qualifiedStoreName('__config'), ocl, true);
  }
  return true;
}

Storage.LocalStorage.prototype.deleteDatabaseStatement = function() {
  var i = 0;
  var store;
  while((store = this.localStorage.key(i++)) !== null) {
    if (store.indexOf(this.db) === 0) {
      this.localStorage.removeItem(store);
    }
  }
};

Storage.LocalStorage.prototype.createStoreStatement = function(req, store) {
  if (!req.ref.hasStore(req.ref.qualifiedStoreName(store))) {
    req.ref.close(req.ref.qualifiedStoreName(store), undefined, true);
  }
};

Storage.LocalStorage.prototype.deleteStoreStatement = function(req, store) {
  if (req.ref.hasStore(req.ref.qualifiedStoreName(store))) { 
    req.ref.localStorage.removeItem(req.ref.qualifiedStoreName(store));
  }
};
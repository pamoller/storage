Storage.Prototype = function() {};

Storage.Prototype.prototype.initDefaults = function(db, store) {
  this.db = (typeof db === "string")?db:'storage';
  this.store = (typeof store === "string")?store:null;	
}

Storage.Prototype.prototype.init = function(cfg) {
  if (this.hasType(cfg, 'db', 'string')) {
    this.db = cfg.db;
  }
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.initRequest(req, cfg);});  

  return req;
};

Storage.Prototype.prototype.initRequest = function(req, cfg) {
  if (cfg) {
    if (req.ref.hasProperty(cfg, 'version') && req.ref.versionString(cfg)) {	
      if (req.ref.dbVersion() < cfg.version) {
        this.changeRequest(req, cfg);
      } else {
        req.finish();
      }
    } else {
      req.abort(2, 'version missing or not a number');
    }
  } else {
    req.finish();
  }
};


Storage.Prototype.prototype.clear = function(store) {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.clearRequest(req, req.ref.storeValue(store))});

  return req;
};

Storage.Prototype.prototype.get = function(key, store) {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.getRequest(req, key, req.ref.storeValue(store))});

  return req;
};  

Storage.Prototype.prototype.delete = function(key, store) {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.deleteRequest(req, key, req.ref.storeValue(store))});

  return req;
};

Storage.Prototype.prototype.list = function(store) {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.listRequest(req, req.ref.storeValue(store))});

  return req;
};

Storage.Prototype.prototype.put = function(obj, key, store) {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.putRequest(req, obj, key, req.ref.storeValue(store))});

  return req;
};

Storage.Prototype.prototype.version = function() {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.versionRequest(req)});

  return req;
}

Storage.Prototype.prototype.versionRequest = function(req) {
  req.finish(req.ref.dbVersion());
};

/*
Storage.Prototype.prototype.deleteDatabase = function() {
  var req = new Storage.Request(this);
  req.asyncCall(function() {req.ref.deleteDatabaseRequest(req)});
  
  return req;	
}*/

/** utilities **/
Storage.Prototype.prototype.isKey = function(key) {
  if (typeof key != 'string') {
    return false;
  }
  return true;
}

Storage.Prototype.prototype.isStoreName = function(store) {
  return this.isKey(store);
}

Storage.Prototype.prototype.hasProperty = function(hash, prop) {
	return (hash instanceof Object && hash.hasOwnProperty(prop))?true:false;
}

Storage.Prototype.prototype.hashValue = function(hash, key, def) {
  if (hash instanceof Object && hash.hasOwnProperty(key)) {
	return hash[key];
  }
  return def;
};

Storage.Prototype.prototype.storeValue = function(store) {
  return typeof store === "string"?store:this.store;
}

Storage.Prototype.prototype.versionString = function(hash) {
  var vers = this.hashValue(hash, 'version', false);
  return (typeof vers === "number" && vers > 1)?true:false;
}

Storage.Prototype.prototype.hasType = function(hash, key, type) {
  return typeof this.hashValue(hash, key, false) === type?true:false;
}

Storage.Prototype.prototype.hasArray = function(hash, key) {
  return this.hashValue(hash, key, false) instanceof Array?true:false;
}
	  
Storage.Prototype.prototype.jsonParse = function(str) {
  return JSON.parse(str);
};

Storage.Prototype.prototype.stringify = function(obj) {
  return JSON.stringify(obj);
};

Storage.Prototype.prototype.log = function(msg) {
  if (Storage.log) {
	console.log(msg);
  }
};

Storage.Prototype.prototype.manageStores = function(req, cfg, env, key, method) {
  if (req.ref.hasArray(cfg, key)) {
    for(i=0; i<cfg[key].length; i++) {
      method(req, cfg[key][i], env);
    }
  }
};

Storage.Prototype.prototype.createStores = function(req, cfg, env) {
  req.ref.manageStores(req, cfg, env, 'stores', req.ref.createStoreStatement);
};

Storage.Prototype.prototype.deleteStores = function(req, cfg, env) {
  req.ref.manageStores(req, cfg, env, 'deleteStores', req.ref.deleteStoreStatement);
};
Storage.WebSQL = function(db, store) {
  this.initDefaults(db, store);
  this.size = 5*1024*1024;    // estimated size of database
  this.storageInit();
};

Storage.WebSQL.prototype = new Storage.Prototype();
Storage.WebSQL.prototype.constructor = Storage.WebSQL;

Storage.WebSQL.prototype.storageInit = function() {
  if (!window.openDatabase) {
    throw new Error('NOTASTORAGE');
  }
}

Storage.WebSQL.prototype.changeRequest = function(req, cfg) {
  if (req.ref.versionString(cfg)) {
    var db = this.openDB();
    db.changeVersion(req.ref.hashValue(cfg, 'lastVersion', db.version), cfg.version, function(t) {
      req.ref.createStores(req, cfg, t);
      req.ref.deleteStores(req, cfg, t);
    }, req.ref.onerrorOnChange(req), function() {req.finish();});
  } else {
    req.errorCallback(2, 'version missing or not a number');
  }
};

Storage.WebSQL.prototype.clearRequest = function(req, store) {
  req.ref.open(req, store, function(t) {
    t.executeSql('DELETE FROM '+req.ref.escape(store?store:req.ref.store), undefined, req.ref.onsuccessSQL(req), req.ref.onerrorSQL(req));
  });
};

Storage.WebSQL.prototype.deleteRequest = function(req, key, store) {
  req.ref.open(req, store, function(t) {
    if (req.ref.isKey(key)) {
      t.executeSql('DELETE FROM '+req.ref.escape(store?store:req.ref.store)+' WHERE key = ?', [key], req.ref.onsuccessSQLDelete(req, key), req.ref.onerrorSQL(req));
    } else {
      req.errorCallback(6, 'not a key');
    }
  });
};

Storage.WebSQL.prototype.getRequest = function(req, key, store) {
  req.ref.openRead(req, store, function(t) {
    if (req.ref.isKey(key)) {
      t.executeSql('SELECT obj FROM '+req.ref.escape(store?store:req.ref.store)+' WHERE key = ?', [key], req.ref.onsuccessSQLGet(req), req.ref.onerrorSQL(req));
    } else {
      req.errorCallback(6, 'not a key');
    }
  });
};

Storage.WebSQL.prototype.listRequest = function (req, store) {
  req.ref.openRead(req, store, function(t) {
  	var onsuccess =  function(t, r) {
      if (r.rows.length > 0) {
  	    for(var i = 0; i < r.rows.length; i++) {
  	      req.successCallback(req.ref.jsonParse(r.rows.item(i).obj));
  	    }
  	  } else {
        req.errorCallback(3, 'No objects in store');
      } 
  	}; 
    t.executeSql('SELECT obj FROM '+req.ref.escape(store?store:ref.req.store), undefined, onsuccess, req.ref.onerrorSQL(req));
  });
};

Storage.WebSQL.prototype.putRequest = function(req, obj, key, store) {
  req.ref.open(req, store, function(t) {
    if (req.ref.isKey(key)) {
      var onerror = req.ref.onerrorSQL(req);
      var onsuccess = function(t, r) {req.successCallback(obj)};
      t.executeSql('UPDATE '+req.ref.escape(store?store:ref.req.store)+' SET obj=? WHERE key = ?', [req.ref.stringify(obj), key], function(t,r) {
        if (r.rowsAffected === 0) {
          t.executeSql('INSERT INTO '+req.ref.escape(store?store:ref.req.store)+' (key, obj) VALUES (?, ?)', [key, req.ref.stringify(obj)], onsuccess, onerror);
        } else {
          req.successCallback(obj);
        }
      }, onerror)
    } else {
      req.errorCallback(6, 'not a key');
    }
  }, req);
};


/*Storage.WebSQL.prototype.deleteDatabaseRequest = function(req) {
  var db = this.openDB();
  db.changeVersion(db.version, '', function(t) {
	var deleteStores = [];  
    t.executeSql("SELECT name FROM sqlite_master", function() {}, //WHERE name NOT LIKE '__%' AND type='table'", function(t, r) {
      /*for(var i = 0; i < r.rows.length; i++) {
		console.log(r.rows.item(i));
	    //deleteStores.push(r.rows.item(i));
	  }* /
	  //req.ref.deleteStores(req, cfg, t);
	  //req.ref.successCallback();	    
    //},
     req.ref.onerrorSQL(req));
   }, req.ref.onerrorOnChange(req), function() {req.finish();});
}*/

/** utilities **/
Storage.WebSQL.prototype.dbVersion = function() {
  return this.openDB().version;
};

Storage.WebSQL.prototype.formatErrorMessage = function(e) {
  return 'fatal WEBSQL error code: '+this.hashValue(e, "code", "None")+'; message: '+this.hashValue(e, "message", "None");
};

Storage.WebSQL.prototype.checkStore = function(req, t, store, ref, force) {
  t.executeSql('SELECT count(*) AS cnt FROM sqlite_master WHERE name=? AND type=?', [store, 'table'], function(t, r) {
    if (r && r.rows.length > 0 && r.rows.item(0).cnt > 0) {
      ref(t);
    } else {
	  req.errorCallback(5, 'store not present');
	}
  }, req.ref.onerrorSQL(req));
}

Storage.WebSQL.prototype.openDB = function() {
  return window.openDatabase(this.db, '', '', this.size);
};

Storage.WebSQL.prototype.open = function(req, store, cbk) {
  this.openDB().transaction(function(t) {req.ref.checkStore(req, t, store, cbk);}, this.onerrorOnChange(req), this.oncomplete(req));
};

Storage.WebSQL.prototype.openRead = function(req, store, cbk) {
  this.openDB().readTransaction(function(t) {req.ref.checkStore(req, t, store, cbk);}, this.onerrorOnChange(req), this.oncomplete(req));
};
	
Storage.WebSQL.prototype.escape = function(str) {
  return str;	
};

Storage.WebSQL.prototype.onerrorOnChange = function(req) {
  return function(e) {req.errorCallback(8, req.ref.formatErrorMessage(e));};
};

Storage.WebSQL.prototype.oncomplete = function(req) {
  return function() {req.completeCallback();};
}
 
Storage.WebSQL.prototype.onerrorSQL = function(req) {
  return function(t, e) {req.errorCallback(8, req.ref.formatErrorMessage(e));};
};

Storage.WebSQL.prototype.onsuccessSQL = function(req, ovr) {
  return function(t, r) {
    var res = (r && r.rows.length > 0)?req.ref.jsonParse(r.rows.item(0).obj):undefined;
    req.successCallback(ovr?ovr:res);
  };
};

Storage.WebSQL.prototype.onsuccessSQLGet = function(req) {
  return function(t, r) {
    if (r && r.rows.length > 0) {
      req.successCallback(req.ref.jsonParse(r.rows.item(0).obj));
    } else {
      req.errorCallback(4, 'obj not in store');
    }
  };
};

Storage.WebSQL.prototype.onsuccessSQLDelete = function(req, ovr) {
  return function(t, r) {
    if (r.rowsAffected === 1) {
      req.successCallback(ovr);
    } else {
	  req.errorCallback(4, 'object not in list');
	}
  };
};

Storage.WebSQL.prototype.createStoreStatement = function(req, store, t) {
  t.executeSql('SELECT count(*) AS cnt FROM sqlite_master WHERE name=? AND type=?', [store, 'table'], function(t, r) {
    if (r && r.rows.length > 0 && r.rows.item(0).cnt == 0) {
      t.executeSql('CREATE TABLE '+req.ref.escape(store)+' (key primary key not null, obj text)', undefined, undefined, req.ref.onerrorSQL(req));
    }
  }, req.ref.onerrorSQL(req));
};

Storage.WebSQL.prototype.deleteStoreStatement = function(req, store, t) {
  t.executeSql('DROP TABLE IF EXISTS '+req.ref.escape(store), undefined, undefined, req.ref.onerrorSQL(req));
};
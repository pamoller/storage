Storage = {
  log : false, // logging disabled by default
  
  autoConnect : function(db, store) {
    try {
      return this.connectIndexedDB(db, store);
    } catch(e) {
      try {
        return this.connectWebSQL(db, store);
      } catch(e) {
  	    try {
  	      return this.connectLocalStorage(db, store);
  	    } catch(e) {
  	      throw new Error("NOSTORAGE");
        }
      }
    }
  },

  initStorage : function(Storage, db, store) {
    return new Storage(db, store);
  },
  
  connectLocalStorage : function(db, store) {
    return this.initStorage(Storage.LocalStorage, db, store);
  },
  
  connectWebSQL : function(db, store) {
    return this.initStorage(Storage.WebSQL, db, store);
  },
  
  connectIndexedDB : function(db, store) {
    return this.initStorage(Storage.IndexedDB, db, store);
  }
};
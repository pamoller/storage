Storage.Request = function(ref) {
  this.ref = ref;			  // referenced storage object
  this.errorCode = undefined; // code of error
  this.errorMessage = undefined;  // human readable error message
  this.onsuccess = null;	// success callback
  this.onerror = null;		// error callback
  this.oncomplete = null;	// callback called after completion
  this.onsuccessCounter = 0;	// count number of success callback
  this.timerids = [];	// todo think about
  this.result = [];	// results passed to success callback
  this.stack = []; // internal stack 
  this.stackClosed = false // close stack
};
  
Storage.Request.prototype.syncCall = function(cbk, a, b) {
  if (typeof cbk === 'function') {
    cbk(a, b);
  }	  
};

Storage.Request.prototype.asyncCall = function(ref, a, b) {
  if (typeof ref === 'function') {
    this.timerids.push(setTimeout(function() {ref(a,b)}, 0));

    return this.timerid;
  }
};

Storage.Request.prototype.logger = function(msg) {
  if (Storage.log) { 
	console.log(msg);
  }
};

Storage.Request.prototype.errorCallback = function(errorCode, errorMsg) {
  this.errorCode = errorCode;
  this.errorMessage  = errorMsg;
  this.logger('fatal error: '+this.errorCode+' ('+this.errorMessage+')');
  this.asyncCall(this.onerror, errorCode, errorMsg);
};
      
Storage.Request.prototype.successCallback = function(result) {
  this.result.push(result);
  this.onsuccessCounter+=1;
  this.asyncCall(this.onsuccess, result, this.onsuccessCounter); // experimental!
};

Storage.Request.prototype.completeCallback = function() {
  this.asyncCall(this.oncomplete, this.result);
}

Storage.Request.prototype.finish = function(result) {
  this.successCallback(result);
  this.completeCallback();
};

Storage.Request.prototype.abort = function(errorCode, errorMsg) {
  this.errorCallback(errorCode, errorMsg);
  this.completeCallback();
};
function createHelpers (execlib) {
  'use strict';
  
  var lib = execlib.lib,
    q = lib.q;

  function ldbwlapplier (methodname, args, ldbwl) {
    var method = ldbwl[methodname], ret;
    if (!lib.isFunction(method)) {
      console.log(methodname+' is not a method of Bank');
      return q.reject(new lib.Error('INVALID_METHODNAME', methodname+' is not a method of Bank'));
    }
    ret = method.apply(ldbwl, args);
    methodname = null;
    args = null;
    return ret;
  }

  function ldbwlelementapplier (elementname, methodname, args, ldbwl) {
    var ldbwlelement, method, ret;
    if (!(elementname in ldbwl)) {
      return q.reject(new lib.Error('INVALID_ELEMENTNAME', elementname+' does not exist in Bank'));
    }
    ldbwlelement = ldbwl[elementname];
    method = ldbwlelement[methodname];
    if (!lib.isFunction(method)) {
      return q.reject(new lib.Error('INVALID_METHODNAME', methodname+' is not a method of Bank element '+elementname));
    }
    ret = method.apply(ldbwlelement, args);
    elementname = null;
    methodname = null;
    args = null;
    return ret;
  }

  return {
    ldbwlapplier: ldbwlapplier,
    ldbwlelementapplier: ldbwlelementapplier
  };
}

module.exports = createHelpers;

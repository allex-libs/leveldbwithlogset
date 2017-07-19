var Path = require('path');

function createLDBWLSet (execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    dirScanner = require('./dirscannercreator')(execlib);


  function LDBWLSet (prophash) {
    var sd, subldbwls;
    if (!(prophash)) {
      throw new lib.Error('NO_PROPHASH', 'LDBWLSet needs a property hash in its ctor');
    }
    if (!prophash.path) {
      throw new lib.JSONizingError('NO_PATH', 'Property hash for LDBWLSet has to have a path');
    }
    this.path = prophash.path;
    this.ldbwlctor = null; //lib.isFunction(prophash.ldbwlctor) ? prophash.ldbwlctor : null;
    this.ldbwlprophash = prophash.ldbwlprophash || {};
    this.ldbwls = new lib.DIContainer();
    this.newBank = new lib.HookCollection();
    this.startDefer = prophash.starteddefer;
    if (lib.isFunction(prophash.ldbwlctor)) {
      this.setBankCtor(prophash.ldbwlctor);
    }
  }

  LDBWLSet.prototype.destroy = function () {
    if (this.startDefer) {
      this.startDefer.reject(new lib.Error('DYING', 'LDBWLSet is destroying'));
    }
    this.startDefer = null;
    if (this.newBank) {
      this.newBank.destroy();
    }
    this.newBank = null;
    if (this.ldbwls) {
      this.ldbwls.destroy();
    }
    this.ldbwls = null;
    this.ldbwlprophash = null;
    this.ldbwlctor = null;
    this.path = null;
  };

  LDBWLSet.prototype.setBankCtor = function (ldbwlctor) {
    var subldbwls = [], sd = this.startDefer;
    this.ldbwlctor = ldbwlctor;
    this.startDefer = null;
    if (sd) {
      dirScanner(this.path).then(
        this.onDirScanned.bind(this, sd, subldbwls),
        sd ? sd.reject.bind(sd) : null,
        subldbwls.push.bind(subldbwls)
      );
    }
  };

  LDBWLSet.prototype.onDirScanned = function (sd, subldbwls) {
    var p;
    if (!lib.isArray(subldbwls)) {
      if (sd) {
        sd.resolve(this);
      }
    } else {
      p = q.all(subldbwls.map(this.getOrCreateBank.bind(this)));
      if (sd) {
        p.then(
          sd.resolve.bind(sd, this),
          sd.reject.bind(sd)
        );
      }
    }
  };

  LDBWLSet.prototype.getOrCreateBank = function (ldbwlname) {
    var ret = this.ldbwls.get(ldbwlname), sd, bs, nb, ph, bn;
    if (ldbwlname === '***') {
      console.trace();
      console.log('ldbwlname', ldbwlname);
      process.exit(1);
      return;
    }
    if (ret) {
      return q(ret);
    }
    if (!this.ldbwlctor) {
      return q.reject(new lib.Error('NO_BANK_CONSTRUCTOR', 'LDBWLSet needs a ldbwl constructor'));
    }
    if (!this.ldbwls.busy(ldbwlname)) {
      sd = q.defer();
      bs = this.ldbwls;
      nb = this.newBank;
      ph = lib.extend({}, this.ldbwlprophash, {
        path: Path.join(this.path, ldbwlname)
      });
      ph.starteddefer = sd;
      bn = ldbwlname;
      new this.ldbwlctor(ph);
      sd.promise.then(function (b) {
        bs.register(bn, b);
        bs = null;
        nb.fire(b, bn);
        nb = null;
        bn = null;
      },function (reason) {
        bs = null;
        nb = null;
        bn = null;
      });
    }
    ret = this.ldbwls.waitFor(ldbwlname);
    return ret;
  };

  LDBWLSet.prototype.traverseKVStorage = function (ldbwlname, cb, options) {
    return this.getOrCreateBank(ldbwlname).then(
      ldbwlelementapplier.bind(null, 'kvstorage', 'traverse', [cb, options])
    );
  };

  LDBWLSet.prototype.traverseLog = function (ldbwlname, cb, options) {
    return this.getOrCreateBank(ldbwlname).then(
      ldbwlelementapplier.bind(null, 'log', 'traverse', [cb, options])
    );
  };

  LDBWLSet.prototype.traverseReservations = function (ldbwlname, cb, options) {
    return this.getOrCreateBank(ldbwlname).then(
      ldbwlelementapplier.bind(null, 'reservations', 'traverse', [cb, options])
    );
  };

  LDBWLSet.prototype.traverseResets = function (ldbwlname, cb, options) {
    return this.getOrCreateBank(ldbwlname).then(
      ldbwlelementapplier.bind(null, 'resets', 'traverse', [cb, options])
    );
  };

  require('./queryextensioncreator')(execlib, LDBWLSet, ldbwlapplier);

  LDBWLSet.addMethods = function (klass) {
    lib.inheritMethods(klass, LDBWLSet,
      'setBankCtor',
      'onDirScanned',
      'getOrCreateBank',
      'readAccount',
      'readAccountWDefault',
      'readAccountSafe',
      'closeAccount',
      'charge',
      'reserve',
      'commitReservation',
      'partiallyCommitReservation',
      'cancelReservation',
      'traverseKVStorage',
      'traverseLog',
      'traverseReservations',
      'traverseResets',
      'query',
      'queryLog'
    );
  };

  return LDBWLSet;
}

module.exports = createLDBWLSet;


function createLDBWLSet (execlib) {
  return execlib.loadDependencies('client', ['allex_leveldblib', 'allex_leveldbwithloglib'], createLib.bind(null, execlib));
}

function createLib (execlib, leveldbwithloglib) {
  var helpers = require('./helperscreator')(execlib);
  return execlib.lib.q({
    helpers: helpers,
    LDBCompositeSet: require('./creator')(execlib, helpers),
    Hook: require('./hookcreator')(execlib, leveldblib, leveldbwithloglib)
  });
}

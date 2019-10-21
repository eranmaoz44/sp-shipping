var LazyPromise = require('lazy-promise')
  , isPromise = require('is-promise')

module.exports =
function lazify(fn) {
  return new LazyPromise(function(resolve, reject) {
    var ret
    try {
      ret = fn()
    }
    catch(e) {
      return void reject(e)
    }
    if (isPromise(ret))
      return void ret.then(resolve, reject)
    resolve(ret)
  })
}

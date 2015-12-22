'use strict'

const config = require('config')

 // https://registry.npmjs.org/-/user/org.couchdb.user:fengmk2
module.exports.addUser = function *() {
  let body = yield this.parseBody()
  console.log('login body', body)
}

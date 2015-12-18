'use strict'

const config = require('config')
const urllib = require('urllib')
const Repo = require('../service/repo')

module.exports.listAllVersion = function *() {
  let name = this.params.name
  try {
    let repo = new Repo(name)
    this.body = yield repo.getPackageJson()
    return
  } catch (e) {
    console.log(e)
  }
  let resp = yield urllib.requestThunk(config.npmUrl + this.url, {
    streaming: true,
    timeout: 30 * 1000
  })
  for (let key in resp.headers) {
    this.set(key, resp.headers[key])
  }
  this.body = resp.res
}

module.exports.downloadPackage = function *() {
  let name = this.params.name
  let filename = this.params.filename
  try {
    let repo = new Repo(name)
    let file = yield repo.downloadPackage(filename)
    console.log(file)
    this.set('content-type', 'application/otct-stream')
    this.set('content-length', file.length)
    this.body = file.stream
    return
  } catch (e) {
    console.log(e)
  }

  let resp = yield urllib.requestThunk(config.npmUrl + this.url, {
    streaming: true,
    timeout: 30 * 1000
  })
  for (let key in resp.headers) {
    this.set(key, resp.headers[key])
  }
  this.body = resp.res
}

module.exports.syncPackage = function *() {
  // let name = this.params.name
  // if (!checkInternalPackage(name)) this.throw(400, 'only sync private package')
}

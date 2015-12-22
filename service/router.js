'use strict'

const Router = require('toa-router')
const repoAPI = require('../api/repo')
const userAPI = require('../api/user')

var router = module.exports = new Router()
router.get('/', function () {
  this.body = 'fake NPM'
})
router.get('/favicon.ico', function () {
  this.body = 'fake NPM'
})

router.get('/:name', repoAPI.listAllVersion)
router.get('/:name/-/:filename', repoAPI.downloadPackage)
// router.get('/package/:name', packageAPI.package)
router.put('/-/user/org.couchdb.user::name', userAPI.addUser)

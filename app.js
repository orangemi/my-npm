'use strict'

const http = require('http')
const config = require('config')
const toa = require('toa')
const toaBody = require('toa-body')
const router = require('./service/router')

let app = toa(function * () {
  console.log(new Date(), this.method, this.url)
  yield router.route(this)
})

toaBody(app)
app.listen(config.port)
console.log(`listen ${config.port}...`)
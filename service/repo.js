'use strict'
const debug = require('debug')('repo')
const thunk = require('thunks')()
const thunkStream = require('thunk-stream')
const config = require('config')
const git = require('./git')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const PassThrough = require('stream').PassThrough

const fswrite = thunk.thunkify(fs.writeFile)
const fsread = thunk.thunkify(fs.readFile)
const fsmkdir = thunk.thunkify(fs.mkdir)
const fsstat = thunk.thunkify(fs.stat)

const repoDirectory = path.resolve(__dirname, '../repos')
const repos = config.repos

module.exports = Repo

function Repo (name) {
  if (!(this instanceof Repo)) return new Repo(name)
  if (!Repo.checkInternalPackage(name)) throw new Error('not a private repo')
  this.name = name
  this.repo = repos[name].repo
}

Repo.checkInternalPackage = function (name) {
  return Object.keys(repos).indexOf(name) !== -1
}

Repo.prototype.getPackageJson = function *() {
  let localJson = yield this.getLocalPackageJson()
  let tags = yield this.listRemoteVersions()
  let localVersions = localJson.versions || {}
  let localTags = []
  for (let localVersion in localVersions) {
    localTags.push('v' + localVersion)
  }
  let missingtags = []
  tags.map(function (tag) {
    if (!isVersionTag(tag)) return
    if (localTags.indexOf(tag) === -1) missingtags.push(tag)
  })
  if (missingtags.length) {
    localJson.versions = localJson.versions || {}
    localVersions = yield this.fetchVersions(missingtags)
    missingtags.map(function (tag) {
      localJson.versions[getVersionByTag(tag)] = localVersions[tag]
    })
    let filename = path.resolve(repoDirectory, this.name, 'package.json')
    localJson['dist-tags'] = {
      latest: getLargestVersion(Object.keys(localJson.versions))
    }
    yield fswrite(filename, JSON.stringify(localJson))
  }
  return localJson
}

Repo.prototype.fetchVersions = function *(tags) {
  let result = {}
  for (let k in tags) {
    let tag = tags[k]
    debug(`fetching ${this.name}-${tag}...`)
    let packageJson = yield this.getRemoteTagPackageJson(tag)
    let filename = `${this.name}-${getVersionByTag(tag)}.tgz`
    let shasum = crypto.createHash('sha1')
    let file = path.resolve(repoDirectory, this.name, filename)
    let fileStream = git.getTgz(this.repo, tag)
    let ws = fs.createWriteStream(file)
    let pt = new PassThrough()
    fileStream.stdout.pipe(ws)
    fileStream.stdout.pipe(pt)
    pt.on('data', function (chunk) {
      shasum.update(chunk)
    })
    yield thunkStream(ws)
    shasum = shasum.digest('hex')
    packageJson.dist = {
      shasum: shasum,
      tarball: `${config.host}/${this.name}/-/${filename}`
    }
    debug(`fetched ${shasum} : ${filename}...`)

    result[tag] = packageJson
  }
  return result
}

Repo.prototype.listRemoteVersions = function *() {
  let repo = this.repo
  let tags = yield git.getTags(repo)
  return tags
}

Repo.prototype.getRemoteTagPackageJson = function *(tag) {
  let repo = this.repo
  let buffer = yield git.getFileContent(repo, tag, 'package.json')
  let packageInfo = buffer.toString()
  packageInfo = JSON.parse(packageInfo)
  return packageInfo
}

Repo.prototype.getLocalPackageJson = function *() {
  let filename = path.resolve(repoDirectory, this.name, 'package.json')
  let dirname = path.resolve(repoDirectory, this.name)
  try {
    yield fsstat(dirname)
  } catch (e) {
    yield fsmkdir(dirname)
  }
  try {
    let buffer = yield fsread(filename)
    return JSON.parse(buffer.toString())
  } catch (e) {
    return {}
  }
}

function getLargestVersion (versions) {
  var largest
  versions.map(function (version) {
    // version = version.replace(/(^[a-zA-Z]+)|([a-zA-Z]+$)/, '')
    if (!largest) {
      largest = version
      return
    }
    let changed = false
    version.split('.').map(function (v, i) {
      if (!changed && v > largest.split('.')[i]) {
        changed = true
        largest = version
      }
    })
  })
  return largest
}

Repo.prototype.downloadPackage = function *(filename) {
  let file = path.resolve(repoDirectory, this.name, filename)
  let stat
  try {
    stat = yield fsstat(file)
  } catch (e) {
    throw new Error(404)
  }
  return {
    length: stat.size,
    stream: fs.createReadStream(file)
  }
}

function isVersionTag (tag) {
  let version = tag.replace(/^[Vv]/, '')
  let versionArr = version.split('.')
  let isNumber = true
  versionArr.map(function (v) {
    if (!(v >= 0)) isNumber = false
  })
  return isNumber
}

function getVersionByTag (tag) {
  return tag.replace(/^[vV]/, '')
}

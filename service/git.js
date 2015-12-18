'use strict'
const child_process = require('child_process')
const exec = child_process.exec
const spawn = child_process.spawn
const lsRemoteCmd = 'git ls-remote'
const archiveCmd = 'git archive'

module.exports.getTags = function (repo) {
  return function (callback) {
    exec(`${lsRemoteCmd} --tags ${repo}`, function (err, stdout, stderr) {
      if (err) return callback(err)
      if (stderr) return callback(new Error(stderr))
      let result = []
      stdout.split('\n').map(function (line) {
        let tag
        let tmp = line.split('\t')
        tag = tmp[1]
        if (!tag) return
        tag = tag.replace(/^refs\/tags\//, '')
        result.push(tag)
      })
      return callback(null, result)
    })
  }
}

module.exports.getTgz = function (repo, ref) {
  return spawn('git', ['archive', '--format=tgz', '--prefix=package/', `--remote=${repo}`, `${ref}`])
}

module.exports.getFileContent = function (repo, ref, path) {
  return function (callback) {
    exec(`${archiveCmd} --remote=${repo} ${ref} ${path} | tar -xO`, function (err, stdout, stderr) {
      if (err) return callback(err)
      if (stderr) return callback(new Error(stderr))
      let result = stdout
      return callback(null, result)
    })
  }
}

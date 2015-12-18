MY-NPM
======
A tiny npm registry with private repo using your own git.
- pull your private package repo
- proxy read public package from [npmjs.org](https://npmjs.org)

## Usage
- edit your config in `repos` keyword:
```
{
  "repos": {
    "{package.name}" : "{repo.url}",
    ...
  }
}
```
- push version tag to your git, like 'v1.0.0', '2.0.0'
```
git tag v1.0.0
```
- my-npm will find the largest version (maybe not be same as the latest version) for you.
- try npm install
```
npm install --registry=http://localhost:3010 private-repo public-repo
```

## TODO
- login with token
- dynamic add / remove repo
- check permission
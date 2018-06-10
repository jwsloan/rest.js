module.exports = apiMethod

const clone = require('lodash/clone')
const defaultsDeep = require('lodash/defaultsDeep')
const mapKeys = require('lodash/mapKeys')

const deprecate = require('../../deprecate')
const validate = require('./validate')

function apiMethod (octokit, endpointDefaults, endpointParams, options, callback) {
  // Do not alter passed options (#786)
  options = clone(options) || {}

  // lowercase header names (#760)
  options.headers = mapKeys(options.headers, (value, key) => key.toLowerCase())

  if (endpointDefaults.deprecated) {
    deprecate(endpointDefaults.deprecated)
    delete endpointDefaults.deprecated
  }

  const endpointOptions = defaultsDeep(options, endpointDefaults)

  const promise = Promise.resolve(endpointOptions)
    .then(validate.bind(null, endpointParams))
    .then(octokit.request)

  if (callback) {
    promise.then(callback.bind(null, null), callback)
    return
  }

  // add iterator if method paginates
  if (endpointParams.per_page) {
    promise[Symbol.asyncIterator] = () => {
      return getIteratorFor({
        octokit,
        endpointOptions,
        promise
      })
    }
  }

  return promise
}

function getIteratorFor (context) {
  const octokit = context.octokit
  const state = {
    page: context.endpointOptions.page || 1,
    promise: context.promise
  }

  return {
    next () {
      const page = state.page++

      if (state.done) {
        return Promise.resolve({ done: true })
      }

      const promise = state.promise || octokit.request(Object.assign(context.endpointOptions, {page}))
      delete state.promise

      return promise.then((result) => {
        if (!octokit.hasNextPage(result)) {
          state.done = true
        }

        return {
          value: result
        }
      })
    }
  }
}

const {getInstance} = require('../util')

require('../mocha-node-setup')

describe('api.github.com', () => {
  // const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1])
  let github

  beforeEach(() => {
    return getInstance('paginate-issues')

      .then(instance => {
        github = instance

        github.authenticate({
          type: 'token',
          token: '0000000000000000000000000000000000000001'
        })
      })
  })

  it('paginate using ayncIterator', () => {
    const options = {
      owner: 'octokit-fixture-org',
      repo: 'paginate-issues',
      per_page: 3,
      headers: {
        accept: 'application/vnd.github.v3+json'
      }
    }
    const iterator = github.issues.getForRepo(options)[Symbol.asyncIterator]()

    return iterator.next()
      .then(result => {
        // page 1, results 1 - 3
        expect(result.value.data.length).to.equal(3)

        return iterator.next()
      })
      .then(result => {
        // page 2, results 4 - 6
        expect(result.value.data.length).to.equal(3)

        return iterator.next()
      })
      .then(result => {
        // page 3, results 7 - 9
        expect(result.value.data.length).to.equal(3)

        return iterator.next()
      })
      .then(result => {
        // page 4, results 10 - 12
        expect(result.value.data.length).to.equal(3)

        return iterator.next()
      })
      .then(result => {
        // page 5, results 13
        expect(result.value.data.length).to.equal(1)

        return iterator.next()
      })
      .then(result => {
        expect(result.done).to.equal(true)
      })
  })

  // This test will only run in Node 10 and browsers that support async iterators
  // it('for await (let result of github.issues.getForRepo()', async () => {
  //   const options = {
  //     owner: 'octokit-fixture-org',
  //     repo: 'paginate-issues',
  //     per_page: 3,
  //     headers: {
  //       accept: 'application/vnd.github.v3+json'
  //     }
  //   }
  //   const results = []
  //
  //   for await (const result of github.issues.getForRepo(options)) {
  //     results.push(...result.data)
  //   }
  //   expect(results.length).to.equal(13)
  // })
})

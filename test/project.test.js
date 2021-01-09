var assert  = require("assert")

const Projects = artifacts.require('./Projects.sol')

contract('Projects', (accounts) => {
  before(async () => {
    this.projects = await Projects.deployed()
  })

  it('deploys successfully', async () => {
    const address = await this.projects.address
    assert.notStrictEqual(address, 0x0)
    assert.notStrictEqual(address, '')
    assert.notStrictEqual(address, null)
    assert.notStrictEqual(address, undefined)
  })

  it('superTest', async () => {
    const descriptionHash = 123
    const cost = 123
    const duration = 30 
    const investmentDuration = 30
    const amount = 1000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]


    result = await this.projects.createProject(descriptionHash, cost, duration, investmentDuration, {from: account_one})
    projectId = result.logs[0].args.id.toNumber()
    owner = result.logs[0].args.owner

    assert.strictEqual(account_one, owner)
    const projectCount = await this.projects.projectCount()
    assert.strictEqual(projectId, projectCount.toNumber())

    result = await this.projects.fundProject(projectId, amount, {from: account_two, value: amount})
    // result = await this.projects.fundProject(projectId, 0.1)
  })
})
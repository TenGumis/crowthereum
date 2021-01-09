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
    const goal = 10000
    const duration = 30 
    const investmentDuration = 30
    const amount = 1000
    const gasCost = 20000000000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]


    result = await this.projects.createProject(descriptionHash, goal, duration, investmentDuration, {from: account_one})
    projectId = result.logs[0].args.id.toNumber()
    owner = result.logs[0].args.owner

    assert.strictEqual(account_one, owner)
    const projectCount = await this.projects.projectCount()
    assert.strictEqual(projectId, projectCount.toNumber())

    // funding a project
    result = await this.projects.fundProject(projectId, amount, {from: account_two, value: amount})
    project = await this.projects.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, amount)

    result = await this.projects.fundProject(projectId, goal-amount, {from: account_two, value: goal-amount})
    project = await this.projects.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, goal)

    // old_balance = parseInt(await web3.eth.getBalance(account_one))
    // console.log(old_balance)
    
    result = await this.projects.claimFunds(projectId, {from: account_one})
    project = await this.projects.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, 0)
    //tutaj sie jakis syf robi. Chcialbym sprawdzic czy balance wzrosl o odpowiednia sume. Nie liczac kosztu transkacji
    // transactionCost = result.receipt.cumulativeGasUsed * gasCost
    // new_balance = parseInt(await web3.eth.getBalance(account_one))
    // assert.strictEqual(new_balance, old_balance+goal+transactionCost)

    // assert.strictEqual(amount, )
    // cos_tam = result.logs[0].args
    // console.log(cos_tam.amount)

    // result = await this.projects.fundProject(projectId, 0.1)
  })
})
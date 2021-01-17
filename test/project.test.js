var assert  = require("assert")

const Projects = artifacts.require('./Projects.sol')

contract('Projects', (accounts) => {
  before(async () => {
    this.projectsContract = await Projects.deployed()
  })

  it('deploys successfully', async () => {
    const address = await this.projectsContract.address
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

    result = await this.projectsContract.createProject(descriptionHash, goal, duration, investmentDuration, {from: account_one})
    projectId = result.logs[0].args.id.toNumber()
    owner = result.logs[0].args.owner

    assert.strictEqual(account_one, owner)
    const projectCount = await this.projectsContract.projectCount()
    assert.strictEqual(projectId, projectCount.toNumber())

    // funding a project
    result = await this.projectsContract.fundProject(projectId, amount, {from: account_two, value: amount})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, amount)

    result = await this.projectsContract.fundProject(projectId, goal-amount, {from: account_two, value: goal-amount})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, goal)

    // old_balance = parseInt(await web3.eth.getBalance(account_one))
    // console.log(old_balance)
    
    result = await this.projectsContract.claimFunds(projectId, {from: account_one})
    project = await this.projectsContract.projects(projectId)
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

  it('investmentDeadlineTest', async () => {
    const descriptionHash = 123
    const investmentDuration = 1 // Important in that test
    const investmentAmount = 1000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [investmentAmount * 5];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, 1, {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    assert.strictEqual(projectId.toNumber(), 0)
    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount, {from: account_two, value: investmentAmount})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount)

    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await timeout( (investmentDuration + 1) * 1000);

    try {
      result = await this.projectsContract.fundProject(descriptionHash, investmentAmount, {from: account_two, value: investmentAmount})
    } catch (error) {
      err = error
    }

    assert.ok(err instanceof Error)

    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount)
  })
})
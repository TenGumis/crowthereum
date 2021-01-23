var assert  = require("assert")

const Projects = artifacts.require('./Projects.sol')

contract('Projects', (accounts) => {
  before(async () => {
    this.projectsContract = await Projects.deployed()
  })

  function calculateFee(value, alpha) {
    return Math.ceil(((value * alpha) / (1000 - alpha)))
  }

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

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [goal];
    const durations = [duration];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length , {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)
    owner = result.logs[0].args.owner

    assert.strictEqual(account_one, owner)
    const projectCount = await this.projectsContract.projectCount()

    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, amount, {from: account_two, value: amount})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, amount)

    result = await this.projectsContract.fundProject(descriptionHash, goal-amount, {from: account_two, value: goal-amount})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, goal)
    
    result = await this.projectsContract.voteForMilestoneCompletion(descriptionHash, 0, {from: account_two});
    project = await this.projectsContract.projects(projectId)
    currentMilestone = await project.currentMilestone.toNumber()
    assert.strictEqual(currentMilestone, 1)

    result = await this.projectsContract.claimFunds(descriptionHash, {from: account_one})
    project = await this.projectsContract.projects(projectId)
    lastUnclaimedMilestone = await project.lastUnclaimedMilestone.toNumber()
    currentMilestone = await project.currentMilestone.toNumber()
    assert.strictEqual(lastUnclaimedMilestone, 1)
    assert.strictEqual(lastUnclaimedMilestone, currentMilestone)
  })

  it('investmentDeadlineTest', async () => {
    const descriptionHash = 1234
    const investmentDuration = 1 // Important in that test
    const investmentAmount = 1000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [investmentAmount * 5];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    //assert.strictEqual(projectId.toNumber(), 0)
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

  it('voteForMilestoneBeforeInvestmentFinishedTest', async () => {
    const descriptionHash = 1235
    const investmentDuration = 1 // Important in that test
    const investmentAmount1 = 1000
    const investmentAmount2 = 3000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [investmentAmount1 + investmentAmount2];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    //assert.strictEqual(projectId.toNumber(), 0)
    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount1, {from: account_two, value: investmentAmount1})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount1)

    try {
      result = await this.projectsContract.voteForMilestoneCompletion(descriptionHash, 0, {from: account_two});
    } catch (error) {
      err = error
    }

    assert.ok(err instanceof Error)

    project = await this.projectsContract.projects(projectId)
    currentVoteStake = await project.currentVoteStake.toNumber()
    assert.strictEqual(currentVoteStake, 0)
  })

  it('voteForMilestoneAfterInvestmentFinishedTest', async () => {
    const descriptionHash = 1236
    const investmentDuration = 1 // Important in that test
    const investmentAmount1 = 1000
    const investmentAmount2 = 3000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [investmentAmount1 + investmentAmount2];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    //assert.strictEqual(projectId.toNumber(), 0)
    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount1, {from: account_two, value: investmentAmount1})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount1)

    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount2, {from: account_two, value: investmentAmount2})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount1 + investmentAmount2)

    result = await this.projectsContract.voteForMilestoneCompletion(descriptionHash, 0, {from: account_two});

    project = await this.projectsContract.projects(projectId)
    const currentMilestone = await project.currentMilestone.toNumber()
    assert.strictEqual(currentMilestone, 1)
  })

  it('createSameProjectTwice', async () => {
    const descriptionHash = 1237
    const investmentDuration = 1 // Important in that test
    const investmentAmount1 = 1000
    const investmentAmount2 = 3000

    var result

    const account_one = accounts[0]
    const account_two = accounts[1]

    const goals = [investmentAmount1 + investmentAmount2];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, {from: account_one})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    try {
      result = await this.projectsContract.createProject(descriptionHash, investmentDuration + 1, goals, durations, goals.length, {from: account_one})
    } catch (error) {
      err = error
    }
    
    assert.ok(err instanceof Error)
  })

  it('investmentFeeAfterExcess', async () => {
    const descriptionHash = 2115
    const goal = 10 * 1000000
    const duration = 30 
    const investmentDuration = 30
    const investmentAmount1 = 9 * 1000000
    const investmentAmount2 = 100 * 1000000
    const alpha = 100

    var result

    const accountOne = accounts[0]
    const accountTwo = accounts[3]

    const goals = [goal];
    const durations = [duration];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, alpha, {from: accountOne})
    projectId = await this.projectsContract.projectIdx(descriptionHash)
    owner = result.logs[0].args.owner

    assert.strictEqual(accountOne, owner)
    const projectCount = await this.projectsContract.projectCount()

    let balanceBefore = await web3.eth.getBalance(accountTwo);

    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount1, {from: accountTwo, value: investmentAmount1 + calculateFee(investmentAmount1, alpha)})
    gasUsed = result.receipt.gasUsed;
    txInfo = await web3.eth.getTransaction(result.tx);
    gasPrice = txInfo.gasPrice;
    const transactionCost1 = gasPrice *gasUsed

    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount1)

    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount2, {from: accountTwo, value: investmentAmount2 + calculateFee(investmentAmount2, alpha)})
    gasUsed = result.receipt.gasUsed;
    txInfo = await web3.eth.getTransaction(result.tx);
    gasPrice = txInfo.gasPrice;
    const transactionCost2 = gasPrice *gasUsed

    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, goal)
    
    let balanceAfter = await web3.eth.getBalance(accountTwo);
    let expenses = goal + calculateFee(investmentAmount1, alpha) + calculateFee(goal - investmentAmount1, alpha);
    const expectedValue = web3.utils.toBN(balanceAfter).add(web3.utils.toBN(expenses)).add(web3.utils.toBN(transactionCost1)).add(web3.utils.toBN(transactionCost2)).toString()

    assert.strictEqual(balanceBefore, expectedValue, "Balance incorrect!");
  })

  it('reclaimInvestmentFee', async () => {
    const descriptionHash = 2137
    const investmentDuration = 1 // Important in that test
    const investmentAmount = 9 * 1000000
    const alpha = 100

    var result

    const accountOne = accounts[0]
    const accountTwo = accounts[4]

    const goals = [investmentAmount * 5];
    const durations = [1];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, alpha, {from: accountOne})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    // funding a project
    result = await this.projectsContract.fundProject(descriptionHash, investmentAmount, {from: accountTwo, value: investmentAmount + calculateFee(investmentAmount, alpha)})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, investmentAmount)

    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await timeout( (investmentDuration + 1) * 1000);

    const balanceBefore = await web3.eth.getBalance(accountTwo);

    result = await this.projectsContract.reclaimInvestment(descriptionHash, {from: accountTwo})
    gasUsed = result.receipt.gasUsed;
    txInfo = await web3.eth.getTransaction(result.tx);
    gasPrice = txInfo.gasPrice;
    const transactionCost = gasPrice * gasUsed;

    const balanceAfter = await web3.eth.getBalance(accountTwo);
    const reclaimAmount = investmentAmount + calculateFee(investmentAmount, alpha)
    const expectedValue = web3.utils.toBN(balanceAfter).add(web3.utils.toBN(transactionCost)).sub(web3.utils.toBN(reclaimAmount)).toString()

    assert.strictEqual(balanceBefore, expectedValue, "Balance incorrect!");
  })

  it('reclaimInvestmentFeeAfterMilestone', async () => {
    const descriptionHash = 2138
    const investmentDuration = 100
    const investmentAmount1 = 9 * 1000000
    const investmentAmount2 = 1 * 1000000
    const alpha = 100

    var result

    const accountOne = accounts[0]
    const accountTwo = accounts[5]

    const goals = [investmentAmount1, investmentAmount2];
    const durations = [10000, 0];

    result = await this.projectsContract.createProject(descriptionHash, investmentDuration, goals, durations, goals.length, alpha,
      {from: accountOne})
    projectId = await this.projectsContract.projectIdx(descriptionHash)

    // funding a project
    const goal = investmentAmount1 + investmentAmount2;
    result = await this.projectsContract.fundProject(descriptionHash, goal, {from: accountTwo, value: goal + calculateFee(goal, alpha)})
    project = await this.projectsContract.projects(projectId)
    projectBalance = await project.balance.toNumber()
    assert.strictEqual(projectBalance, goal)

    result = await this.projectsContract.voteForMilestoneCompletion(descriptionHash, 0, {from: accountTwo});
    project = await this.projectsContract.projects(projectId)
    currentMilestone = await project.currentMilestone.toNumber()
    assert.strictEqual(currentMilestone, 1)

    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await timeout(1000);

    const balanceBefore = await web3.eth.getBalance(accountTwo);

    result = await this.projectsContract.reclaimInvestment(descriptionHash, {from: accountTwo})
    gasUsed = result.receipt.gasUsed;
    txInfo = await web3.eth.getTransaction(result.tx);
    gasPrice = txInfo.gasPrice;
    const transactionCost = gasPrice * gasUsed;

    const balanceAfter = await web3.eth.getBalance(accountTwo);
    const reclaimAmount = investmentAmount2 + calculateFee(investmentAmount2, alpha) - 1 // We need -1 because we round down fee to return
    const expectedValue = web3.utils.toBN(balanceAfter).add(web3.utils.toBN(transactionCost)).sub(web3.utils.toBN(reclaimAmount)).toString()

    assert.strictEqual(balanceBefore, expectedValue, "Balance incorrect!");
  })
})
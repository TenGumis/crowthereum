const secondsPerDay = 60 * 60 * 24
let computeFee = (alpha) => {
  return alpha/(1 - alpha) + 0.0000000000001// round up
}

function calculateFee(value, alpha) {
  return web3.toBigNumber(value).mul(alpha).div(web3.toBigNumber(1000-alpha)).ceil()
}

App = {
  loading: false,

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    App.account = web3.eth.accounts[0]
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }
    // Update app loading state
    App.setLoading(true)
    // Render Account
    $('#account').html(App.account)
    // Update loading state
    App.setLoading(false)
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const projects = await $.getJSON('Projects.json')
    App.contracts.Projects = TruffleContract(projects)
    App.contracts.Projects.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.projects = await App.contracts.Projects.deployed()
  },

  loadBulletinBoard: async () => {
    const bulletinBoard = await $.getJSON('BulletinBoard.json')
    App.bulletinBoard = bulletinBoard;
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  },

  isProjectExpired: async (projectHash) => {
    const investmentDeadline = new Date(await App.projects.getInvestmentDeadline(projectHash) * 1000)
    const completed = await App.projects.isProjectCompleted(projectHash)
    const funded = await App.projects.isProjectFunded(projectHash)
    const currentTime = new Date()

    if (funded) {
      if (completed) {
        return false;
      } else {
        const currentMilestone = await App.projects.getCurrentMilestone(projectHash);
        const milestoneDeadline = new Date(await App.projects.getMilestoneDeadline(projectHash, currentMilestone) * 1000);
        return milestoneDeadline < currentTime;
      }
    } else {
      return ( investmentDeadline < currentTime );
    }
  }
}
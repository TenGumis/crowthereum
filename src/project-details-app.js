App = {
    loading: false,
    currentMilestone: -1,
    contracts: {},
  
    load: async () => {
      await App.loadWeb3()
      await App.loadAccount()
      await App.loadBulletinBoard()
      await App.loadContract()
      await App.render()
      await App.renderProjectDetails()
    },
  
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

    loadBulletinBoard: async () => {
      const bulletinBoard = await $.getJSON('BulletinBoard.json')
      App.bulletinBoard = bulletinBoard;
    },
  
    loadContract: async () => {
      // Create a JavaScript version of the smart contract
      const projects = await $.getJSON('Projects.json')
      App.contracts.Projects = TruffleContract(projects)
      App.contracts.Projects.setProvider(App.web3Provider)
  
      // Hydrate the smart contract with values from the blockchain
      App.projects = await App.contracts.Projects.deployed()
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
  
      // Render Projects
      // await App.renderProjectDetails()
  
      // Update loading state
      App.setLoading(false)
    },
    
    fundProject : async () => {
      App.setLoading(true)
      let amount = document.getElementById('fund-amount').value;
      
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      if (amount == "") {
        alert("You must set amount.")
        return
      }
      let weiAmount =  web3.toWei(parseInt(amount))
      await App.projects.fundProject(parseInt(id), weiAmount, {value: weiAmount});
      window.location.reload()
    },

    claimFunds : async() => {
      App.setLoading(true)
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      await App.projects.claimFunds(parseInt(id));
      window.location.reload()
    },

    voteForCompletion : async() => {
      App.setLoading(true)
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      let currentIndex = App.currentMilestone
      await App.projects.voteForMilestoneCompletion(parseInt(id), parseInt(currentIndex));
      window.location.reload()
    },

    setDescription: async (str) => {
      let p = document.getElementById("project-description-text")
      p.innerText = str
    },

    setBalance: async (projectHash) => {
      let balance = await App.projects.getProjectBalance(projectHash)
      let balance_str = "<b>Balance:</b> " + web3.fromWei(balance)
      let p = document.getElementById("project-balance")
      p.innerHTML = balance_str
    },
    setGoal: async (projectHash) => {
      let goal = await App.projects.getProjectGoal(projectHash)
      let goal_str = "<b>Goal:</b> " + web3.fromWei(goal)
      let p = document.getElementById("project-goal")
      p.innerHTML = goal_str
    },
    setDeadline: async (projectHash) => {
      // let deadline = await App.projects.getInvestmentDeadline(projectHash)
      let deadline_str = "<b>Deadline: </b>" + "Do jutra xD"
      let p = document.getElementById("project-investment-deadline")
      p.innerHTML = deadline_str
    },
    setMilestones: async(projectHash) => {
      let numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash);
      let currentMilestone = await App.projects.getCurrentMilestone(projectHash);
      let div = document.getElementById("project-milestones-list")
      var str = "<h5>MILESTONES</h5>"
      for (var milestoneIndex = 0; milestoneIndex < numberOfMilestones; milestoneIndex++) {
        let milestoneGoal = await App.projects.getMilestoneGoal(projectHash, milestoneIndex);
        let milestoneDuration = await App.projects.getMilestoneDuration(projectHash, milestoneIndex);
        let milestoneString = "<p><b>Goal:</b>" + web3.fromWei(milestoneGoal) + "<b> ETH</b>| <b>Deadline:</b>" + milestoneDuration + "</p>";
        if (currentMilestone == milestoneIndex) {

        } else {
          str += "\n" + milestoneString
        }
      }
      div.innerHTML = str
    },
    setButtons: async (projectHash) => {
      let div = document.getElementById("project-milestone-button")
      let currentMilestone = await App.projects.getCurrentMilestone(projectHash)
      let numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash)
      let str = "Vote " + currentMilestone + " as completed"
      App.currentMilestone = currentMilestone
      if (currentMilestone.toNumber() == numberOfMilestones.toNumber()){
        div.textContent = "Don't click"
      } else {
        div.textContent = str
      }
    },
    renderProjectDetails: async () => {
      let params = (new URL(document.location)).searchParams;
      let projectHash = params.get("id")
      const bulletinBoard = await $.getJSON('BulletinBoard.json')

      var projectList = bulletinBoard.projects
      for (var i = 0; i < projectList.length; i++) {
        if (projectList[i].hash == projectHash) {
          App.setDescription(projectList[i].description)
          App.setBalance(projectHash)
          App.setGoal(projectHash)
          App.setDeadline(projectHash)
          App.setMilestones(projectHash)
          App.setButtons(projectHash)
        }
      }
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
    }
  }
  
  
  $(() => {
    $(window).load(() => {
      App.load()
    })
  })
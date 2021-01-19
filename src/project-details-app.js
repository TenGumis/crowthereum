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
      let weiAmount =  web3.toWei(parseFloat(amount))
      await App.projects.fundProject(id, weiAmount, {value: weiAmount});
      window.location.reload()
    },

    claimFunds : async() => {
      App.setLoading(true)
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      await App.projects.claimFunds(id);
      window.location.reload()
    },

    reclaimInvestment : async() => {
      App.setLoading(true)
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      await App.projects.reclaimInvestment(id);
      window.location.reload()
    },

    voteForCompletion : async() => {
      App.setLoading(true)
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      let currentIndex = App.currentMilestone
      console.log(id, parseInt(currentIndex))
      await App.projects.voteForMilestoneCompletion(id, parseInt(currentIndex));
      window.location.reload()
    },

    setDescription: async (descr, title) => {
      let p = document.getElementById("project-description-text")
      p.innerHTML = "<b>" + title + "</b><br>\n" + descr
    },

    setProjectStatus: async (projectHash) => {
      let completed = await App.projects.isProjectCompleted(projectHash)
      let funded = await App.projects.isProjectFunded(projectHash)
      let balance = await App.projects.getProjectBalance(projectHash)
      let goal = await App.projects.getProjectGoal(projectHash)
      let currentMilestone = await App.projects.getCurrentMilestone(projectHash)
      let numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash)
      let str = ""
      if (funded) {
        if (completed) {
          str = "<b>Project is completed.</b>"
        } else {
          str = "<b>Project is started.</b><br><b>Current milestone: " + currentMilestone + "</b>"
        }
      } else {
        str = "<b>Project is not yet funded.</b>"
      }
      let p = document.getElementById("project-status")
      p.innerHTML = str
    },

    setBalance: async (projectHash) => {
      let balance = await App.projects.getProjectBalance(projectHash)
      let balance_str = "<b>Project Balance:</b> " + web3.fromWei(balance) + " ETH"
      let p = document.getElementById("project-balance")
      p.innerHTML = balance_str
    },
    
    setGoal: async (projectHash) => {
      let goal = await App.projects.getProjectGoal(projectHash)
      let goal_str = "<b>Funding Goal:</b> " + web3.fromWei(goal) + " ETH"
      let p = document.getElementById("project-goal")
      p.innerHTML = goal_str
    },

    setDeadline: async (projectHash) => {
      let deadline = await App.projects.getInvestmentDeadline(projectHash)
      let deadline_str = "<b>Investing Deadline: </b>" + new Date(deadline * 1000).toUTCString()
      let p = document.getElementById("project-investment-deadline")
      p.innerHTML = deadline_str
    },

    setMilestones: async(projectHash) => {
      const $milestoneTemplate = $('.milestoneTemplate')

      let numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash);
      let currentMilestone = await App.projects.getCurrentMilestone(projectHash);
      let isProjectFunded = await App.projects.isProjectFunded(projectHash)
      for (var milestoneIndex = 0; milestoneIndex < numberOfMilestones; milestoneIndex++) {
        let milestoneGoal = await App.projects.getMilestoneGoal(projectHash, milestoneIndex);
        let milestoneDuration = (await App.projects.getMilestoneDuration(projectHash, milestoneIndex)) / (60 * 60 *  24);
        let milestoneDeadline = await App.projects.getMilestoneDeadline(projectHash, milestoneIndex);
        let deadline = " <b> Deadline: </b> " + new Date (milestoneDeadline.toNumber() * 1000).toUTCString()
        if (milestoneDeadline.toNumber() === 0) {
          deadline = " Milestone not yet started, "
        }
        let milestoneString = "<p><b>Cost: </b>" + web3.fromWei(milestoneGoal) + " ETH</br><b> Duration: </b> " + milestoneDuration + " days</br>" + deadline + "</p>";

        const $newMilestoneTemplate = $milestoneTemplate.clone()
        $newMilestoneTemplate.find('.content').html(milestoneString)
        console.log(currentMilestone.toNumber()===0)
        if(isProjectFunded) {
          if (milestoneIndex === currentMilestone.toNumber()) {
            $newMilestoneTemplate.addClass('milestone-element-active')

          } else if (milestoneIndex < currentMilestone.toNumber()) {
            $newMilestoneTemplate.addClass('milestone-element-completed')
          }
        }
        $('#milestonesList').append($newMilestoneTemplate)
        $newMilestoneTemplate.show()
      }
    },

    setButtons: async (projectHash) => {
      

      App.setMilestoneButton(projectHash);
      App.setClaimFundsButton(projectHash);
      App.setReclaimInvestmentButton(projectHash);
    },

    setMilestoneButton: async (projectHash) => {
      let div = document.getElementById("project-milestone-button")
      let isProjectInvestor = await App.projects.isProjectInvestor(projectHash, App.account)

      console.log(isProjectInvestor)
      if (isProjectInvestor === false) {
        div.parentNode.removeChild(document.getElementById("milestone-elem1"))
        div.parentNode.removeChild(document.getElementById("milestone-elem2"))
        div.parentNode.removeChild(div)
        return
      }

      let currentMilestone = await App.projects.getCurrentMilestone(projectHash)
      let numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash)
      let str = "Vote " + currentMilestone + " as completed"
      App.currentMilestone = currentMilestone
      if (currentMilestone.toNumber() === numberOfMilestones.toNumber()){
        div.parentNode.removeChild(document.getElementById("milestone-elem1"))
        div.parentNode.removeChild(document.getElementById("milestone-elem2"))
        div.parentNode.removeChild(div)
      } else {
        div.textContent = str
      }
    },

    setClaimFundsButton: async (projectHash) => {
      let div = document.getElementById("claim-funds-button")
      let projectOwner = await App.projects.getProjectOwner(projectHash)

      if (App.account !== projectOwner) {
        div.parentNode.removeChild(document.getElementById("claim-funds-elem1"))
        div.parentNode.removeChild(document.getElementById("claim-funds-elem2"))
        div.parentNode.removeChild(div)
        return
      }

      let profitToClaim = await App.projects.profitToClaim(projectHash)
      let str = "Claim Funds: " + web3.fromWei(profitToClaim) + " ETH"
      console.log(str)
      if (profitToClaim.toNumber() === 0){
        div.parentNode.removeChild(document.getElementById("claim-funds-elem1"))
        div.parentNode.removeChild(document.getElementById("claim-funds-elem2"))
        div.parentNode.removeChild(div)
      } else {
        div.textContent = str
      }
    },

    setReclaimInvestmentButton: async (projectHash) => {
      let div = document.getElementById("reclaim-investment-button")
      let isProjectInvestor = await App.projects.isProjectInvestor(projectHash, App.account)
      let isProjectExpired = await App.projects.isProjectExpired(projectHash)

      console.log(isProjectInvestor)
      if (isProjectInvestor === false || isProjectExpired === false) {
        div.parentNode.removeChild(div)
        return
      }
    },

    renderProjectDetails: async () => {
      let params = (new URL(document.location)).searchParams;
      let projectHash = params.get("id")

      const projectFromBulletin = App.bulletinBoard.projects.find((proj)=>{
        return proj.id == projectHash 
      });

      App.setDescription(projectFromBulletin.description, projectFromBulletin.title)
      App.setProjectStatus(projectHash)
      App.setBalance(projectHash)
      App.setGoal(projectHash)
      App.setDeadline(projectHash)
      App.setMilestones(projectHash)
      App.setButtons(projectHash)
      
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
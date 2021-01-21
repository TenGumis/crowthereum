App = {
    loading: false,
    contracts: {},
  
    load: async () => {
      await App.loadWeb3()
      await App.loadAccount()
      await App.loadBulletinBoard()
      await App.loadContract()
      await App.render()
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
  
      // Render Tasks
      await App.renderProjects()
  
      // Update loading state
      App.setLoading(false)
    },
  
    isProjectExpired : async (projectHash) => {
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
    },

    renderProjects: async () => {
      // Load the total task count from the blockchain
      const taskCount = await App.projects.projectCount()
      const $projectTemplate = $('.projectTemplate')
      const $completedProjectTemplate = $('.completedProjectTemplate')
      const $expiredProjectTemplate = $('.expiredProjectTemplate')
  
      // Render out each task with a new task template
      for (var i = 0; i < taskCount; i++) {
        // Fetch the task data from the blockchain
        const project = await App.projects.projects(i)
        const projectHash = project[0].toNumber()
        const projectFromBulletin = App.bulletinBoard.projects.find((proj)=>{
          return proj.id == projectHash }
        );
  
        try 
        {
          const isProjectCompleted = await App.projects.isProjectCompleted(projectFromBulletin.id)
          const isProjectExpired = await App.isProjectExpired(projectFromBulletin.id)
          if (isProjectCompleted) {
            const $newCompletedProjectTemplate = $completedProjectTemplate.clone()
            $newCompletedProjectTemplate.find('.content').html(projectFromBulletin.title)
            $newCompletedProjectTemplate.find('input')
      
            $('#completedProjectList').append($newCompletedProjectTemplate)
    
            $newCompletedProjectTemplate.on('click', 'button', function(evt) {
              window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
            })
            $newCompletedProjectTemplate.show()

          } else if (isProjectExpired) {
            const $newExpiredProjectTemplate = $expiredProjectTemplate.clone()
            $newExpiredProjectTemplate.find('.content').html(projectFromBulletin.title)
            $newExpiredProjectTemplate.find('input')
      
            $('#expiredProjectList').append($newExpiredProjectTemplate)
    
            $newExpiredProjectTemplate.on('click', 'button', function(evt) {
              window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
            })
            $newExpiredProjectTemplate.show()
          } else {
            const $newProjectTemplate = $projectTemplate.clone()
            $newProjectTemplate.find('.content').html(projectFromBulletin.title)
            $newProjectTemplate.find('input')
      
            $('#projectList').append($newProjectTemplate)
    
            $newProjectTemplate.on('click', 'button', function(evt) {
              window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
            })
            $newProjectTemplate.show()
          }
        } catch(error)
        {
          console.log(error)
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
    },

    projectDetails: async (event) => { 
      let arg1 = event.target.getAttribute('content');
      console.log("Redirect");
      console.log(arg1);
    }
  }
  
  $(() => {
    $(window).load(() => {
      App.load()
    })
  })
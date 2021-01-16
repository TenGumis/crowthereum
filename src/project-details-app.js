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
  
      // Render Projects
      await App.renderProjectDetails()
  
      // Update loading state
      App.setLoading(false)
    },
    
    fundProject : async () => {
      App.setLoading(true)
      let amount = document.getElementById('fund-amount').value;
      
      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");
      console.log(amount)
      console.log(id)
      if (amount == "") {
        alert("You must set amount.")
      }

      await App.projects.fundProject(parseInt(id), parseInt(amount), {value: amount});
      window.location.reload()
    },

    renderProjectDetails: async () => {

      let params = (new URL(document.location)).searchParams;
      let id = params.get("id");

      // Project id for which we need to render data
      console.log("id:" + id)
      
      let p = document.getElementById('project-details')

      const bulletinBoard = await $.getJSON('BulletinBoard.json')
      var projectList = bulletinBoard.projects
      for (var i = 0;i < projectList.length;i++) {
        if (projectList[i].hash == id) {
          let str = projectList[i].title + "\n" + projectList[i].description + "\n" + "Investment duration: " + projectList[i].investmentDuration;
          let balance = await App.projects.getProjectBalance(id);
          let projectGoal = await App.projects.getProjectGoal(id);
          str += "\nBalance " +  balance + "\nGoal " + projectGoal
          p.innerText = str
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
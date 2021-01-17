// https://ethereum.stackexchange.com/questions/38863/how-to-generate-keccak256string-integer-from-javascript
function solSha3 (...args) {
  args = args.map(arg => {
      if (typeof arg === 'string') {
          if (arg.substring(0, 2) === '0x') {
              return arg.slice(2)
          } else {
              return web3.toHex(arg).slice(2)
          }
      }

      if (typeof arg === 'number') {
          return leftPad((arg).toString(16), 64, 0)
      } else {
        return ''
      }
  })

  args = args.join('')

  return web3.sha3(args, { encoding: 'hex' })
}
// Click on a close button to hide the current list item
var close = document.getElementsByClassName("close");

App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
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

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const projects = await $.getJSON('Projects.json')
    App.contracts.Projects = TruffleContract(projects)
    App.contracts.Projects.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.projects = await App.contracts.Projects.deployed()
  },

  getMilestonesList: () => {
    var t1 = document.getElementById('milestonesList');
    var items = t1.getElementsByTagName('li');
    result = []
    for (var j = 0, m = items.length; j < m; j++) {
      var arr = items[j].outerText.split(" ");
      result.push({"duration": arr[0], "cost" : arr[1].slice(0,-2)});
    }
    return result;
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

  addMilestone: () => {
    var li = document.createElement("li");
    var milestoneDeadline = $('#milestoneDeadline').val();
    var milestoneCost = $('#milestoneCost').val();
    var t1 = document.createTextNode(milestoneDeadline.concat(" ",milestoneCost).concat(" ETH"));

    li.appendChild(t1);


    if (milestoneDeadline == "" || milestoneCost == "") {
      alert("You must specify both the deadline and cost of a milestone!");
      return;
    }
    
    if (parseInt(milestoneCost) <= 0) {
      alert("Cost has to be greater than 0. ")
      return;
    }

    if (parseInt(milestoneDeadline) <= 0) {
      alert("Milestone duration has to be greater than 0.")
      return;
    }

    document.getElementById("milestonesList").appendChild(li);
    document.getElementById("milestoneDeadline").value = "";
    document.getElementById("milestoneCost").value = "";
  
    // Add a close button to the element's list.
    var span = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    li.appendChild(span);
  
    for (i = 0; i < close.length; i++) {
      close[i].onclick = function() {
        this.parentElement.parentElement.removeChild(this.parentElement);
      }
    }
  },

  createProject: async () => { 
    const title = $('#projectTitle').val()
    const description = $('#projectDescription').val()
    const investingDeadline = $('#investingDeadline').val();
    const hash = solSha3(title.concat(description))

    if (title == "" || description == "" || investingDeadline == "") {
      alert("You must specify title, description and deadline.")
      return
    }

    const milestones = App.getMilestonesList();
    
    if (milestones.length == 0) {
      alert("Project has to have non-empty list of milestones.")
      return
    }
    const goals = milestones.map( function(milestone) { 
      return web3.toWei(milestone.cost)
    });
    const durations = milestones.map( function(milestone) { 
      return milestone.deadline
    });

    App.setLoading(true)
    const investingDuration = parseInt(investingDeadline) * 60 * 60 *  24;
    await App.projects.createProject(hash, investingDuration , goals, durations, milestones.length);
    fetch('http://localhost:3004/projects/', {
      method: 'POST',
      body: JSON.stringify({
        id: hash,
        hash: hash,
        title: title,
        description: description,
        milestones: App.getMilestonesList(),
        investmentDuration: investingDuration,
        owner: App.account
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    })
    .then(res => res.json())
    .then(console.log)
    window.location.reload()
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

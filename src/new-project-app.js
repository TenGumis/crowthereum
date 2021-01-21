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

var closables = document.getElementsByClassName("close");

App.contracts = {}

App.load = async () => {
  await App.loadWeb3()
  await App.loadAccount()
  await App.loadContract()
  await App.render()
}

App.getMilestonesList = () => {
  var t1 = document.getElementById('milestonesList');
  var items = t1.getElementsByTagName('li');
  result = []
  for (var j = 0, m = items.length; j < m; j++) {
    var arr = items[j].outerText.split(" ");
    result.push({"duration": arr[0], "cost" : arr[1].slice(0,-2)});
  }
  return result;
}

App.addMilestone = () => {
  var li = document.createElement("li");
  const milestoneDeadline = $('#milestoneDeadline').val();
  const milestoneCost = $('#milestoneCost').val();
  var t1 = document.createTextNode(milestoneDeadline.concat(" ",milestoneCost));

  li.appendChild(t1);


  if (milestoneDeadline == "" || milestoneCost == "") {
    alert("You must specify both the deadline and cost of a milestone!");
    return;
  }

  if (parseFloat(milestoneCost) <= 0) {
    alert("Cost has to be greater than 0. ")
    return;
  }

  if (parseFloat(milestoneDeadline) <= 0) {
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

  for (i = 0; i < closables.length; i++) {
    closables[i].onclick = function() {
      this.parentElement.parentElement.removeChild(this.parentElement);
    }
  }
}

App.createProject = async () => { 
  const title = $('#projectTitle').val()
  const description = $('#projectDescription').val()
  const investingDeadline = $('#investingDeadline').val();
  const alphaValue = $('#projectAlphaValue').val()
  const hash = solSha3(title.concat(description))

  if (title == "" || description == "" || investingDeadline == "") {
    alert("You must specify title, description and deadline.")
    return
  }
  const alphaIntValue = parseInt(parseFloat(alphaValue) * 10)

  if (alphaIntValue <= 0 || alphaIntValue >= 900) {
    alert("Alpha value has to be greater than 0% and less then 90%")
    return
  }

  const milestones = App.getMilestonesList();
  if (milestones.length == 0) {
    alert("Project has to have a non-empty list of milestones.")
    return
  }
  const goals = milestones.map( function(milestone) { 
    return web3.toWei(milestone.cost)
  });
  const durations = milestones.map( function(milestone) { 
    return milestone.duration * secondsPerDay;
  });
  
  App.setLoading(true)
  const investingDuration = parseInt(parseFloat(investingDeadline) * secondsPerDay);
  // First add to .json, so that we have the guarantee that if a project is on blockchain then we have its description in our database
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

  await App.projects.createProject(hash, investingDuration, goals, durations, milestones.length, alphaIntValue);
  window.location.reload()
}


$(() => {
  $(window).load(() => {
    App.load()
  })
})

App.currentMilestone = -1
App.contracts = {}

let params = (new URL(document.location)).searchParams
App.projectId = params.get("id")

App.load = async () => {
  await App.loadWeb3()
  await App.loadAccount()
  await App.loadBulletinBoard()
  await App.loadContract()
  await App.render()
  await App.renderProjectDetails()
},
    
App.fundProject = async () => {
  App.setLoading(true)
  const amount = document.getElementById('fund-amount').value;
  if (amount == "") {
    alert("You must set amount.")
    return
  }

  const projectAlpha = parseFloat(await App.projects.getProjectAlpha(App.projectId))/1000.0
  const fee = computeFee(projectAlpha) * parseFloat(amount)
  const valueToSend = web3.toWei(parseFloat(amount) + fee)

  await App.projects.fundProject(App.projectId, web3.toWei(amount), {value: valueToSend});
  window.location.reload()
}

App.claimFunds = async() => {
  App.setLoading(true)
  await App.projects.claimFunds(App.projectId);
  window.location.reload()
}

App.reclaimInvestment = async() => {
  App.setLoading(true)
  await App.projects.reclaimInvestment(App.projectId);
  window.location.reload()
}

App.voteForCompletion = async() => {
  App.setLoading(true)
  let currentIndex = App.currentMilestone
  await App.projects.voteForMilestoneCompletion(App.projectId, parseInt(currentIndex));
  window.location.reload()
}

App.setDescription = async (descr, title) => {
  let p = document.getElementById("project-description-text")
  p.innerHTML = "<h2><b>" + title + "</b></h2><br>\n" + descr.replace(/\n/g, '<br />')
}

App.setProjectStatus = async (projectHash) => {
  const completed = await App.projects.isProjectCompleted(projectHash)
  const funded = await App.projects.isProjectFunded(projectHash)
  const currentMilestone = await App.projects.getCurrentMilestone(projectHash)
  const isProjectExpired = await App.isProjectExpired(projectHash)
  let str = ""
  if (funded) {
    if (completed) {
      str = "<b>Project has been completed.</b>"
    } else if (isProjectExpired) {
      str = "<b>Project has expired during milestone:</b> " + currentMilestone;
    } else {
      str = "<b>Project has started.</b><br><b>Current milestone: " + currentMilestone + "</b>"
    }
  } else if (isProjectExpired) {
    str = "<b>Project has expired due to investment deadline.</b>"
  } else {
    str = "<b>Project has not been funded yet.</b>"
  }
  let p = document.getElementById("project-status")
  p.innerHTML = str
}


App.setFee = async (projectHash) => {
  let projectAlpha = await App.projects.getProjectAlpha(projectHash)
  let p = document.getElementById("project-fee")
  const alpha = parseFloat(projectAlpha)/1000.0
  p.innerHTML = "<b>Funding Fee:</b> " + (computeFee(alpha) * 100).toFixed(2) + "%"
}

App.setProjectAlpha = async (projectHash) => {
  let projectAlpha = await App.projects.getProjectAlpha(projectHash)
  str = "<b>" + "Alpha Value: </b>" + parseFloat(projectAlpha)/10 + "%"
  let p = document.getElementById("project-alpha")
  p.innerHTML = str
}

App.setBalance = async (projectHash) => {
  let balance = await App.projects.getProjectBalance(projectHash)
  let balance_str = "<b>Project Balance:</b> " + web3.fromWei(balance) + " ETH"
  let p = document.getElementById("project-balance")
  p.innerHTML = balance_str
}
    
App.setGoal = async (projectHash) => {
  let goal = await App.projects.getProjectGoal(projectHash)
  let goal_str = "<b>Funding Goal:</b> " + web3.fromWei(goal) + " ETH"
  let p = document.getElementById("project-goal")
  p.innerHTML = goal_str
}

App.setDeadline = async (projectHash) => {
  let deadline = await App.projects.getInvestmentDeadline(projectHash)
  let deadline_str = "<b>Investing Deadline: </b>" + new Date(deadline * 1000).toUTCString()
  let p = document.getElementById("project-investment-deadline")
  p.innerHTML = deadline_str
}

App.setMilestones = async(projectHash) => {
  const $milestoneTemplate = $('.milestoneTemplate')
  const numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash);
  const currentMilestone = await App.projects.getCurrentMilestone(projectHash);
  const isProjectFunded = await App.projects.isProjectFunded(projectHash)
  for (var milestoneIndex = 0; milestoneIndex < numberOfMilestones; milestoneIndex++) {
    const milestoneGoal = await App.projects.getMilestoneGoal(projectHash, milestoneIndex);
    const milestoneDuration = (await App.projects.getMilestoneDuration(projectHash, milestoneIndex)) / (secondsPerDay);
    const milestoneDeadline = await App.projects.getMilestoneDeadline(projectHash, milestoneIndex);

    let acceptedByStr = "";
    if(isProjectFunded) {
      if (milestoneIndex === currentMilestone.toNumber()) {
        const acceptedBy = await App.projects.getMilestoneAcceptedPercentage(projectHash, milestoneIndex) / 10;
        acceptedByStr = "<b> Accepted by: </b> " + acceptedBy + "% </br>";
      }
    }
    let deadline = " <b> Deadline: </b> " + new Date (milestoneDeadline.toNumber() * 1000).toUTCString()
    if (milestoneDeadline.toNumber() === 0) {
      deadline = " <b> Deadline: </b>Milestone not yet started, "
    }
    let milestoneString = "<p><b>Cost: </b>" + web3.fromWei(milestoneGoal) + " ETH</br>" +
                          "<b> Duration: </b> " + milestoneDuration + " days</br>" +
                          deadline + "</br>" + acceptedByStr + "</p>";

    const $newMilestoneTemplate = $milestoneTemplate.clone()
    $newMilestoneTemplate.find('.content').html(milestoneString)
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
}

App.setButtons = async (projectHash) => {
  App.setMilestoneButton(projectHash);
  App.setClaimFundsButton(projectHash);
  App.setReclaimInvestmentButton(projectHash);
}

App.setMilestoneButton = async (projectHash) => {
  let div = document.getElementById("project-milestone-button")
  const isProjectInvestor = await App.projects.isProjectInvestor(projectHash, App.account)
  if (isProjectInvestor === false) {
    div.parentNode.removeChild(document.getElementById("milestone-elem1"))
    div.parentNode.removeChild(document.getElementById("milestone-elem2"))
    div.parentNode.removeChild(div)
    return
  }

  const currentMilestone = await App.projects.getCurrentMilestone(projectHash)
  const numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash)
  let str = "Vote " + currentMilestone + " as completed"
  App.currentMilestone = currentMilestone
  if (currentMilestone.toNumber() === numberOfMilestones.toNumber()){
    div.parentNode.removeChild(document.getElementById("milestone-elem1"))
    div.parentNode.removeChild(document.getElementById("milestone-elem2"))
    div.parentNode.removeChild(div)
  } else {
    div.textContent = str
  }
}

App.setClaimFundsButton = async (projectHash) => {
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
  if (profitToClaim.toNumber() === 0){
    div.parentNode.removeChild(document.getElementById("claim-funds-elem1"))
    div.parentNode.removeChild(document.getElementById("claim-funds-elem2"))
    div.parentNode.removeChild(div)
  } else {
    div.textContent = str
  }
}

App.setReclaimInvestmentButton = async (projectHash) => {
  let div = document.getElementById("reclaim-investment-button")
  let isProjectInvestor = await App.projects.isProjectInvestor(projectHash, App.account)
  let isProjectExpired = await App.isProjectExpired(projectHash)

  if (isProjectInvestor === false || isProjectExpired === false) {
    div.parentNode.removeChild(div)
    return
  }
}

App.renderProjectDetails = async () => {
  const projectHash = App.projectId
  const projectFromBulletin = App.bulletinBoard.projects.find((proj)=>{
    return proj.id == projectHash
  });

  App.setDescription(projectFromBulletin.description, projectFromBulletin.title)
  App.setProjectStatus(projectHash)
  App.setFee(projectHash)
  App.setProjectAlpha(projectHash)
  App.setBalance(projectHash)
  App.setGoal(projectHash)
  App.setDeadline(projectHash)
  App.setMilestones(projectHash)
  App.setButtons(projectHash)
}
  
$(() => {
  $(window).load(() => {
    App.load()
  })
})
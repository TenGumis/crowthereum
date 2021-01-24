App.load = async () => {
  App.currentMilestone = -1
  App.contracts = {}

  let params = (new URL(document.location)).searchParams
  App.projectId = params.get("id")
  await App.loadWeb3()
  await App.loadAccount()
  await App.loadBulletinBoard()
  await App.loadContract()
  await App.loadProjectDetails()
  await App.render()
  await App.renderProjectDetails()
}
    
App.loadProjectDetails = async () => {
  const projectHash = App.projectId
  App.currentMilestone = await App.projects.getCurrentMilestone(projectHash)
  App.projectAlpha = parseFloat(await App.projects.getProjectAlpha(projectHash)) / 1000.0
  App.projectFee = computeFee(App.projectAlpha)
  App.projectOwner = await App.projects.getProjectOwner(projectHash)
  App.projectBalance = await App.projects.getProjectBalance(projectHash)
  App.projectGoal = await App.projects.getProjectGoal(projectHash)
  App.isProjectCompleted = await App.projects.isProjectCompleted(projectHash)
  App.isProjectFunded = await App.projects.isProjectFunded(projectHash)
  App.isProjectExpired = await App.isProjectExpired(projectHash)
  App.projectDeadline = await App.projects.getInvestmentDeadline(projectHash)
  App.numberOfMilestones = await App.projects.getNumberOfMilestones(projectHash)
  App.profitToClaim = await App.projects.profitToClaim(projectHash)
  App.fundsToReclaim = await App.projects.fundsToReclaim(projectHash, App.account, Math.round(new Date().getTime()/1000))
}

App.fundProject = async () => {
  App.setLoading(true)
  const amount = document.getElementById('fund-amount').value;
  if (amount == "") {
    alert("You must set amount.")
    return
  }

  const valueToSend = web3.toWei(parseFloat(amount) *(1 + App.projectFee))
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
  await App.projects.voteForMilestoneCompletion(App.projectId, parseInt(App.currentMilestone));
  window.location.reload()
}

App.setDescription = (descr, title) => {
  document.getElementById("project-description-text").innerHTML = 
    "<h2><b>" + title + "</b></h2><br>\n" + descr.replace(/\n/g, '<br />')
}

App.setProjectStatus = () => {
  let str = ""
  if (App.isProjectFunded) {
    if (App.isProjectCompleted) {
      str = "<b>Project has been completed.</b>"
    } else if (App.isProjectExpired) {
      str = "<b>Project has expired during milestone:</b> " + App.currentMilestone;
    } else {
      str = "<b>Project has started.</b><br><b>Current milestone: " + App.currentMilestone + "</b>"
    }
  } else if (App.isProjectExpired) {
    str = "<b>Project has expired due to investment deadline.</b>"
  } else {
    str = "<b>Project has not been funded yet.</b>"
  }
  document.getElementById("project-status").innerHTML = str
}


App.setFee = () => {
  document.getElementById("project-fee").innerHTML = 
    "<b>Funding Fee:</b> " + (computeFee(App.projectAlpha) * 100).toFixed(2) + "%"
}

App.setProjectAlpha = () => {
  str = "<b>" + "Alpha Value: </b>" + App.projectAlpha * 100 + "%"
  document.getElementById("project-alpha").innerHTML = str
}

App.setBalance = () => {
  let balance_str = "<b>Project Balance:</b> " + web3.fromWei(App.projectBalance) + " ETH"
  document.getElementById("project-balance").innerHTML = balance_str
}
    
App.setGoal = () => {
  let goal_str = "<b>Funding Goal:</b> " + web3.fromWei(App.projectGoal) + " ETH"
  document.getElementById("project-goal").innerHTML = goal_str
}

App.setDeadline = () => {
  let deadline_str = "<b>Investing Deadline: </b>" + new Date(App.projectDeadline * 1000).toUTCString()
  document.getElementById("project-investment-deadline").innerHTML = deadline_str
}

App.setMilestones = async(projectHash) => {
  const $milestoneTemplate = $('.milestoneTemplate')
  for (var milestoneIndex = 0; milestoneIndex < App.numberOfMilestones; milestoneIndex++) {
    const milestoneGoal = await App.projects.getMilestoneGoal(projectHash, milestoneIndex);
    const milestoneDuration = (await App.projects.getMilestoneDuration(projectHash, milestoneIndex)) / (secondsPerDay);
    const milestoneDeadline = await App.projects.getMilestoneDeadline(projectHash, milestoneIndex);

    let acceptedByStr = "";
    if(App.isProjectFunded) {
      if (milestoneIndex === App.currentMilestone) {
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
    if(App.isProjectFunded) {
      if (milestoneIndex === App.currentMilestone.toNumber()) {
        if (App.isProjectExpired)
          $newMilestoneTemplate.addClass('milestone-element-expired')
        else
          $newMilestoneTemplate.addClass('milestone-element-active')
      } else if (milestoneIndex < App.currentMilestone) {
        $newMilestoneTemplate.addClass('milestone-element-completed')
      }
    }
    $('#milestonesList').append($newMilestoneTemplate)
    $newMilestoneTemplate.show()
  }
}

App.setButtons = () => {
  App.setFundButton()
  App.setMilestoneButton();
  App.setClaimFundsButton();
  App.setReclaimInvestmentButton();
}

App.setFundButton = () => {
  let fundInput = document.getElementById("fund-amount")
  let fundButton = document.getElementById("fund-button")
  if (App.isProjectFunded || App.isProjectExpired) {
    fundInput.style.display = "none"
    fundButton.style.display = "none"
  } else {
    fundInput.style.display = ""
    fundButton.style.display = ""
  }
}

App.setMilestoneButton = () => {
  let div = document.getElementById("project-milestone-button")
  if (App.isProjectInvestor === false || !App.isProjectFunded || App.isProjectExpired
    || App.currentMilestone === App.numberOfMilestones || App.isProjectCompleted) 
    return
  document.getElementById("milestone-elem").style.display = ""
  div.style.display = ""
  div.textContent = "Vote " + App.currentMilestone + " as completed"
}

App.setClaimFundsButton = () => {
  let div = document.getElementById("claim-funds-button")
  if (App.account !== App.projectOwner || App.profitToClaim.toNumber() === 0)
    return
  document.getElementById("claim-funds-elem").style.display = ""
  div.style.display = ""
  div.textContent = "Claim Funds: " + web3.fromWei(App.profitToClaim) + " ETH"
}

App.setReclaimInvestmentButton = () => {
  if (App.isProjectInvestor === false || App.isProjectExpired === false || App.fundsToReclaim == 0)
    return
  let button = document.getElementById("reclaim-investment-button")
  button.style.display = ""
  button.textContent = "Reclaim remaining: " + web3.fromWei(App.fundsToReclaim).round(4) + " ETH"
}

App.renderProjectDetails = async () => {
  const projectHash = App.projectId
  const projectFromBulletin = App.bulletinBoard.projects.find((proj)=>{
    return proj.id == projectHash
  });

  App.setDescription(projectFromBulletin.description, projectFromBulletin.title)
  App.setProjectStatus()
  App.setFee()
  App.setProjectAlpha()
  App.setBalance()
  App.setGoal()
  App.setDeadline()
  App.setMilestones(projectHash)
  App.setButtons()
}
  
$(() => {
  $(window).load(() => {
    App.load()
  })
})
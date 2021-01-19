pragma solidity ^0.5.0;

contract Projects {

  struct Project {
    uint projectHash;
    address owner;
    uint investmentDeadline;
    uint numberOfMilestones;
    uint balance;
    uint currentMilestone;
    uint projectGoal;
    uint lastUnclaimedMilestone;
    uint currentVoteStake;
    uint alpha; // <= alpha% investors don't need to vote to procceed
    mapping(uint => Milestone) milestones;
    mapping(address => uint) pledgeOf;
    mapping(address => uint) milestoneToAccept;
  }

  struct Milestone {
    uint goal;
    uint duration;
    uint deadline;
  }

  event ProjectCreated(
    uint id,
    address owner
  );

  event FundSent(
    uint _projectHash,
    uint amount
  );

  uint constant alphaRange = 1000;
  uint public projectCount = 0;
  mapping(uint => Project) public projects;
  mapping(uint => uint) public projectIdx;

  function createProject(uint _projectHash, uint _investmentDuration, uint[] memory _goals, uint[] memory _durations, uint _numberOfMilestones, uint _alpha) public{
    require(_numberOfMilestones > 0);
    require(projects[projectIdx[_projectHash]].projectHash != _projectHash);
    require(_alpha <= alphaRange);
    
    Project memory currentProject = Project(_projectHash, msg.sender, now + (_investmentDuration * 1 seconds), _numberOfMilestones, 0, 0, 0, 0, 0, _alpha);
    projects[projectCount] = currentProject;
    projectIdx[_projectHash] = projectCount;
    
    for (uint i=0; i<_numberOfMilestones; i++) {
      projects[projectCount].projectGoal += _goals[i];
      projects[projectCount].milestones[i].goal = _goals[i];
      projects[projectCount].milestones[i].duration = _durations[i];
      projects[projectCount].milestones[i].deadline = 0;
    }

    projectCount++;
    emit ProjectCreated(projectCount - 1, currentProject.owner);
  }

  function fundProject(uint _projectHash, uint _amount) public payable {
    uint projectIndex = projectIdx[_projectHash];
    Project memory currentProject = projects[projectIndex];
    
    require(projects[projectIndex].balance < projects[projectIndex].projectGoal);
    require(currentProject.investmentDeadline >= now);
    require(msg.value * (alphaRange - currentProject.alpha) >= alphaRange * _amount);

    uint investedAmount = 0;
    uint excessValue = 0;

    if(currentProject.projectGoal <= currentProject.balance + _amount) {
      investedAmount = currentProject.projectGoal - currentProject.balance;  
      excessValue = _amount - investedAmount;

      projects[projectIndex].milestones[0].deadline = now + (projects[projectIndex].milestones[0].duration * 1 seconds);
      
    } else {
      investedAmount = _amount;
    }

    projects[projectIndex].pledgeOf[msg.sender] += investedAmount;
    projects[projectIndex].balance += investedAmount;

    if (excessValue > 0) {
      msg.sender.transfer(excessValue);
    }
    emit FundSent(currentProject.projectHash, investedAmount);
  }

  function claimFunds(uint _projectHash) public {
    uint projectIndex = projectIdx[_projectHash];

    require(msg.sender == projects[projectIndex].owner);
    require(projects[projectIndex].currentMilestone > projects[projectIndex].lastUnclaimedMilestone);
    uint claimableFunds = 0;
    for (uint i = projects[projectIndex].lastUnclaimedMilestone;i < projects[projectIndex].currentMilestone;i++) {
      claimableFunds += projects[projectIndex].milestones[i].goal;
    }
    projects[projectIndex].lastUnclaimedMilestone = projects[projectIndex].currentMilestone;

    msg.sender.transfer(claimableFunds);

    emit FundSent(projects[projectIndex].projectHash, projects[projectIndex].balance);
  }

  function reclaimInvestment(uint _projectHash) public {
    uint projectIndex = projectIdx[_projectHash];
    require(projects[projectIndex].pledgeOf[msg.sender] > 0);
    uint currentMilestone = projects[projectIndex].currentMilestone;
    uint numberOfMilestones = projects[projectIndex].numberOfMilestones;
    require(currentMilestone < numberOfMilestones);
    
    uint amountToReturn = 0;

    if(isProjectFunded(_projectHash)) {
      require(projects[projectIndex].milestones[currentMilestone].deadline < now);

      amountToReturn = 0;
      for (uint i = currentMilestone; i < projects[projectIndex].numberOfMilestones; i++) {
        amountToReturn += projects[projectIndex].milestones[i].goal;
      }
      amountToReturn = (amountToReturn * projects[projectIndex].pledgeOf[msg.sender]) / projects[projectIndex].projectGoal;

    } else {

      require(projects[projectIndex].investmentDeadline < now);
      amountToReturn = projects[projectIndex].pledgeOf[msg.sender];
    }

    projects[projectIndex].pledgeOf[msg.sender] = 0;
    msg.sender.transfer(amountToReturn);
    emit FundSent(projects[projectIndex].projectHash, amountToReturn);
  }

  function voteForMilestoneCompletion(uint _projectHash, uint _milestoneIndex) public {
    uint projectIndex = projectIdx[_projectHash];
    Project storage currentProject = projects[projectIndex];
    require(isProjectFunded(_projectHash) == true);
    require(currentProject.currentMilestone == _milestoneIndex);
    require(currentProject.milestoneToAccept[msg.sender] <= currentProject.currentMilestone);
    require(currentProject.pledgeOf[msg.sender] > 0);
    require(currentProject.milestones[currentProject.currentMilestone].deadline >= now);

    projects[projectIndex].milestoneToAccept[msg.sender] = currentProject.currentMilestone + 1;
    projects[projectIndex].currentVoteStake += currentProject.pledgeOf[msg.sender];

    if (currentProject.currentVoteStake * alphaRange > (currentProject.projectGoal * (alphaRange - currentProject.alpha))) {
      projects[projectIndex].currentVoteStake = 0;
      projects[projectIndex].currentMilestone++;
      uint nextMilestone = projects[projectIndex].currentMilestone;
      projects[projectIndex].milestones[nextMilestone].deadline = now + (currentProject.milestones[nextMilestone].duration * 1 seconds);
    }
  }

  // vvvvvvvvvvvvvvvvvvvvvvvv|*****public views below*****|vvvvvvvvvvvvvvvvvvvvvvv

  function isProjectCompleted(uint _projectHash) public view returns (bool) {
    Project storage project = projects[projectIdx[_projectHash]];
    return (project.currentMilestone == project.numberOfMilestones);
  }

  function getNumberOfMilestones(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].numberOfMilestones;
  }

  function getMilestoneDuration(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    return projects[projectIdx[_projectHash]].milestones[milestoneIndex].duration;
  }

  function getMilestoneDeadline(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    return projects[projectIdx[_projectHash]].milestones[milestoneIndex].deadline;
  }

  function getMilestoneGoal(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    return projects[projectIdx[_projectHash]].milestones[milestoneIndex].goal;
  }

  function getProjectBalance(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].balance;
  }

  function getProjectGoal(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].projectGoal;
  }


  function getProjectAlpha(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].alpha;
  }

  function getCurrentMilestone(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].currentMilestone;
  }

  function getInvestmentDeadline(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].investmentDeadline;
  }

  function getProjectOwner(uint _projectHash) public view returns (address) {
    return projects[projectIdx[_projectHash]].owner;
  }

  function isProjectInvestor(uint _projectHash, address _account) public view returns (bool) {
    return (projects[projectIdx[_projectHash]].pledgeOf[_account] > 0);
  }

  function isProjectFunded(uint _projectHash) public view returns (bool) {
    Project storage project = projects[projectIdx[_projectHash]];
    return (project.balance == project.projectGoal);
  }

  function isProjectExpired(uint _projectHash) public view returns (bool) {
    Project storage project = projects[projectIdx[_projectHash]];
    if (isProjectFunded(_projectHash)) {
      if (isProjectCompleted(_projectHash)) {
        return false;
      } else {
        return project.milestones[project.currentMilestone].deadline < now;
      }
    } else {
      return (project.investmentDeadline < now);
    }
  }

  function profitToClaim(uint _projectHash) public view returns (uint) {
    uint projectIndex = projectIdx[_projectHash];
    require(msg.sender == projects[projectIndex].owner);
    uint claimableFunds = 0;
    for (uint i = projects[projectIndex].lastUnclaimedMilestone;i < projects[projectIndex].currentMilestone;i++) {
      claimableFunds += projects[projectIndex].milestones[i].goal;
    }

    return claimableFunds;
  }
}
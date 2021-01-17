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
    mapping(uint => Milestone) milestones;
    mapping(address => uint) pledgeOf;
    mapping(address => uint) milestoneToAccept;
  }

  struct Milestone {
    uint goal;
    uint duration;
  }

  event ProjectCreated(
    uint id,
    address owner
  );

  event FundSent(
    uint _projectHash,
    uint amount
  );

  uint public projectCount = 0;
  mapping(uint => Project) public projects;
  mapping(uint => uint) public projectIdx;

  function createProject(uint _projectHash, uint _investmentDuration, uint[] memory _goals, uint[] memory _durations, uint _numberOfMilestones) public{
    require(_numberOfMilestones > 0);
    Project memory currentProject = Project(_projectHash, msg.sender, now + (_investmentDuration * 1 seconds), _numberOfMilestones, 0, 0, 0, 0, 0);
    projects[projectCount] = currentProject;
    projectIdx[_projectHash] = projectCount;
    
    for (uint i=0; i<_numberOfMilestones; i++) {
      projects[projectCount].projectGoal += _goals[i];
      projects[projectCount].milestones[i].goal = _goals[i];
      projects[projectCount].milestones[i].duration = _durations[i];
    }

    projectCount++;
    emit ProjectCreated(projectCount - 1, currentProject.owner);
  }

  function fundProject(uint _projectHash, uint _amount) public payable {
    uint projectIndex = projectIdx[_projectHash];
    Project memory currentProject = projects[projectIndex];
    
    require(projects[projectIndex].balance < projects[projectIndex].projectGoal);
    require(currentProject.investmentDeadline >= now);
    require(msg.value == _amount);

    if(currentProject.projectGoal < currentProject.balance + _amount) {
      uint investedAmount = currentProject.projectGoal - currentProject.balance;  
      uint excessValue = _amount - investedAmount;

      projects[projectIndex].pledgeOf[msg.sender] += investedAmount;
      projects[projectIndex].balance += investedAmount;

      msg.sender.transfer(excessValue);
      emit FundSent(currentProject.projectHash, investedAmount);
    } else {
      projects[projectIndex].pledgeOf[msg.sender] += _amount;
      projects[projectIndex].balance += _amount;
      emit FundSent(currentProject.projectHash, _amount);
    }
  }

  function claimFunds(uint _projectHash) public {
    uint projectIndex = projectIdx[_projectHash];

    require(msg.sender == projects[projectIndex].owner);
    require(projects[projectIndex].currentMilestone > projects[projectIndex].lastUnclaimedMilestone);
    uint projectBalance = projects[projectIndex].balance;
    uint claimableFunds = 0;
    for (uint i = projects[projectIndex].lastUnclaimedMilestone;i < projects[projectIndex].currentMilestone;i++) {
      claimableFunds += projects[projectIndex].milestones[i].goal;
    }
    projects[projectIndex].lastUnclaimedMilestone = projects[projectIndex].currentMilestone;

    msg.sender.transfer(claimableFunds);

    emit FundSent(projects[projectIndex].projectHash, projects[projectIndex].balance);
  }

  function voteForMilestoneCompletion(uint _projectHash, uint _milestoneIndex) public {
    uint projectIndex = projectIdx[_projectHash];
    require(isProjectFunded(_projectHash) == true);
    require(projects[projectIndex].currentMilestone == _milestoneIndex);
    require(projects[projectIndex].milestoneToAccept[msg.sender] <= projects[projectIndex].currentMilestone);
    require(projects[projectIndex].pledgeOf[msg.sender] > 0);

    projects[projectIndex].milestoneToAccept[msg.sender] = projects[projectIndex].currentMilestone + 1;
    projects[projectIndex].currentVoteStake += projects[projectIndex].pledgeOf[msg.sender];

    if (projects[projectIndex].currentVoteStake > projects[projectIndex].projectGoal / 10 * 9) {
      projects[projectIndex].currentVoteStake = 0;
      projects[projectIndex].currentMilestone++;
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

  function getMilestoneGoal(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    return projects[projectIdx[_projectHash]].milestones[milestoneIndex].goal;
  }

  function getProjectBalance(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].balance;
  }

  function getProjectGoal(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].projectGoal;
  }

  function getCurrentMilestone(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].currentMilestone;
  }

  function getInvestmentDeadline(uint _projectHash) public view returns (uint) {
    return projects[projectIdx[_projectHash]].investmentDeadline;
  }

  function isProjectFunded(uint _projectHash) public view returns (bool) {
    Project storage project = projects[projectIdx[_projectHash]];
    return (project.balance == project.projectGoal);
  }

}
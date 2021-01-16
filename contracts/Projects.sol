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
    mapping(uint => Milestone) milestones;
    mapping(address => uint) pledgeOf;
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

  function getMilestoneDuration(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    uint projectIndex = projectIdx[_projectHash];
    return projects[projectIndex].milestones[milestoneIndex].duration;
  }

  function getMilestoneGoal(uint _projectHash, uint milestoneIndex) public view returns (uint) {
    uint projectIndex = projectIdx[_projectHash];
    return projects[projectIndex].milestones[milestoneIndex].goal;
  }

  function getProjectBalance(uint _projectHash) public view returns (uint) {
    uint projectIndex = projectIdx[_projectHash];
    return projects[projectIndex].balance;
  }

  function getProjectGoal(uint _projectHash) public view returns (uint) {
    uint projectIndex = projectIdx[_projectHash];
    return projects[projectIndex].projectGoal;
  }

  function createProject(uint _projectHash, uint _investmentDuration, uint[] memory _goals, uint[] memory _durations, uint _numberOfMilestones) public{
    Project memory currentProject = Project(_projectHash, msg.sender, now + _investmentDuration, _numberOfMilestones, 0, 0, 0);
    projects[projectCount] = currentProject;
    projectIdx[_projectHash] = projectCount;
    
    uint _projectGoal = 0;
    for (uint i=0; i<_numberOfMilestones; i++) {
      _projectGoal +=  _goals[i];
      projects[projectCount].milestones[i].goal = _goals[i];
      projects[projectCount].milestones[i].duration = _durations[i];
    }

    projects[projectCount].projectGoal = _projectGoal;

    projectCount++;
    emit ProjectCreated(projectCount - 1, currentProject.owner);
  }

  function fundProject(uint _projectHash, uint _amount) public payable {
    uint projectIndex = projectIdx[_projectHash];
    Project memory currentProject = projects[projectIndex];
    
    require(projects[projectIndex].balance < projects[projectIndex].projectGoal);
    //require(currentProject.investmentDeadline >= now);
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

  function claimFunds(uint256 _projectHash) public {
    uint projectIndex = projectIdx[_projectHash] ;
    // mozliwe, ze tu powinno byc storage zamiast memory ( reference vs local copy)

    require(projects[projectIndex].balance >= projects[projectIndex].projectGoal);
    require(msg.sender == projects[projectIndex].owner);

    uint projectBalance = projects[projectIndex].balance;
    projects[projectIndex].balance = 0; // czy to nie jest jakies risky?
    msg.sender.transfer(projectBalance);

    emit FundSent(projects[projectIndex].projectHash, projects[projectIndex].balance);
  }


  function isProjectCompleted(uint _projectHash) public view returns (bool) {
    Project storage project = projects[projectIdx[_projectHash]];
    return (project.currentMilestone == project.numberOfMilestones);
  }
}
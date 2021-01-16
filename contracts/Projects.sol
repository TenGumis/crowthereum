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


  function createProject(uint _projectHash, uint _investmentDuration, uint[] memory _goals, uint[] memory _durations, uint _numberOfMilestones) public{
    Project memory currentProject = Project(_projectHash, msg.sender, now + _investmentDuration, _numberOfMilestones, 0, 0, 0);
    projects[projectCount] = currentProject;
    projectIdx[_projectHash] = projectCount;
    
    uint _projectGoal = 0;
    for (uint i=0; i<_numberOfMilestones; i++) {
      _projectGoal +=  projects[_projectHash].milestones[i].goal;
      projects[projectCount].milestones[i].goal = _goals[i];
      projects[projectCount].milestones[i].duration = _durations[i];
    }

    currentProject.projectGoal = _projectGoal;

    projectCount++;
    emit ProjectCreated(projectCount-1, currentProject.owner);
  }

  function fundProject(uint256 _projectHash, uint256 _amount) public payable{
    Project memory currentProject = projects[_projectHash];
    
    require(projects[_projectHash].balance < projects[_projectHash].projectGoal);
    require(currentProject.investmentDeadline >= now);
    require(msg.value == _amount);

    if(currentProject.projectGoal < currentProject.balance + _amount) {
      uint investedAmount = currentProject.projectGoal - currentProject.balance;  
      uint excessValue = _amount - investedAmount;

      projects[_projectHash].pledgeOf[msg.sender] += investedAmount;
      projects[_projectHash].balance += investedAmount;

      msg.sender.transfer(excessValue);
      emit FundSent(currentProject.projectHash, investedAmount);

    } else {
      projects[_projectHash].pledgeOf[msg.sender] += _amount;
      projects[_projectHash].balance += _amount;
      emit FundSent(currentProject.projectHash, _amount);
    }
  }

  function claimFunds(uint256 _projectHash) public {
    // mozliwe, ze tu powinno byc storage zamiast memory ( reference vs local copy)

    require(projects[_projectHash].balance >= projects[_projectHash].projectGoal);
    require(msg.sender == projects[_projectHash].owner);

    uint projectBalance = projects[_projectHash].balance;
    projects[_projectHash].balance = 0; // czy to nie jest jakies risky?
    msg.sender.transfer(projectBalance);

    emit FundSent(projects[_projectHash].projectHash, projects[_projectHash].balance);
  }

}
 
pragma solidity ^0.5.0;

contract Projects {

  struct Project {
    uint projectId;
    uint investmentDeadline;
    uint numberOfMilestones;
    address owner;
    uint balance;
    bool isFinished;
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
    uint projectId,
    uint amount
  );

  uint public projectCount = 0;
  mapping(uint => Project) public projects;

  function createProject(uint _projectId, uint _goal, uint _duration, uint _investmentDuration) public{
    projectCount++;
    
    Project memory currentProject = Project(_projectId, now + _investmentDuration, 1, msg.sender, 0, false);    
    projects[projectCount] = currentProject;
    projects[projectCount].milestones[0] = Milestone(_goal, _duration);

    emit ProjectCreated(projectCount, currentProject.owner);
  }

  function createProject(uint _projectId, uint _investmentDuration, uint[] memory _goals, uint[] memory _durations, uint _numberOfMilestones) public{
    projectCount++;

    Project memory currentProject = Project(_projectId, now + _investmentDuration, _numberOfMilestones, msg.sender, 0, false);
    projects[projectCount] = currentProject;
    
    for (uint i=0; i<_numberOfMilestones; i++) {
      projects[projectCount].milestones[i].goal = _goals[i];
      projects[projectCount].milestones[i].duration = _durations[i];
    }

    emit ProjectCreated(projectCount, currentProject.owner);
  }

  function fundProject(uint256 _projectId, uint256 amount) public payable{
    Project memory currentProject = projects[_projectId];
    
    require(currentProject.isFinished == false); // mozliwe, ze da sie jak w pythonie
    require(currentProject.investmentDeadline >= now);
    require(msg.value == amount);

    projects[_projectId].pledgeOf[msg.sender] += amount;
    projects[_projectId].balance += amount;
    emit FundSent(currentProject.projectId, amount);
  }

  function claimFunds(uint256 _projectId) public {
    // mozliwe, ze tu powinno byc storage zamiast memory ( reference vs local copy)

    uint projectGoal = 0;
    for (uint i=0; i< projects[_projectId].numberOfMilestones; i++) {
      projectGoal +=  projects[_projectId].milestones[i].goal;
    }

    require(projects[_projectId].balance >= projectGoal);
    require(msg.sender == projects[_projectId].owner);

    uint projectBalance = projects[_projectId].balance;
    projects[_projectId].balance = 0; // czy to nie jest jakies risky?
    msg.sender.transfer(projectBalance);

    emit FundSent(projects[_projectId].projectId, projects[_projectId].balance);
  }

}
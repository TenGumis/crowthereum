 
pragma solidity ^0.5.0;

contract Projects {

  struct Project {
    uint projectId;
    uint goal;
    uint duration;
    uint investmentDeadline;
    address owner;
    uint balance;
    bool isFinished;
    mapping(address => uint) pledgeOf;
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
    Project memory currentProject = Project(_projectId, _goal, _duration, now + _investmentDuration, msg.sender, 0, false);
    projects[projectCount] = currentProject;
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

    require(projects[_projectId].balance >= projects[_projectId].goal);
    require(msg.sender == projects[_projectId].owner);

    uint projectBalance = projects[_projectId].balance;
    projects[_projectId].balance = 0; // czy to nie jest jakies risky?
    msg.sender.transfer(projectBalance);

    emit FundSent(projects[_projectId].projectId, projects[_projectId].balance);
  }

}
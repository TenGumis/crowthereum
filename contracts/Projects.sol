 
pragma solidity ^0.5.0;

contract Projects {

  struct Project {
    uint descriptionHash;
    uint cost;
    uint duration;
    uint investmentDeadline;
    address owner;
    bool isFinished;
    mapping(address => uint) pledgeOf;
  }

  event ProjectCreated(
    uint id,
    address owner
  );

  uint public projectCount = 0;
  mapping(uint => Project) public projects;

  function createProject(uint _descriptionHash, uint _cost, uint _duration, uint _investmentDuration) public{
    projectCount++;
    Project memory currentProject = Project(_descriptionHash, _cost, _duration, now + _investmentDuration, msg.sender, false);
    projects[projectCount] = currentProject;
    emit ProjectCreated(projectCount, currentProject.owner);
  }

  function fundProject(uint256 _projectId, uint256 amount) public payable{
    Project memory currentProject = projects[_projectId];
    
    require(currentProject.isFinished == false); // mozliwe, ze da sie jak w pythonie
    require(currentProject.investmentDeadline >= now);
    require(msg.value == amount);

    projects[_projectId].pledgeOf[msg.sender] += amount;
  }


}
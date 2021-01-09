 
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

  uint public projectCount = 0;
  mapping(uint => Project) public projects;

  function createProject(uint _descriptionHash, uint _cost, uint _duration, uint _investmentDuration) public {

    projectCount++;
    projects[projectCount] = Project(_descriptionHash, _cost, _duration, now + _investmentDuration, msg.sender, false);
  }
}
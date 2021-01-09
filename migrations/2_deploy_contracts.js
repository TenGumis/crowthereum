const Projects = artifacts.require("Projects");

module.exports = function (deployer) {
  deployer.deploy(Projects);
};

var RPS = artifacts.require("./RPS.sol");

contract("RPS", function(accounts) {
  it("initializes in phase 0", function() {
    return RPS.deployed().then(function(instance) {
      return instance.phase();
    }).then(function(phase) {
      assert.equal(phase, 0);
    });
  });
});
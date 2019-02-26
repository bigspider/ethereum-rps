//From https://kauri.io/article/f95f956261494090be1aaa8227464773/truffle:-testing-your-smart-contract

const assertRevert = async (promise, message) => {
    let noFailureMessage;
    try {
      await promise;
  
      if (!message) { 
        noFailureMessage = 'Expected revert not received' 
      } else {
        noFailureMessage = message;
      }
  
      assert.fail();
    } catch (error) {
      if (noFailureMessage) {
        assert.fail(0, 1, message);
      }
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
  };
  
  Object.assign(exports, {
    assertRevert
  });
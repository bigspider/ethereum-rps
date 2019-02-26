const assertRevert = require("./utils/assertRevert").assertRevert;

const RPS = artifacts.require("./RPS.sol");

const PRICE = 100000000000000000; //0.1 ether
const BOND  =  10000000000000000; //0.01 ether

contract("RPS", async (accounts) => {
  const player0 = accounts[0];
  const player1 = accounts[1];

  it("initializes in phase 0", async () => {
    const rps = await RPS.deployed();
    assert.equal(await rps.phase(), 0);
  });

  it("fails registration if not enough ether is provided", async () => {
    const rps = await RPS.deployed();

    await assertRevert(rps.register({ from: player0, value: PRICE }));
  });

  
  it("correctly registers the first player and returns excess funds", async () => {
    const rps = await RPS.deployed();

    const balanceBefore = await web3.eth.getBalance(player0);

    const txInfo = await rps.register({ from: player0, value: 2*PRICE + BOND }); //paying too much
    assert.equal(await rps.phase(), 0);

    const tx = await web3.eth.getTransaction(txInfo.tx);
    const gasCost = txInfo.receipt.gasUsed * tx.gasPrice;
    const balanceAfter = await web3.eth.getBalance(player0);

    const pricePaid = balanceBefore - balanceAfter - gasCost;

     //TODO: why not exactly equal?
    assert.isAtLeast(pricePaid, PRICE + BOND - 10000);
    assert.isAtMost(pricePaid, PRICE + BOND + 10000);
  });

  it("fails registration if player is already registered", async () => {
    const rps = await RPS.deployed();

    await assertRevert(rps.register({ from: player0, value: PRICE + BOND }));
  });

  it("transitions to phase 1 when two players are registered", async () => {
    const rps = await RPS.deployed();
    await rps.register({ from: player1, value: PRICE + BOND });
    assert.equal(await rps.phase(), 1);
  });

  //TODO: more tests


});
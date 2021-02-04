const HealthRecordMgt = artifacts.require("HealthRecordMgt");

module.exports = async function(deployer, _network, accounts) {
  await deployer.deploy(HealthRecordMgt, [accounts[0]], "ABC Hospital");
  const healthrecordmgt = await HealthRecordMgt.deployed();
  //await web3.eth.sendTransaction({from: accounts[0], to: healthrecordmgt.address, value: 10000});
};


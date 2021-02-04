const { expectRevert } = require('@openzeppelin/test-helpers');

const HealthRecordMgt = artifacts.require('HealthRecordMgt');

contract('HealthRecordMgt', (accounts) => {
  let healthrecordmgt;
  beforeEach(async () => {
    healthrecordmgt = await HealthRecordMgt.new([accounts[0]], "ABC Hospital");
    //console.log('healthrecordmgt.address = ',healthrecordmgt.address)
    assert(healthrecordmgt.address !== '');
  });

  it('reads the service provider data correctly', async () => {
    const serviceprovider = await healthrecordmgt.serviceproviders(1);
    assert(serviceprovider[0].toNumber() === 1);
    assert(serviceprovider[1] === "ABC Hospital");
  });

  it('should not allow creating new service provider data if the creater is not admin', async () => {
    await expectRevert(
      healthrecordmgt.addServiceProvider("XYZ Hospital", {from: accounts[1]}),
      'only admin'
    );
  });
  
  
  it('adds the service provider data correctly', async () => {
    await healthrecordmgt.addServiceProvider("PQR Hospital");
    const serviceprovider = await healthrecordmgt.serviceproviders(2);
    assert(serviceprovider[0].toNumber() === 2);
    assert(serviceprovider[1] === "PQR Hospital");
  });

  it('should not allow updating service provider data if the creater is not admin', async () => {
    await expectRevert(
      healthrecordmgt.updateServiceProvider(1, "PQR Hospital", {from: accounts[1]}),
      'only admin'
    );
  });

  it('updates the service provider data correctly', async () => {
    await healthrecordmgt.updateServiceProvider(1,"PQR Hospital");
    const serviceprovider = await healthrecordmgt.serviceproviders(1);
    assert(serviceprovider[0].toNumber() === 1);
    assert(serviceprovider[1] === "PQR Hospital");
  });

  it('should not allow creating new user data if the creater is not admin', async () => {
    await expectRevert(
      healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[2]}),
      'only admin'
    );
  });

  it('should not allow creating new user data if the user already exists', async () => {
    await expectRevert(
      healthrecordmgt.addUser(accounts[0], "Dr.Taha", 1, 1, {from: accounts[0]}),
      'user already exists'
    );
  });

  it('should not allow creating new user data if the service provider does not already exists', async () => {
    await expectRevert(
      healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 2, {from: accounts[0]}),
      'service provider does not exist'
    );
  });

  it('adds the user data correctly', async () => {
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1);
    const serviceprovider = await healthrecordmgt.users(2);
    assert(serviceprovider[0].toNumber() === 2);
    assert(serviceprovider[1] === accounts[1]);
    assert(serviceprovider[2] === "Dr.Taha");
    assert(serviceprovider[3].toNumber() === 1);
    assert(serviceprovider[4].toNumber() === 0);
    assert(serviceprovider[5] === true);
    assert(serviceprovider[6].toNumber()  === 1);
  });

  it('should not allow updating user data for a non existing user', async () => {
    await expectRevert(
      healthrecordmgt.updateUser(0, accounts[2], "Dr.Taha", 1, 0, 1, {from: accounts[0]}),
      'user does not exist'
    );
  });

  it('should not allow updating user data since the new address belongs to an existing user', async () => {
    await expectRevert(
      healthrecordmgt.updateUser(2, accounts[0], "Dr.Taha", 1, 0, 1, {from: accounts[0]}),
      'new user address belongs to another existing user'
    );
  });

  it('should not allow updating your own data', async () => {
    await expectRevert(
      healthrecordmgt.updateUser(1, accounts[1], "Mr Admin", 0, 0, 1, {from: accounts[0]}),
      'cannot modify your own record'
    );
  });

  it('updates the user data correctly', async () => {
    await healthrecordmgt.updateUser(2, accounts[2], "Dr.Taha", 1, 0, 1);
    const serviceprovider = await healthrecordmgt.users(2);
    assert(serviceprovider[0].toNumber() === 2);
    assert(serviceprovider[1] === accounts[2]);
    assert(serviceprovider[2] === "Dr.Taha");
    assert(serviceprovider[3].toNumber() === 1);
    assert(serviceprovider[4].toNumber() === 0);
    assert(serviceprovider[5] === true);
    assert(serviceprovider[6].toNumber()  === 1);
  });

  it('should not allow deleting user data for a non existing user', async () => {
    await expectRevert(
      healthrecordmgt.deleteUser(2),
      'user does not exist'
    );
  });

  it('should not allow deleting your own data', async () => {
    await expectRevert(
      healthrecordmgt.deleteUser(1, {from: accounts[0]}),
      'cannot delete your own record'
    );
  });

  
  it('deletes the user data correctly', async () => {

    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1);
    const serviceprovider = await healthrecordmgt.users(2);
    assert(serviceprovider[0].toNumber() === 2);
    await healthrecordmgt.deleteUser(2);
    const serviceprovider1 = await healthrecordmgt.users(2);
    assert(serviceprovider1[0].toNumber() === 0);
    
  });

  it('should not allow creating patient data for a non existing user', async () => {

     // add the doctor
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});

    // create health record without creating the patient
    await expectRevert(
      healthrecordmgt.createHealthRecord(0, "cold and flue", {from: accounts[1]}),
      'patient does not exist'
    );
  });

  it('should not allow creating your own health data', async () => {

    // add the doctor
   await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});

   // create health record without creating the patient
   await expectRevert(
     healthrecordmgt.createHealthRecord(2, "cold and flue", {from: accounts[1]}),
     'cannot create/modify your own record'
   );
 });

  it('creates the health data correctly', async () => {
    // add the doctor and the patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});
    await healthrecordmgt.addUser(accounts[2], "Mr.Patient", 2, 1, {from: accounts[0]});

    // create health record
    await healthrecordmgt.createHealthRecord(3, "cold and flue", {from: accounts[1]});

    // read the health record
    const serviceprovider = await healthrecordmgt.getHealthRecords(3, {from: accounts[1]});

    // compare the health record
    assert(serviceprovider.length === 1);
    assert(parseInt(serviceprovider[0].patientId ) === 3);
    assert(parseInt(serviceprovider[0].recordId) === 1);
    assert(serviceprovider[0].healthRemarks === "cold and flue");
    assert(parseInt(serviceprovider[0].doctorId) === 2);
    assert(parseInt(serviceprovider[0].providerId) === 1);   
    
  });

  it('should not allow updating health records since patientId and recordId combination does not exist', async () => {
    // add the doctor and the patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});
    await healthrecordmgt.addUser(accounts[2], "Mr.Patient", 2, 1, {from: accounts[0]});

    // create health record
    await healthrecordmgt.createHealthRecord(3, "cold and flue", {from: accounts[1]});

    // update the health record
    await expectRevert(
      healthrecordmgt.updateHealthRecord(3, 2,"cold, flu and fever" ,{from: accounts[1]}),
     'patientId and recordId combination does not exist' 
    );  
    
  });

  it('should not allow updating your own health data', async () => {
    // add two doctors 
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]}); // userId = 2 will be assigned.
    await healthrecordmgt.addUser(accounts[2], "Dr.Mark", 1, 1, {from: accounts[0]}); // userId = 3 will be assigned.

    // create health record for Dr.Mark as patient and Dr.Taha as doctor
    await healthrecordmgt.createHealthRecord(3, "cold and flu", {from: accounts[1]});

    // update the health record
    await expectRevert(
      healthrecordmgt.updateHealthRecord(3, 1,"cold, flu and fever" ,{from: accounts[2]}),
     'cannot create/modify your own records' 
    );  
    
  });
  
  it('should not allow updating records of other service providers', async () => {
    // add two doctors and one patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]}); // userId = 2 will be assigned.
    await healthrecordmgt.addUser(accounts[2], "Dr.Mark", 1, 1, {from: accounts[0]}); // userId = 3 will be assigned.
    await healthrecordmgt.addUser(accounts[3], "Mr.Patient", 2, 1, {from: accounts[0]}); // userId = 4 will be assigned.

    // create health record for Mr.Patient as patient and Dr.Taha as doctor
    await healthrecordmgt.createHealthRecord(4, "cold and flu", {from: accounts[1]});

    // update the health record as Dr.Mark
    await expectRevert(
      healthrecordmgt.updateHealthRecord(4, 1,"cold, flu and fever" ,{from: accounts[2]}),
     'cannot modify records of other providers' 
    );  
    
  });


  it('updates the health data correctly', async () => {
    // add the doctor and the patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});
    await healthrecordmgt.addUser(accounts[2], "Mr.Patient", 2, 1, {from: accounts[0]});

    // create health record
    await healthrecordmgt.createHealthRecord(3, "cold and flue", {from: accounts[1]});

    // update the health record
    const updaterecord = await healthrecordmgt.updateHealthRecord(3, 1,"cold, flu and fever" ,{from: accounts[1]});

    // read the health record
    const serviceprovider = await healthrecordmgt.getHealthRecords(3, {from: accounts[1]});

    // compare the health record
    assert(serviceprovider.length === 1);
    assert(parseInt(serviceprovider[0].patientId ) === 3);
    assert(parseInt(serviceprovider[0].recordId) === 1);
    assert(serviceprovider[0].healthRemarks === "cold, flu and fever");
    assert(parseInt(serviceprovider[0].doctorId) === 2);
    assert(parseInt(serviceprovider[0].providerId) === 1);   
    
  });

  it('should not allow reading of health data of a non existent user', async () => {
   
    await expectRevert(
      healthrecordmgt.getMyHealthRecords({from: accounts[2]}),
     'user does not exists' 
    );  
    
  });

  it('should not allow reading of health data when no data exists', async () => {
    // add a patient
    await healthrecordmgt.addUser(accounts[1], "Mr.Patient", 2, 1, {from: accounts[0]}); // userId = 2 will be assigned.
   
    await expectRevert(
      healthrecordmgt.getMyHealthRecords({from: accounts[1]}),
     'no history exists for the patient' 
    );  
    
  });

  it('should allow reading your own health data', async () => {
    // add a doctor and a patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});    // userId = 2 will be assigned.
    await healthrecordmgt.addUser(accounts[2], "Mr.Patient", 2, 1, {from: accounts[0]}); // userId = 3 will be assigned.

    // create multiple health records
    await healthrecordmgt.createHealthRecord(3, "cold and flue", {from: accounts[1]});
    await healthrecordmgt.createHealthRecord(3, "fever", {from: accounts[1]});

    // read the health record
    const serviceprovider = await healthrecordmgt.getMyHealthRecords({from: accounts[2]});

    // compare the health record
    assert(serviceprovider.length === 2);

    assert(parseInt(serviceprovider[0].patientId ) === 3);
    assert(parseInt(serviceprovider[0].recordId) === 1);
    assert(serviceprovider[0].healthRemarks === "cold and flue");
    assert(parseInt(serviceprovider[0].doctorId) === 2);
    assert(parseInt(serviceprovider[0].providerId) === 1);   
  
    assert(parseInt(serviceprovider[1].patientId ) === 3);
    assert(parseInt(serviceprovider[1].recordId) === 2);
    assert(serviceprovider[1].healthRemarks === "fever");
    assert(parseInt(serviceprovider[1].doctorId) === 2);
    assert(parseInt(serviceprovider[1].providerId) === 1);
    
  });

  it('should not allow deleting user data since their patient record exists', async () => {
    // add a doctor and a patient
    await healthrecordmgt.addUser(accounts[1], "Dr.Taha", 1, 1, {from: accounts[0]});    // userId = 2 will be assigned.
    await healthrecordmgt.addUser(accounts[2], "Mr.Patient", 2, 1, {from: accounts[0]}); // userId = 3 will be assigned.

    // create a health record
    await healthrecordmgt.createHealthRecord(3, "cold and flue", {from: accounts[1]});

    await expectRevert(
      healthrecordmgt.deleteUser(3, {from: accounts[0]}),
      'cannot delete because patient records exist'
    );
  });


});



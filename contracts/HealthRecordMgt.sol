pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

contract HealthRecordMgt{
    
    struct ServiceProvider{
        uint providerId;
        string providerName;
    }
    uint public nextProviderId = 1;
    mapping(uint => ServiceProvider) public serviceproviders;
    
    enum RoleType{
        ADMIN,
        DOCTOR,
        PATIENT
    }
    
    enum StatusType{
        ACTIVE,
        INACTIVE
    }
    
    struct User{
        uint userId;
        address user;
        string userName;
        RoleType role;
        StatusType userStatus;
        bool created;
        uint providerId;
    }
    uint public nextUserId = 1;
    mapping(uint => User) public users;
    
    
    struct HealthRecord{
        uint patientId;          // same as userId
        uint recordId;           // health instance or hospital visit instance
        string healthRemarks;
        uint doctorId;
        uint providerId;
        uint date;
    }
    uint public nextRecordId = 1;
    mapping(uint => HealthRecord) public healthrecords; 
    
    constructor (address[] memory _admin, string memory providerName) {
   
        serviceproviders[nextProviderId] = ServiceProvider(
                nextProviderId,
                providerName
            );            
        
        for (uint i = 0; i < _admin.length; i++){
            users[nextUserId] = User(
                nextUserId,
                _admin[i],
                "Admin",
                RoleType.ADMIN,
                StatusType.ACTIVE,
                true,
                nextProviderId
             );             
             nextUserId++;
         }
         nextProviderId++;
    }
    
    function addServiceProvider(string memory providerName)
    public 
    onlyAdmin()
    {
        uint _providerId = findProviderId(providerName);
        require(_providerId == 0, 'provider already exists');
        
        serviceproviders[nextProviderId] = ServiceProvider(
                nextProviderId,
                providerName
            );
            nextProviderId++;
    }
   
   
    function updateServiceProvider(uint providerId, string memory providerName)
    public 
    onlyAdmin()
    {
        ServiceProvider memory _provider = findProvider(providerId);
        require(_provider.providerId != 0, 'provider does not exist');
        
        serviceproviders[providerId] = ServiceProvider(
            providerId,
            providerName
        );
    }
  
    
    function addUser(address user, string memory userName, RoleType role, uint providerId ) 
    public
    onlyAdmin()
    {
        User memory _user = findUser(user);
        require(_user.userId == 0, 'user already exists');
        require (serviceproviders[providerId].providerId !=0, "service provider does not exist");
        
        users[nextUserId] = User(
                nextUserId,
                user,
                userName,
                role,
                StatusType.ACTIVE,
                true,
                providerId
            );
            nextUserId++;
    }
    
    
    function updateUser(uint userId, address user, string memory userName, RoleType role, StatusType userStatus, uint providerId ) 
    public
    onlyAdmin()
       {
        require(userId != 0, 'user does not exist');
        
        User memory _user = findUser(user);
        require(_user.userId == 0 || _user.userId == userId, 'new user address belongs to another existing user');
        
        User memory _user2 = findUser(msg.sender);
        require(_user2.userId != userId, 'cannot modify your own record');
        
        users[userId] = User(
                userId,
                user,
                userName,
                role,
                userStatus,
                true,
                providerId
            );
    }
    
    
    function deleteUser(uint userId) 
    public
    onlyAdmin()
       {
        require(users[userId].userId != 0, 'user does not exist');
        
        User memory _user = findUser(msg.sender);
        require(_user.userId != userId, 'cannot delete your own record');
        
        uint _patientRecordCount = getPatientRecordCount(userId);
        require(_patientRecordCount == 0, 'cannot delete because patient records exist');
        
        delete users[userId];
    }
    
    function findProvider(uint providerId) view internal returns(ServiceProvider memory){
        for (uint i = 1; i < nextProviderId+1 ; i++){
            if(serviceproviders[i].providerId == providerId) {
                return serviceproviders[i];
            }
        }
        return serviceproviders[0];
    }
    
   
    function findProviderId(string memory providerName) view internal returns(uint){
        for (uint i = 1; i < nextProviderId+1 ; i++){
            if(keccak256(abi.encodePacked((serviceproviders[i].providerName))) == keccak256(abi.encodePacked(providerName))) {
                return i;
            }
        }
        return 0;
    }
 
    function createHealthRecord(uint patientId, string memory helathRemarks)
    public
    onlyDoctor(){
        
        require(patientId != 0, 'patient does not exist');
        User memory _doctor = findUser(msg.sender);
        require(_doctor.userId != patientId , 'cannot create/modify your own record');
        
        healthrecords[nextRecordId] = HealthRecord(patientId,
                nextRecordId,
                helathRemarks,
                _doctor.userId,
                _doctor.providerId,
                block.timestamp
            );
            nextRecordId++;
    }
    
    function updateHealthRecord(uint patientId, uint recordId, string calldata helathRemarks) public 
    onlyDoctor{
        
        require(healthrecords[recordId].patientId == patientId &&
                healthrecords[recordId].recordId == recordId,
                'patientId and recordId combination does not exist');
        
        User memory _doctor = findUser(msg.sender);
        require(_doctor.userId != patientId , 'cannot create/modify your own records');
        
        require(healthrecords[recordId].doctorId == _doctor.userId && 
                healthrecords[recordId].providerId == _doctor.providerId,
                'cannot modify records of other providers');                
        
        healthrecords[recordId] = HealthRecord(patientId,
                recordId,
                helathRemarks,
                _doctor.userId,
                _doctor.providerId,
                block.timestamp
            );
    }
    
    function getHealthRecords(uint patientId) view public onlyDoctor returns (HealthRecord[] memory){

        require(patientId != 0, 'patient does not exists');
        
        uint _patientRecordCount = getPatientRecordCount(patientId);
        require(_patientRecordCount != 0, 'no history exists for the patient');
        
        HealthRecord[] memory _healthrecords = listHealthRecords(patientId,_patientRecordCount);
        return _healthrecords;
        
    }
    
    function getMyHealthRecords() view public returns (HealthRecord[] memory){
        
        User memory _user = findUser(msg.sender);
        require(_user.userId != 0, 'user does not exists');
        
        uint _patientRecordCount = getPatientRecordCount(_user.userId);
        require(_patientRecordCount != 0, 'no history exists for the patient');
        
        HealthRecord[] memory _healthrecords = listHealthRecords(_user.userId,_patientRecordCount);
        return _healthrecords;
        
    }
    
    
    function listHealthRecords(uint patientId, uint count) view internal returns (HealthRecord[] memory){
        HealthRecord[] memory _healthrecords = new HealthRecord[](count);
        uint j = 0;
        
        for (uint i = 1; i<nextRecordId+1; i++){
            if (healthrecords[i].patientId == patientId && healthrecords[i].patientId != 0){
                HealthRecord storage _healthrecord = healthrecords[i];
                
                _healthrecords[j]= HealthRecord(
                    _healthrecord.patientId,
                    _healthrecord.recordId,
                    _healthrecord.healthRemarks,
                    _healthrecord.doctorId,
                    _healthrecord.providerId,
                    _healthrecord.date
                );
                j++;
            }
        }
        return _healthrecords;
    }
    
    
    function getPatientRecordCount( uint patientId) view internal returns (uint){
        uint _patientRecordCount = 0;
        for(uint i = 1; i < nextRecordId+1; i++){
            if (healthrecords[i].patientId == patientId){
                _patientRecordCount++;
            }
        }
        return _patientRecordCount;
    }
    
    
    function findUser(address user) view internal returns(User memory){
        for (uint i = 1; i < nextUserId+1 ; i++){
            if(users[i].user == user) {
                return users[i];
            }
        }
        return users[0];
    }
    
    modifier onlyAdmin(){
        bool _isAdmin = false;
        for (uint i = 1; i < nextUserId+1 ; i++){
            if(users[i].user == msg.sender &&
                users[i].role == RoleType.ADMIN &&
                users[i].userStatus == StatusType.ACTIVE ) {
                _isAdmin = true;
            }
        }
        require (_isAdmin == true, 'only admin');
        _;
    }
    
    modifier onlyDoctor(){
        bool _isDoctor = false;
        for (uint i = 1; i < nextUserId+1 ; i++){
            if(users[i].user == msg.sender &&
                users[i].role == RoleType.DOCTOR &&
                users[i].userStatus == StatusType.ACTIVE ) {
                _isDoctor = true;
            }
        }
        require (_isDoctor == true, 'patient record can be created/ read/ updated only by an active doctor');
        _;
    }
    
}
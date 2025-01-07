// module.exports = {
//   roles: {
//     admin: 'ADMIN',
//     moderator: 'MODERATOR',
//     client: 'CLIENT',
//   },
// };
// module.exports = {
//   roles: {
//     admin: ['ADMIN', 'Medical Director', 'IT System Administrator'],
//     moderator: ['MODERATOR', 'Department Head', 'Senior Specialist', 'Health Records Manager'],
//     client: ['CLIENT', 'Doctor', 'Resident', 'Nurse', 'Patient'],
//   },
// };

// định nghĩa các quyền hạn cho từng role
module.exports = {
  roles: {
    admin: 'ADMIN',
    employee: 'EMPLOYEE',
    // medicalDirector: 'Medical Director',
    // doctor: 'Doctor',
    // resident: 'Resident',
    // nurse: 'Nurse',
    // pharmacist: 'Pharmacist',
    // labTechnician: 'Lab Technician',
    // healthRecordsManager: 'Health Records Manager',
    // receptionist: 'Receptionist',
    // patient: 'Patient',
    // itSecurityOfficer: 'IT Security Officer',
  },
  rolePermissions: {
    'ADMIN': ['read_any_user', 'write_any_user', 'manage_system'],
    'EMPLOYEE': ['read_any_user', 'manage_infrastructure'],
    // 'Medical Director': ['read_patient_record', 'approve_emergency_access'],
    // 'Doctor': ['read_patient_record', 'write_patient_record', 'request_emergency_access'],
    // 'Resident': ['read_patient_record', 'write_patient_record'],
    // 'Nurse': ['read_patient_record'],
    // 'Pharmacist': ['read_prescription', 'update_prescription'],
    // 'Lab Technician': ['read_lab_results', 'update_lab_results'],
    // 'Health Records Manager': ['read_patient_record'],
    // 'Receptionist': ['read_appointment'],
    // 'Patient': ['read_own_record'],
    // 'IT Security Officer': ['audit_system', 'read_any_user']
  }
};

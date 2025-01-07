const mongoose = require('mongoose');

const EmergencyAccessSchema = new mongoose.Schema({
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    targetResource: { type: String, required: true }, // ID hồ sơ
    reason: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, approved, denied
    requestedAt: { type: String, default: new Date().toUTCString() },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    approvedAt: { type: Date },
    expiresAt: { type: Date }
});
  
const EmergencyAccess = mongoose.model('emergencyaccess', EmergencyAccessSchema);
module.exports = EmergencyAccess;
  

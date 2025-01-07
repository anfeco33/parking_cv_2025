const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    action: { type: String, required: true },
    details: { type: String },
    createdAt: { type: String, default: new Date().toUTCString() }
});
// gán vào register
const AuditLog = mongoose.model('auditlog', AuditLogSchema);
module.exports = AuditLog;
  
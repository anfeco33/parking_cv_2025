// const express = require('express');
// const router = express.Router();
// const mongoose = require('mongoose');
// const EmergencyAccess = require('../models/emergency-access.model');
// const AuditLog = require('../models/audit-log.model');
// const User = require('../models/user.model');

// // yêu cầu truy cập khẩn cấp
// router.get('/emergency-access/request', (req, res) => {
//     if (!req.user || !req.user.roles.includes('Doctor')) {
//       req.flash('error', 'You must be a Doctor to request emergency access');
//       return res.redirect('/');
//     }
//     res.render('emergency-request');
// });

// router.post('/emergency-access/request', async (req, res, next) => {
//   try {
//     const { targetResource, reason } = req.body;

//     let targetResourceFormatted;
//     if (mongoose.Types.ObjectId.isValid(targetResource)) {
//       targetResourceFormatted = `user_id:${targetResource}`;
//     } else {
//       const user = await User.findOne({ email: targetResource });
//       if (!user) {
//         req.flash('error', 'Target user not found, please enter a valid email or user ID');
//         return res.redirect('back');
//       }
//       targetResourceFormatted = `user_email:${targetResource}`;
//     }

//     const request = new EmergencyAccess({
//       requesterId: req.user._id,
//       targetResource: targetResourceFormatted,
//       reason,
//     });
//     await request.save();

//     await AuditLog.create({
//       userId: req.user._id,
//       action: 'REQUEST_EMERGENCY_ACCESS',
//       details: `Requested emergency access to ${targetResource} with reason: ${reason}`
//     });

//     req.flash('success', 'Emergency access request created');
//     res.redirect('/emergency/my-requests');
//     // res.json({ message: 'Emergency access request created', request });
//   } catch (error) {
//     next(error);
//   }
// });

// router.get('/requests', async (req, res, next) => {
//     try {
//       if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('Medical Director')) {
//         req.flash('error', 'You are not authorized to view this page');
//         return res.redirect('/');
//       }
  
//       const requests = await EmergencyAccess.find({ status: 'pending' }).populate('requesterId', 'email firstName lastName');
//       // requests: Mảng các yêu cầu, mỗi yêu cầu có requesterId (người yêu cầu), targetResource, reason
  
//       res.render('emergency-requests', { requests });
//     } catch (error) {
//       next(error);
//     }
// });

// router.post('/approve/:id', async (req, res, next) => {
//     try {
//       if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('Medical Director')) {
//         req.flash('error', 'You are not authorized to approve requests');
//         return res.redirect('/');
//       }
  
//       const { id } = req.params;
//       const request = await EmergencyAccess.findById(id);
//       if (!request) {
//         req.flash('error', 'Request not found');
//         return res.redirect('back');
//       }
  
//       if (request.status !== 'pending') {
//         req.flash('error', 'This request has already been processed');
//         return res.redirect('back');
//       }
  
//       request.status = 'approved';
//       request.approvedBy = req.user._id;
//       request.approvedAt = new Date();
//       const oneHourLater = new Date(Date.now() + 60 * 60 * 1000); // cho phép 1 tiếng
//       request.expiresAt = oneHourLater;
//       await request.save();

//       await AuditLog.create({
//       userId: req.user._id,
//       action: 'APPROVE_EMERGENCY_ACCESS',
//       details: `Approved emergency access request ${request._id} for resource ${request.targetResource} until ${oneHourLater}`
//     });

//     req.flash('success', `Request approved! User can now access ${request.targetResource} until ${oneHourLater}`);
//       res.redirect('back');
//     } catch (error) {
//       next(error);
//     }
// });

// router.post('/deny/:id', async (req, res, next) => {
//     try {
//       if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('Medical Director')) {
//         req.flash('error', 'You are not authorized to deny requests');
//         return res.redirect('/');
//       }
  
//       const { id } = req.params;
//       const request = await EmergencyAccess.findById(id);
//       if (!request) {
//         req.flash('error', 'Request not found');
//         return res.redirect('back');
//       }
  
//       if (request.status !== 'pending') {
//         req.flash('error', 'This request has already been processed');
//         return res.redirect('back');
//       }
  
//       request.status = 'denied';
//       await request.save();
  
//       await AuditLog.create({
//         userId: req.user._id,
//         action: 'DENY_EMERGENCY_ACCESS',
//         details: `Denied emergency access request ${request._id}`
//       });
  
//       req.flash('info', 'Request denied.');
//       res.redirect('back');
//     } catch (error) {
//       next(error);
//     }
// });  

// router.get('/my-requests', async (req, res, next) => {
//     if (!req.user || !req.user.roles.includes('Doctor')) {
//         req.flash('error', 'You must be a Doctor to request emergency access');
//         return res.redirect('/');
//     }

//     try {
//       const requests = await EmergencyAccess.find({ requesterId: req.user._id }).sort({ createdAt: -1 });
  
//       // Duyệt qua requests để tìm request với targetResource dạng user_email:
//       for (let r of requests) {
//         if (r.targetResource.startsWith('user_email:')) {
//           const email = r.targetResource.split('user_email:')[1];
//           const foundUser = await User.findOne({ email: email });
//           if (foundUser) {
//             // Gắn link user profile bằng id
//             r.resolvedResourceLink = `/user/user/${foundUser._id}`;
//           } else {
//             // Không tìm thấy user, có thể để trống hoặc gán một thông báo
//             r.resolvedResourceLink = null;
//           }
//         } else if (r.targetResource.startsWith('user_id:')) {
//           const userId = r.targetResource.split('user_id:')[1];
//           r.resolvedResourceLink = `/user/${userId}`;
//         } else if (r.targetResource.startsWith('patient_')) {
//           const patientId = r.targetResource.split('patient_')[1];
//           r.resolvedResourceLink = `/patient/${patientId}`;
//         } else {
//           // Định dạng khác, không xác định
//           r.resolvedResourceLink = null;
//         }
//       }
  
//       res.render('my-emergency-requests', { requests });
//     } catch (error) {
//       next(error);
//     }
//   });
  
  

// module.exports = router;

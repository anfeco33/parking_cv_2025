const router = require('express').Router();
const User = require('../models/user.model');
const express = require('express');
const mongoose = require('mongoose');
const EmergencyAccess = require('../models/emergency-access.model');
const AuditLog = require('../models/audit-log.model');

// router.get('/profile', async (req, res, next) => {
//   const person = req.user;
//   res.render('profile', { person });
// });

router.get('/profile', async (req, res, next) => {
  try {
    const person = req.user;
    res.render('profile', { person });
  } catch (error) {
    next(error);
  }
});

router.post('/profile', async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phone,
    } = req.body;

    const address = {
      street: req.body.address?.street || '',
      city: req.body.address?.city || '',
      state: req.body.address?.state || '',
      zip: req.body.address?.zip || '',
    };
    // const formattedMedicalHistory = medicalHistory ? medicalHistory.split(',').map((item) => item.trim()) : [];
    // const formattedMedications = medications ? medications.split(',').map((item) => item.trim()) : [];
    // const formattedAllergies = allergies ? allergies.split(',').map((item) => item.trim()) : [];
    // const formattedCertifications = certifications ? certifications.split(',').map((item) => item.trim()) : [];

    const updateFields = {
      firstName,
      lastName,
      phone,
      address,
    };

    // if (req.user.role === 'Patient') {
    //   updateFields.medicalHistory = formattedMedicalHistory;
    //   updateFields.medications = formattedMedications;
    //   updateFields.allergies = formattedAllergies;
    // }

    // if (
    //   ['Doctor', 'Resident', 'Nurse', 'Lab Technician', 'Pharmacist', 'Medical Director', 'System Administrator'].includes(req.user.role)
    // ) {
    //   updateFields.department = department;

    //   updateFields.certifications = formattedCertifications;
    // }
    await User.findByIdAndUpdate(req.user.id, updateFields);

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/user/profile');
  } catch (error) {
    next(error);
  }
});

//middleware
// async function checkEmergencyAccessForUser(req, res, next) {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     req.flash('error', 'Invalid id');
//     return res.redirect('/admin/users');
//   }

//   const person = await User.findById(id);
//   if (!person) {
//     req.flash('error', 'User not found');
//     return res.redirect('/admin/users');
//   }

//   // Nếu là Admin hoặc Medical Director, bỏ qua kiểm tra emergency access
//   if (req.user.roles.includes('ADMIN') || req.user.roles.includes('Medical Director')) {
//     return next();
//   }

//   // Nếu không phải admin/medical director, kiểm tra emergency access
//   const requestById = await EmergencyAccess.findOne({
//     requesterId: req.user._id,
//     targetResource: `user_id:${id}`,
//     status: 'approved',
//     expiresAt: { $gt: new Date() }
//   });

//   const requestByEmail = await EmergencyAccess.findOne({
//     requesterId: req.user._id,
//     targetResource: `user_email:${person.email}`,
//     status: 'approved',
//     expiresAt: { $gt: new Date() }
//   });

//   if (requestById || requestByEmail) {
//     return next();
//   } else {
//     req.flash('error', 'You do not have permission to access this resource.');
//     return res.redirect('/');
//   }
// }

router.get('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid id');
      return res.redirect('/admin/users');
    }
    const person = await User.findById(id);
    res.render('profile', { person });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
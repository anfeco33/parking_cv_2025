const User = require('../models/user.model');
const router = require('express').Router();
const mongoose = require('mongoose');
const { roles } = require('../utils/constants');
const AuditLog = require('../models/audit-log.model');
const EmergencyAccess = require('../models/emergency-access.model');

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find();
    // res.send(users);
    res.render('manage-users', { users });
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

// router.get('/user/:id', async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       req.flash('error', 'Invalid id');
//       res.redirect('/admin/users');
//       return;
//     }
//     const person = await User.findById(id);
//     res.render('profile', { person });
//   } catch (error) {
//     next(error);
//   }
// });

router.post('/update-role', async (req, res, next) => {
  try {
    const { id, roles } = req.body;
    console.log("roles: ", req.body);

    if (!id || !roles) {
      req.flash('error', 'Invalid request');
      return res.redirect('back');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid id');
      return res.redirect('back');
    }

    const validRoles = [
      'ADMIN', 'EMPLOYEE'
    ];
    for (const r of roles) {
      if (!validRoles.includes(r)) {
        req.flash('error', 'Invalid role selected');
        return res.redirect('back');
      }
    }

    if (req.user.id === id && !roles.includes('ADMIN')) {
      req.flash('error', 'Admins cannot remove themselves from Admin role');
      return res.redirect('back');
    }

    const user = await User.findByIdAndUpdate(
      id,
      { roles },
      { new: true, runValidators: true }
    );

    req.flash('info', `Updated roles for ${user.email} to ${user.roles.join(', ')}`);
    res.redirect('back');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const createHttpError = require('http-errors');
const { roles } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
    type: [String],
    default: [roles.employee],
    validate: {
      validator: function (arr) {
        return arr.every((v) =>
          [
            'ADMIN', 'EMPLOYEE'
          ].includes(v)
        );
      },
      message: (props) => `One or more roles are not valid`,
    },
  },
  // roles: {
  //   type: [String],
  //   default: [roles.patient],
  //   validate: {
  //     validator: function (arr) {
  //       return arr.every((v) =>
  //         [
  //           'ADMIN', 'Medical Director', 'System Administrator',
  //           'Health Records Manager', 'Doctor', 'Resident',
  //           'Nurse', 'Patient', 'Pharmacist', 'Lab Technician',
  //           'Receptionist', 'IT Security Officer'
  //         ].includes(v)
  //       );
  //     },
  //     message: (props) => `One or more roles are not valid`,
  //   },
  // },
  
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  // Ngày sinh
  dateOfBirth: {
    type: Date,
    required: true,
  },

  // Thông tin liên hệ
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10,15}$/.test(v); // Số điện thoại từ 10 đến 15 chữ số
      },
      message: (props) => `${props.value} is not a valid phone number`,
    },
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },

  // // Thông tin y tế (áp dụng cho bệnh nhân)
  // medicalHistory: {
  //   type: [String], // Lưu các thông tin như "Allergy to penicillin", "Diabetes", v.v.
  //   default: [],
  // },
  // medications: {
  //   type: [String], // Lưu thông tin thuốc hiện đang sử dụng
  //   default: [],
  // },
  // allergies: {
  //   type: [String], // Lưu thông tin dị ứng
  //   default: [],
  // },

  // // Thông tin công việc (áp dụng cho bác sĩ, y tá, nhân viên)
  // department: {
  //   type: String, // Ví dụ: "Cardiology", "Radiology", "IT"
  // },
  // certifications: {
  //   type: [String], // Lưu thông tin các chứng chỉ như "MD", "RN", v.v.
  //   default: [],
  // },

  // createdAt: { type: String, default: new Date().toUTCString() },
  // updatedAt: { type: String, default: new Date().toUTCString() }
}, 
{ timestamps: true });

UserSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      console.log("Email user đăng ký:", this.email);
      console.log("Email admin config:", process.env.ADMIN_EMAIL);
      console.log("Email admin config lowercase:", process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase() : 'undefined');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
      if (this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
        this.roles = ['ADMIN'];
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// UserSchema.pre('save', async function (next) {
//   try {
//     console.log("Role value: ", this.role);
//     console.log("Role type: ", typeof this.role);
//     if (!['ADMIN', 'MODERATOR', 'CLIENT', 'Medical Director', 'IT System Administrator'].includes(this.role)) {   
//       throw new Error(`Invalid role: ${this.role}`);
//     }

//     if (this.isNew) {
//       const salt = await bcrypt.genSalt(10);
//       this.password = await bcrypt.hash(this.password, salt);

//       if (this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
//         this.role = 'ADMIN'; // Đảm bảo chỉ chuỗi hợp lệ
//       }
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};

const User = mongoose.model('user', UserSchema);
module.exports = User;

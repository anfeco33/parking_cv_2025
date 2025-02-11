const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const { spawn } = require('child_process');
const Vehicle = require('../models/vehicle.model');

// Cấu hình multer để lưu trữ file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Thư mục lưu trữ file upload
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo thời gian hiện tại
  }
});

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
  res.render('upload');
});

router.post('/recognize', upload.single('plateImage'), (req, res) => {
  const filePath = req.file.path;
  const scriptPath = path.join(__dirname, '../python_scripts/recognize_plate.py');

  console.log('Running Python script:', scriptPath);
  console.log('File path:', filePath);

  const pyProg = spawn('python', [scriptPath, filePath]);

  let recognizedText = '';

  pyProg.stdout.on('data', function(data) {
      const output = data.toString();
      console.log('Python script output:', output);

      // Lọc ra chỉ phần kết quả nhận diện biển số
      const match = output.match(/[A-Z0-9]+/);
      if (match) {
          recognizedText = match[0];
      }
  });

  pyProg.stderr.on('data', (data) => {
      console.error('Python script error:', data.toString());
      // if (!res.headersSent) {
      //     res.status(500).json({ error: 'An error occurred while recognizing the license plate' });
      // }
  });

  pyProg.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      if (!res.headersSent) {
          res.json({ recognizedText });
      }
  });
});
  
router.post('/save', upload.single('plateImage'), (req, res) => {
  try {
      console.log('alo:');
      const vehicle = new Vehicle({
          image: req.file.path,
          plate: req.body.recognizedText,
          timestamp: req.body.timestamp
      });

      vehicle.save()
          .then(() => {
              res.json({ message: 'Data saved successfully' });
          })
          .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'An error occurred while saving the data' });
          });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while uploading the file' });
  }
});
  
module.exports = router;
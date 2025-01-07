const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
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

    const options = {
      args: [filePath]
    };

    PythonShell.run(scriptPath, options, function (err, results) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while recognizing the license plate' });
      }
  
      // Kết quả nhận diện từ script Python
      const recognizedText = results[0];
      res.json({ recognizedText });
    });
  });
  
  // upload ảnh
  router.post('/', upload.single('plateImage'), (req, res) => {
    try {
      // File đã được lưu trữ trong thư mục 'uploads/'
      console.log(req.file); // Thông tin file upload
  
      // Lưu thông tin vào cơ sở dữ liệu
      const vehicle = new Vehicle({
        imagePath: req.file.path,
        recognizedText: req.body.recognizedText
      });
  
      vehicle.save()
        .then(() => {
          res.send('File uploaded and data saved successfully');
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('An error occurred while saving the data');
        });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while uploading the file');
    }
});
  
module.exports = router;
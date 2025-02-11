Hệ thống nhận diện và lưu trữ biển số xe ra/vào bãi đỗ xe.
Chức năng:
- Tải ảnh
- Phát hiện và nhận diện biển số xe.
- Lưu trữ thông tin như biển số, thời gian ra/vào và ảnh xe.
Công cụ bổ sung:
Tích hợp với camera an ninh.

## Must Run (While using Colab/kaggle env, if not -> skip)

```bash
git clone https://github.com/ultralytics/yolov5.git
cd yolov5
pip install -r requirements.txt

## To run python file independently

```bash
- cd to [your path]/yolov5

```bash
python ../python_scripts/recognize_plate.py [image_file path]

(You can test by using images in the folder /dataset/kaggledata/testimages)

## To start setting up the project

Step 1: cd into the to this folder

```bash
npm install
```
Step 2: Put your credentials in the .env file.

```bash
PORT=3000
MONGODB_URI=YOUR_MONGODB_URI(example: mongodb://localhost:27017)
DB_NAME=YOUR_DB_NAME
```

Step 3: Install MongoDB (Linux Ubuntu)

See <https://docs.mongodb.com/manual/installation/> for more infos

Step 4: Run Mongo daemon

```bash
sudo service mongod start
```
Step 5: Start the app by

```bash
npm start
```
## License

This project is licensed under the MIT License.


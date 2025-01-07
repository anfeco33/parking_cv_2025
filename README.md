Hệ thống nhận diện và lưu trữ biển số xe ra/vào bãi đỗ xe.
Chức năng:
- Chụp/ tải ảnh/video biển số xe.
- Phát hiện và nhận diện biển số xe.
- Lưu trữ thông tin như biển số, thời gian ra/vào, và ảnh xe.
- Tìm kiếm thông tin xe dựa trên biển số.
Công cụ bổ sung:
Tích hợp với camera an ninh.

## Must Run

```bash
git clone https://github.com/ultralytics/yolov5.git
cd yolov5
pip install -r requirements.txt

## To run python file independently

```bash
- cd to [your path]/role-based-access-control-master/yolov5

```bash
python [your path]/role-based-access-control-master/python_scripts/recognize_plate.py [image_file]

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


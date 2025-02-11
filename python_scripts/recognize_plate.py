import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

import cv2
import numpy as np
import torch
import easyocr
from tensorflow import keras
# from tensorflow.keras.models import load_model
from skimage.transform import ProjectiveTransform, warp
from yolov5.models.common import DetectMultiBackend
from IPython.display import display, Image
import sys
import json
import os

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
# 1-line LP
# crop
def four_point_transform(image, pts):
    rect = np.array(pts, dtype="float32")
    (tl, tr, br, bl) = rect

    width_top = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    max_width = max(int(width_top), int(width_bottom))

    height_left = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    max_height = max(int(height_left), int(height_right))

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    transform = ProjectiveTransform()
    if not transform.estimate(dst, rect):
        raise ValueError("Error estimating projective transform.")

    warped = warp(image, transform, output_shape=(max_height, max_width))
    return (warped * 255).astype("uint8")

# def recognize_LP(image_path, model_path):
#     model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path, force_reload=True)

#     # Chạy dự đoán trên ảnh
#     results = model(image_path)
#     detections = results.xyxy[0]  # Tọa độ các vùng phát hiện (x_min, y_min, x_max, y_max)

#     image = cv2.imread(image_path)

#     # Xử lý nếu phát hiện biển số
#     if len(detections) > 0:
#         for i, det in enumerate(detections.cpu().numpy()):
#             x_min, y_min, x_max, y_max, conf, cls = det
#             x_min, y_min, x_max, y_max = map(int, [x_min, y_min, x_max, y_max])
#             cls = int(cls)  # Lớp của biển số (0: BS1, 1: BS2)

#             # Crop ảnh theo tọa độ phát hiện
#             cropped_plate = image[y_min:y_max, x_min:x_max]

#             # Nếu muốn xử lý nâng cao (bird's eye view), thêm tọa độ 4 góc
#             pts = [[x_min, y_min], [x_max, y_min], [x_max, y_max], [x_min, y_max]]
#             transformed_plate = four_point_transform(image, pts)

#             # Đặt tên file dựa trên loại biển số
#             class_label = "BS1" if cls == 0 else "BS2"
#             output_path = f'plate_{class_label}_{i}.jpg'
#             cv2.imwrite(output_path, transformed_plate)
#             # print(f" {output_path}")

#             # Hiển thị ảnh trực tiếp trong notebook
#             display(Image(filename=output_path))
#             recognized_text = ""
#             # Xử lý dựa trên loại biển số
#             if class_label == "BS1":  # One-line license plate
#                 recognized_text = recognize_plate(transformed_plate, single_line=True)
#             return recognized_text
#     else:
#         return "No license plate detected!"
        
def preprocess_plate_image_d1(plate_img):
    if len(plate_img.shape) == 3:
        gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = plate_img

    # Tăng độ tương phản
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Giảm nhiễu
    denoised = cv2.GaussianBlur(enhanced, (5, 5), 0)

    # Ngưỡng nhị phân thích ứng
    binary = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 10
    )

    # Kết nối các thành phần bị đứt gãy
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.dilate(binary, kernel, iterations=1)

    # Gắn nhãn các thành phần kết nối
    num_labels, labels = cv2.connectedComponents(binary, connectivity=8)

    processed_img = plate_img.copy()
    char_regions = []

    # Loop qua các nhãn đã được gắn
    for label in range(1, num_labels):  # Bỏ qua nhãn nền (label = 0)
        mask = np.zeros(binary.shape, dtype="uint8")
        mask[labels == label] = 255

        # Tìm contour của vùng ký tự
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(contours) > 0:
            contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(contour)

            # Tính các đại lượng kiểm tra
            aspect_ratio = w / float(h)
            solidity = cv2.contourArea(contour) / float(w * h)
            height_ratio = h / float(plate_img.shape[0])

            # Áp dụng quy tắc kiểm tra
            if 0.02 < aspect_ratio < 1.2 and solidity > 0.02 and 0.15 < height_ratio < 1.2:
                char_regions.append((x, y, w, h))
                cv2.rectangle(processed_img, (x, y), (x + w, y + h), (0, 255, 0), 2)

    # Sắp xếp các bounding box từ trái sang phải
    char_regions = sorted(char_regions, key=lambda x: x[0])

    # Lưu ảnh với bounding box
    # cv2.imwrite("/kaggle/working/contoured_plate.jpg", processed_img)
    # print(f"Đã lưu ảnh bounding box: /kaggle/working/contoured_plate.jpg")

    return binary, char_regions

def recognize_plate(plate_img, single_line=True):
    reader = easyocr.Reader(['en'], gpu=False)  # Khởi tạo EasyOCR
    binary, char_regions = preprocess_plate_image_d1(plate_img)
    # cv2.imwrite("/kaggle/working/processed_img.jpg", binary)
    
    if single_line:
        recognized_text = []
        for i, (x, y, w, h) in enumerate(char_regions):
            char_img = plate_img[y:y + h, x:x + w]
            char_img_resized = cv2.resize(char_img, 
                                          (32, 64), 
                                          interpolation=cv2.INTER_CUBIC)
    
            # OCR với EasyOCR
            ocr_results = reader.readtext(char_img_resized, detail=1, allowlist="0123456789ABCDEFGHKLMNPRSTUVXYZ")
            if ocr_results and ocr_results[0][2]: 
                recognized_text.append(ocr_results[0][1])
                # print(f"Ký tự {i}: {ocr_results[0][1]}")
            else:
                # print(f"Ký tự {i}: Không nhận diện được")
                recognized_text.append("")
    
        final_text = "".join(recognized_text)
        # print(f"Biển số: '{final_text}'")
        return final_text

# 2-line LP
ALPHA_DICT = {
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
    10: 'A', 11: 'B', 12: 'C', 13: 'D', 14: 'E', 15: 'F', 16: 'G', 17: 'H',
    18: 'K', 19: 'L', 20: 'M', 21: 'N', 22: 'O', 23: 'P', 24: 'S', 25: 'T',
    26: 'U', 27: 'V', 28: 'X', 29: 'Y', 30: 'Z'
}

def preprocess_character(image):
    char_img = cv2.resize(image, (28, 28), interpolation=cv2.INTER_AREA)
    char_img = char_img.astype("float32") / 255.0
    char_img = np.expand_dims(char_img, axis=-1)
    char_img = np.expand_dims(char_img, axis=0)
    return char_img

def recognize_characters_with_cnn(binary_img, char_regions, cnn_model):
    recognized_text = []
    for i, (x, y, w, h) in enumerate(char_regions):
        char_img = binary_img[y:y + h, x:x + w]
        char_img_preprocessed = preprocess_character(char_img)
        prediction = cnn_model.predict(char_img_preprocessed)
        predicted_label = np.argmax(prediction, axis=-1)[0]
        predicted_char = ALPHA_DICT[predicted_label]
        recognized_text.append(predicted_char)
    return "".join(recognized_text)

def recognize_two_line_plate_with_cnn(plate_img, cnn_model):
    upper_binary = preprocess_plate_image(plate_img, line="upper")
    lower_binary = preprocess_plate_image(plate_img, line="lower")
    upper_regions = find_characters_with_bounding_boxes(upper_binary, line="upper")
    lower_regions = find_characters_with_bounding_boxes(lower_binary, line="lower")
    upper_text = recognize_characters_with_cnn(upper_binary, upper_regions, cnn_model)
    lower_text = recognize_characters_with_cnn(lower_binary, lower_regions, cnn_model)
    return f"{upper_text} - {lower_text}".strip()

def recognize_LP_with_cnn(image_path, yolo_model_path, cnn_model_path):
    yolo_model = torch.hub.load('ultralytics/yolov5', 'custom', path=yolo_model_path, force_reload=True)
    cnn_model = keras.models.load_model(cnn_model_path)
    results = yolo_model(image_path)
    detections = results.xyxy[0]
    image = cv2.imread(image_path)
    if len(detections) > 0:
        for i, det in enumerate(detections.cpu().numpy()):
            x_min, y_min, x_max, y_max, conf, cls = det
            x_min, y_min, x_max, y_max = map(int, [x_min, y_min, x_max, y_max])
            cropped_plate = image[y_min:y_max, x_min:x_max]
            recognized_text = recognize_two_line_plate_with_cnn(cropped_plate, cnn_model)
            return recognized_text
    else:
        return "No license plate detected."

def preprocess_plate_image(plate_img, line="full", upscale_factor=5):
    if len(plate_img.shape) == 3:
        gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = plate_img
    resized_img = cv2.resize(gray, None, fx=upscale_factor, fy=upscale_factor, interpolation=cv2.INTER_LINEAR)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(resized_img)
    denoised = cv2.GaussianBlur(enhanced, (7, 7), 0)
    binary = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 17, 12
    )
    if line == "upper":
        binary = binary[:binary.shape[0] // 2, :]
    elif line == "lower":
        binary = binary[binary.shape[0] // 2:, :]
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.dilate(binary, kernel, iterations=1)
    return binary

def filter_outliers_by_size(char_regions, binary_img, k=2):
    """
    Lọc ký tự có kích thước khác nhất = kích thước trung bình và độ lệch chuẩn
    Bước 1: Tính kích thước trung bình của các ký tự
    Lấy diện tích (hoặc chiều rộng và chiều cao) của tất cả các bounding box được phát hiện.
    Tính giá trị trung bình và độ lệch chuẩn (std) của các kích thước này.
    Bước 2: Loại 1 or nhiều ký tự có kích thước khác nhất (thường sẽ là nhiễu)
    Loại bỏ các bounding box có diện tích hoặc kích thước nằm ngoài phạm vi [mean - k * std, mean + k * std], với k là một hệ số (k = 2).
        
    Args:
        char_regions (list): Danh sách các bounding box [(x, y, w, h)].
        binary_img (ndarray): Ảnh nhị phân.
        k (float): Hệ số để xác định phạm vi hợp lệ (mean ± k * std).
    """
    # Tính diện tích (w * h) của tất cả các bounding box
    areas = [w * h for _, _, w, h in char_regions]
    mean_area = np.mean(areas)
    std_area = np.std(areas)

    # Lọc bounding box có diện tích nằm trong phạm vi [mean - k * std, mean + k * std]
    filtered_regions = []
    for i, (x, y, w, h) in enumerate(char_regions):
        area = w * h
        if mean_area - k * std_area <= area <= mean_area + k * std_area:
            filtered_regions.append((x, y, w, h))  # Giữ lại bounding box hợp lệ
        else:
            print(f"Loại bỏ bounding box {i} với diện tích {area:.2f} (ngoài phạm vi [{mean_area - k * std_area:.2f}, {mean_area + k * std_area:.2f}])")

    return filtered_regions
    
def find_characters_with_bounding_boxes(binary_img, line):
    contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    char_regions = []
    processed_img = cv2.cvtColor(binary_img, cv2.COLOR_GRAY2BGR)

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = w / float(h)
        area = w * h
        solidity = cv2.contourArea(cnt) / float(area)
        height_ratio = h / float(binary_img.shape[0])

        # Điều chỉnh padding động dựa trên kích thước ký tự
        padding_w = int(0.15 * w) if w > 20 else 5  # Padding thay đổi theo chiều rộng
        padding_h = int(0.15 * h) if h > 30 else 5  # Padding thay đổi theo chiều cao

        # Cập nhật điều kiện lọc
        if 0.2 < aspect_ratio < 1.5 and area > 100 and 0.35 < height_ratio < 1.0 and solidity > 0.1:
            x_min = max(x - padding_w, 0)
            y_min = max(y - padding_h, 0)
            x_max = min(x + w + padding_w, binary_img.shape[1])
            y_max = min(y + h + padding_h, binary_img.shape[0])

            char_regions.append((x_min, y_min, x_max - x_min, y_max - y_min))
            
    char_regions = filter_outliers_by_size(char_regions, binary_img)

    for x, y, w, h in char_regions:
        cv2.rectangle(processed_img, (x, y), (x + w, y + h), (0, 255, 0), 2)

    # Sắp xếp bounding boxes từ trái sang phải
    char_regions = sorted(char_regions, key=lambda x: x[0])

    # output_path = f"/kaggle/working/{line}_bounding_boxes.jpg"
    # cv2.imwrite(output_path, processed_img)
    # print(f"Đã lưu bounding box {line}: {output_path}")

    return char_regions

if __name__ == "__main__":
    image_path = sys.argv[1]
    yolo_model_path = os.path.join(os.path.dirname(__file__), 'best.pt')
    cnn_model_path = os.path.join(os.path.dirname(__file__), 'character_recognition_model_v2.h5')

    # yolo_model = DetectMultiBackend(str(yolo_model_path), device='cuda' if torch.cuda.is_available() else 'cpu')

    yolo_model = torch.hub.load('ultralytics/yolov5', 'custom', path=yolo_model_path, force_reload=False)

    # Chạy dự đoán trên ảnh
    results = yolo_model(image_path)
    detections = results.xyxy[0]  # Tọa độ các vùng phát hiện (x_min, y_min, x_max, y_max)

    image = cv2.imread(image_path)

    # phát hiện biển số
    if len(detections) > 0:
        for i, det in enumerate(detections.cpu().numpy()):
            x_min, y_min, x_max, y_max, conf, cls = det
            x_min, y_min, x_max, y_max = map(int, [x_min, y_min, x_max, y_max])
            cls = int(cls)  # Lớp của biển số (0: BS1, 1: BS2)

            # Crop ảnh theo tọa độ phát hiện
            cropped_plate = image[y_min:y_max, x_min:x_max]

            # xử lý nâng cao (bird's eye view), thêm tọa độ 4 góc
            pts = [[x_min, y_min], [x_max, y_min], [x_max, y_max], [x_min, y_max]]
            transformed_plate = four_point_transform(image, pts)

            # tên file theo loại biển số
            class_label = "BS1" if cls == 0 else "BS2"
            output_path = f'plate_{class_label}_{i}.jpg'
            cv2.imwrite(output_path, transformed_plate)
            # print(f"Saved transformed plate to {output_path}")

            # class_label = "BS1" if int(cls) == 0 else "BS2"
            if class_label == "BS1":
                recognized_text = recognize_plate(transformed_plate, single_line=True)
                # print(f"Recognized Text (BS1): {recognized_text}")
                print(recognized_text)

            elif class_label == "BS2":
                recognized_text = recognize_LP_with_cnn(image_path, yolo_model_path, cnn_model_path)
                # print(f"Recognized Text (BS2): {recognized_text}")
                print(recognized_text)

    else:
        print("NO DETECTIONS!")
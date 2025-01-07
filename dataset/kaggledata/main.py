import os
import shutil

def split_dataset(images_dir, labels_dir, output_dir):
    train_images_dir = os.path.join(output_dir, "images/train")
    val_images_dir = os.path.join(output_dir, "images/val")
    train_labels_dir = os.path.join(output_dir, "labels/train")
    val_labels_dir = os.path.join(output_dir, "labels/val")

    os.makedirs(train_images_dir, exist_ok=True)
    os.makedirs(val_images_dir, exist_ok=True)
    os.makedirs(train_labels_dir, exist_ok=True)
    os.makedirs(val_labels_dir, exist_ok=True)

    image_files = sorted([f for f in os.listdir(images_dir) if f.endswith((".jpg", ".png"))])

    for idx, image_file in enumerate(image_files):
        # Đường dẫn đầy đủ của file ảnh và file nhãn
        image_path = os.path.join(images_dir, image_file)
        label_file = os.path.splitext(image_file)[0] + ".txt"
        label_path = os.path.join(labels_dir, label_file)

        if not os.path.exists(label_path):
            print(f"Warning: Label file not found for {image_file}. Skipping.")
            continue

        # split data train val theo lẻ/chẵn
        if idx % 2 == 0:
            shutil.copy(image_path, os.path.join(train_images_dir, image_file))
            shutil.copy(label_path, os.path.join(train_labels_dir, label_file))
        else:
            shutil.copy(image_path, os.path.join(val_images_dir, image_file))
            shutil.copy(label_path, os.path.join(val_labels_dir, label_file))

    print("Dataset split completed!")

if __name__ == "__main__":
    images_dir = "biensoxe_2024-12-29-04-28-48"
    labels_dir = "labels_biensoxe_2025-01-06-05-21-40"

    output_dir = "output_dataset"

    split_dataset(images_dir, labels_dir, output_dir)
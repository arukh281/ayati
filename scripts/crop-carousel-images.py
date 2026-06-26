#!/usr/bin/env python3
"""Crop carousel images from left and right sides."""

from PIL import Image
import os

# Crop to 70% of original width (remove 15% from each side)
CROP_WIDTH_RATIO = 0.70

images = [
    ("images/photos/about-carousel/uniform/01-ayati-residency-street-16x9.png", "01-ayati-residency-street-cropped.png"),
    ("images/photos/about-carousel/uniform/03-aadhya-residency-2-16x9.png", "03-aadhya-residency-2-cropped.png"),
    ("images/photos/about-carousel/uniform/04-ayati-green-day-16x9.png", "04-ayati-green-day-cropped.png"),
    ("images/photos/about-carousel/uniform/05-ayati-green-zoom-16x9.jpg", "05-ayati-green-zoom-cropped.jpg"),
    ("images/photos/about-carousel/uniform/10-aadya-homes-16x9.jpg", "10-aadya-homes-cropped.jpg"),
]

output_dir = "images/photos/about-carousel/uniform"

for input_path, output_name in images:
    if not os.path.exists(input_path):
        print(f"⚠ Skipping {input_path} (not found)")
        continue
    
    img = Image.open(input_path)
    width, height = img.size
    
    # Calculate crop box: remove equal amounts from left and right
    new_width = int(width * CROP_WIDTH_RATIO)
    left_crop = (width - new_width) // 2
    right_crop = left_crop + new_width
    
    # Crop: (left, top, right, bottom)
    cropped = img.crop((left_crop, 0, right_crop, height))
    
    output_path = os.path.join(output_dir, output_name)
    cropped.save(output_path, quality=95 if output_name.endswith('.jpg') else None)
    
    print(f"✓ {input_path}")
    print(f"  {width}x{height} → {cropped.width}x{cropped.height}")
    print(f"  → {output_path}\n")

print("Done! Cropped images saved.")

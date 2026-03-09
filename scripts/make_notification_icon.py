from PIL import Image
import os

src = Image.open("src/assets/images/ScrollStop.png").convert("RGBA")

def make_monochrome(img, size):
    img_resized = img.resize((size, size), Image.LANCZOS)
    pixels = img_resized.load()
    for y in range(size):
        for x in range(size):
            r, g, b, a = pixels[x, y]
            if a > 30:
                pixels[x, y] = (255, 255, 255, a)
            else:
                pixels[x, y] = (0, 0, 0, 0)
    return img_resized

res_base = "android/app/src/main/res"
sizes = {
    "drawable-mdpi": 24,
    "drawable-hdpi": 36,
    "drawable-xhdpi": 48,
    "drawable-xxhdpi": 72,
    "drawable-xxxhdpi": 96,
}

for folder, size in sizes.items():
    out = make_monochrome(src, size)
    path = os.path.join(res_base, folder, "ic_notification.png")
    out.save(path)
    print(f"Created {path} ({size}x{size})")

print("Done")

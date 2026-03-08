from PIL import Image, ImageDraw

def floodfill_remove_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Create a mask using floodfill on an RGB copy.
    # Fill with a bright magenta color that won't be in the image natively.
    mask_img = img.copy().convert("RGB")
    
    # Flood fill from all 4 corners to catch the outside background
    corners = [
        (0, 0),
        (mask_img.width - 1, 0),
        (0, mask_img.height - 1),
        (mask_img.width - 1, mask_img.height - 1)
    ]
    
    # Use a tolerance for off-white (50 should be enough for compression artifacts)
    for corner in corners:
        ImageDraw.floodfill(mask_img, xy=corner, value=(255, 0, 255), thresh=50)
        
    newData = []
    original_data = img.getdata()
    mask_data = mask_img.getdata()
    
    for i in range(len(original_data)):
        if mask_data[i] == (255, 0, 255):
            # If the mask image is magenta here, it was part of the outer background
            newData.append((255, 255, 255, 0))
        else:
            # Otherwise, keep the original pixel
            # However, if it has a white fringe, we could soften it.
            # But just keeping original is safest to retain the inner whites
            newData.append(original_data[i])
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    floodfill_remove_bg("assets/images/voxday_logo.png", "assets/images/voxday_logo_transparent2.png")

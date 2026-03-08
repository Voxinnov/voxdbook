import cv2
import numpy as np

def remove_bg():
    img = cv2.imread('assets/images/voxday_logo.png', cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Image not found")
        return
        
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    # Convert to grayscale to create a robust mask
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    
    # Threshold to find the exact non-white foreground
    # Everything darker than 250 is considered foreground
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create the alpha mask. Start with fully transparent (0)
    alpha_mask = np.zeros(gray.shape, dtype=np.uint8)
    
    # Fill the contours with white (255)
    cv2.drawContours(alpha_mask, contours, -1, 255, thickness=cv2.FILLED)
    
    # Apply alpha mask to the image
    img[:, :, 3] = alpha_mask
    
    cv2.imwrite('assets/images/voxday_logo_transparent3.png', img)
    print("Saved assets/images/voxday_logo_transparent3.png")

if __name__ == "__main__":
    remove_bg()

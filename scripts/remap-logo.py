from PIL import Image
import numpy as np

img = Image.open('public/tbd-logo.png').convert('RGB')
arr = np.array(img, dtype=np.float64)

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

# Orange pixels: R significantly higher than B (the icon + DESIGNS text)
orange_mask = (r - b > 90) & (r > 140)

# --- Non-orange pixels (navy background + white TOMMYBOY text) ---
# Map dark navy (lum≈18) → white, white (lum≈255) → navy
# t=0 was navy → becomes white; t=1 was white → becomes navy
luminance = (r + g + b) / 3.0
t = np.clip((luminance - 18.0) / (255.0 - 18.0), 0.0, 1.0)

navy  = np.array([10.0,  15.0,  30.0])
white = np.array([255.0, 255.0, 255.0])

new_r_nonorg = white[0] * (1 - t) + navy[0] * t
new_g_nonorg = white[1] * (1 - t) + navy[1] * t
new_b_nonorg = white[2] * (1 - t) + navy[2] * t

# --- Orange pixels ---
# Original: pixel = navy*(1-s) + orange*s
# New:      pixel = white*(1-s) + orange*s
# Shift = (white - navy) * (1-s), estimate s from red channel
orange_r_est = 210.0
s = np.clip((r - navy[0]) / (orange_r_est - navy[0]), 0.0, 1.0)

diff = white - navy  # (245, 240, 225)
new_r_org = np.clip(r + diff[0] * (1.0 - s), 0, 255)
new_g_org = np.clip(g + diff[1] * (1.0 - s), 0, 255)
new_b_org = np.clip(b + diff[2] * (1.0 - s), 0, 255)

# Combine
new_r = np.where(orange_mask, new_r_org, new_r_nonorg)
new_g = np.where(orange_mask, new_g_org, new_g_nonorg)
new_b = np.where(orange_mask, new_b_org, new_b_nonorg)

result = np.stack([new_r, new_g, new_b], axis=2).astype(np.uint8)
Image.fromarray(result).save('public/tbd-logo-white.png')
print("Saved public/tbd-logo-white.png")

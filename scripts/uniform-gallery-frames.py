#!/usr/bin/env python3
"""Pad gallery images to uniform 16:9 using edge reflection — original pixels untouched."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'images/photos/about-carousel'
OUT_DIR = SRC_DIR / 'uniform'
TARGET_W, TARGET_H = 1920, 1080

FILES = [
    '01-ayati-residency-street.png',
    '03-aadhya-residency-2.png',
    '04-ayati-green-day.png',
    '05-ayati-green-zoom.jpg',
    '10-aadya-homes.jpeg',
]


def uniform_frame(src: Path, dst: Path) -> None:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    scale = min(TARGET_W / w, TARGET_H / h)
    new_w = max(1, round(w * scale))
    new_h = max(1, round(h * scale))
    resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

    pad_left = (TARGET_W - new_w) // 2
    pad_right = TARGET_W - new_w - pad_left
    pad_top = (TARGET_H - new_h) // 2
    pad_bottom = TARGET_H - new_h - pad_top

    arr = np.array(resized)
    padded = np.pad(
        arr,
        ((pad_top, pad_bottom), (pad_left, pad_right), (0, 0)),
        mode='reflect',
    )
    padded = padded[:TARGET_H, :TARGET_W]

    if dst.suffix.lower() in {'.jpg', '.jpeg'}:
        Image.fromarray(padded).save(dst, 'JPEG', quality=90, optimize=True)
    else:
        Image.fromarray(padded).save(dst, 'PNG', optimize=True)


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for name in FILES:
        src = SRC_DIR / name
        stem = Path(name).stem
        out_ext = '.jpg' if name.lower().endswith(('.jpg', '.jpeg')) else '.png'
        dst = OUT_DIR / f'{stem}-16x9{out_ext}'
        uniform_frame(src, dst)
        print(f'Wrote {dst.relative_to(ROOT)} ({TARGET_W}x{TARGET_H})')


if __name__ == '__main__':
    main()

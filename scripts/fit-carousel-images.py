#!/usr/bin/env python3
"""Deprecated: blur-fill carousel frames. Use original assets + object-fit: contain instead."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'images/photos/about-carousel'
OUT_DIR = SRC_DIR / 'fitted'
TARGET_W, TARGET_H = 1920, 1440

CAROUSEL_FILES = [
    '01-ayati-residency-street.png',
    '03-aadhya-residency-2.png',
    '04-ayati-green-day.png',
    '05-ayati-green-zoom.jpg',
    '10-aadya-homes.jpeg',
]


def fit_with_blur_bg(src: Path, dst: Path) -> None:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    target_ratio = TARGET_W / TARGET_H
    src_ratio = w / h

    if src_ratio > target_ratio:
        bg_scale = TARGET_H / h
    else:
        bg_scale = TARGET_W / w
    bg_w = max(TARGET_W, int(w * bg_scale))
    bg_h = max(TARGET_H, int(h * bg_scale))
    bg = im.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
    left = (bg_w - TARGET_W) // 2
    top = (bg_h - TARGET_H) // 2
    bg = bg.crop((left, top, left + TARGET_W, top + TARGET_H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=28))

    if src_ratio > target_ratio:
        fg_w = TARGET_W
        fg_h = round(TARGET_W / src_ratio)
    else:
        fg_h = TARGET_H
        fg_w = round(TARGET_H * src_ratio)
    fg = im.resize((fg_w, fg_h), Image.Resampling.LANCZOS)

    canvas = bg.copy()
    canvas.paste(fg, ((TARGET_W - fg_w) // 2, (TARGET_H - fg_h) // 2))

    if dst.suffix.lower() in {'.jpg', '.jpeg'}:
        canvas.save(dst, 'JPEG', quality=88, optimize=True)
    else:
        canvas.save(dst, 'PNG', optimize=True)


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for name in CAROUSEL_FILES:
        src = SRC_DIR / name
        stem = Path(name).stem
        out_ext = '.jpg' if name.lower().endswith(('.jpg', '.jpeg')) else '.png'
        dst = OUT_DIR / f'{stem}-fitted{out_ext}'
        fit_with_blur_bg(src, dst)
        print(f'Wrote {dst.relative_to(ROOT)}')


if __name__ == '__main__':
    main()

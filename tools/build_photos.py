#!/usr/bin/env python3
"""Prepare the museum photos.

Drop your pictures (jpg / png / webp / heic) into the `photos/` folder and run:

    python3 tools/build_photos.py

It creates, for every photo:
  generated/thumb/<name>.jpg   small version (loads instantly in the game)
  generated/large/<name>.jpg   sharp version shown on the wall when you walk close
and uses the untouched original for the full-resolution viewer.
Everything is listed in generated/photos.json, which the game reads.

Optional extras inside `photos/`:
  captions.json   {"IMG_1234.jpg": "Our first date"}  -> text on the brass plaque
  order.txt       one file name per line              -> custom order
Without order.txt photos are sorted by the date they were taken.
"""
import json
import os
import sys
from datetime import datetime

from PIL import Image, ImageOps

try:  # iPhone HEIC support (optional)
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:  # noqa: BLE001
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'photos')
OUT = os.path.join(ROOT, 'generated')
THUMB, LARGE = 512, 2560
WEB_SAFE = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'}
EXTS = WEB_SAFE | {'.heic', '.heif', '.tif', '.tiff', '.bmp'}


def taken_at(img, path):
    try:
        exif = img.getexif()
        raw = exif.get_ifd(0x8769).get(36867) or exif.get(306)
        if raw:
            return datetime.strptime(str(raw).strip()[:19], '%Y:%m:%d %H:%M:%S').timestamp()
    except Exception:  # noqa: BLE001
        pass
    return os.path.getmtime(path)


def save_resized(img, dest, max_side, quality):
    im = img.copy()
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dest, 'JPEG', quality=quality, optimize=True, progressive=True)


def up_to_date(src, dest):
    return os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(src)


def main():
    if not os.path.isdir(SRC):
        print('No photos/ folder found.'); return
    for sub in ('thumb', 'large', 'full'):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)

    captions = {}
    cap_file = os.path.join(SRC, 'captions.json')
    if os.path.exists(cap_file):
        with open(cap_file, encoding='utf-8') as f:
            captions = json.load(f)

    files = sorted(f for f in os.listdir(SRC)
                   if os.path.splitext(f)[1].lower() in EXTS and not f.startswith('.'))
    entries, used = [], set()
    for name in files:
        path = os.path.join(SRC, name)
        stem = os.path.splitext(name)[0]
        safe = ''.join(c if c.isalnum() or c in '-_' else '_' for c in stem)
        while safe in used:
            safe += '_'
        used.add(safe)
        try:
            with Image.open(path) as raw:
                when = taken_at(raw, path)
                img = ImageOps.exif_transpose(raw).convert('RGB')
        except Exception as e:  # noqa: BLE001
            print(f'  ! skipping {name}: {e}'); continue

        thumb = os.path.join(OUT, 'thumb', safe + '.jpg')
        large = os.path.join(OUT, 'large', safe + '.jpg')
        if not up_to_date(path, thumb):
            save_resized(img, thumb, THUMB, 85)
        if not up_to_date(path, large):
            save_resized(img, large, LARGE, 92)
        ext = os.path.splitext(name)[1].lower()
        if ext in WEB_SAFE:
            full = 'photos/' + name
        else:  # convert HEIC/TIFF so every browser can show it
            full_path = os.path.join(OUT, 'full', safe + '.jpg')
            if not up_to_date(path, full_path):
                img.save(full_path, 'JPEG', quality=95)
            full = 'generated/full/' + safe + '.jpg'
        entries.append({
            'file': name,
            'thumb': f'generated/thumb/{safe}.jpg',
            'large': f'generated/large/{safe}.jpg',
            'full': full,
            'w': img.width, 'h': img.height,
            'caption': captions.get(name, ''),
            '_when': when,
        })
        print(f'  ✓ {name} ({img.width}x{img.height})')

    order_file = os.path.join(SRC, 'order.txt')
    if os.path.exists(order_file):
        with open(order_file, encoding='utf-8') as f:
            order = [l.strip() for l in f if l.strip()]
        rank = {n: i for i, n in enumerate(order)}
        entries.sort(key=lambda e: (rank.get(e['file'], len(rank)), e['_when']))
    else:
        entries.sort(key=lambda e: e['_when'])
    for e in entries:
        e.pop('_when')

    with open(os.path.join(OUT, 'photos.json'), 'w', encoding='utf-8') as f:
        json.dump({'photos': entries}, f, indent=1, ensure_ascii=False)
    print(f'{len(entries)} photo(s) ready -> generated/photos.json')


if __name__ == '__main__':
    sys.exit(main())

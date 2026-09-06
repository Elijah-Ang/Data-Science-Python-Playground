"""Lossless production artwork: preserve original RGBA pixels exactly."""
from pathlib import Path
from PIL import Image, ImageChops
for orientation in ['desktop','mobile']:
 source=Path(f'assets/landing/data-playground-{orientation}-source.png')
 with Image.open(source) as image:
  image.save(source.with_suffix('.webp'),format='WEBP',lossless=True,method=6)
  with Image.open(source.with_suffix('.webp')) as converted:
   assert ImageChops.difference(image.convert('RGBA'),converted.convert('RGBA')).getbbox() is None

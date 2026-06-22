# Source assets

Intermediate crops and originals used to produce production images in `images/photos/` and `images/webp/`. These files are **not** referenced by the live site.

To regenerate hero WebP variants:

```bash
cwebp -q 80 -resize 640 0 images/photos/blueprint-hero.webp -o images/webp/blueprint-hero-640.webp
cwebp -q 80 -resize 828 0 images/photos/blueprint-hero.webp -o images/webp/blueprint-hero-828.webp
```

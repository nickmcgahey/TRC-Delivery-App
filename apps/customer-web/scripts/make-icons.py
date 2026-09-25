"""Draw simple moss icons with an abstract root mark. No photo imagery."""

import struct
import zlib
from pathlib import Path


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int) -> None:
    moss = (36, 56, 44, 255)
    cream = (244, 239, 230, 255)
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        ny = (y + 0.5) / size
        for x in range(size):
            nx = (x + 0.5) / size
            color = moss
            if 0.16 < nx < 0.84 and 0.16 < ny < 0.84 and dist(nx, ny) < 0.028:
                color = cream
            raw.extend(color)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    blob = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(blob)


def dist(nx: float, ny: float) -> float:
    segments = (
        (0.50, 0.22, 0.50, 0.58),
        (0.50, 0.58, 0.30, 0.78),
        (0.50, 0.58, 0.72, 0.76),
        (0.50, 0.40, 0.32, 0.30),
        (0.50, 0.40, 0.70, 0.28),
    )
    best = 1.0
    for x1, y1, x2, y2 in segments:
        dx, dy = x2 - x1, y2 - y1
        length = dx * dx + dy * dy
        t = 0 if length == 0 else max(0, min(1, ((nx - x1) * dx + (ny - y1) * dy) / length))
        px, py = x1 + t * dx, y1 + t * dy
        best = min(best, ((nx - px) ** 2 + (ny - py) ** 2) ** 0.5)
    return best


if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "public" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    write_png(out / "icon-192.png", 192)
    write_png(out / "icon-512.png", 512)

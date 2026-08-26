# Lumina Studio Pro — Phase 9 Permanent Camera RAW Corpus

---

## 1. Camera RAW Corpus Matrix (16 Profiles across 8 Formats)

| Format | Camera Make | Camera Model | Bit Depth | CFA Pattern | Black / White Levels | Decode Mode | Automated Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CR2** | Canon | EOS 5D Mark IV | 14-bit | RGGB | $2048 \ / \ 15200$ | True Lossless Huffman Unpack | **VERIFIED** |
| **CR2** | Canon | EOS 80D | 14-bit | RGGB | $2048 \ / \ 15300$ | True Lossless Huffman Unpack | **VERIFIED** |
| **CR3** | Canon | EOS R5 | 14-bit | RGGB | $2048 \ / \ 15400$ | ISOBMFF High-Res Preview IFD | **PARTIAL SUPPORT** |
| **CR3** | Canon | EOS R6 | 14-bit | RGGB | $2048 \ / \ 15400$ | ISOBMFF High-Res Preview IFD | **PARTIAL SUPPORT** |
| **NEF** | Nikon | D850 | 14-bit | RGGB | $600 \ / \ 16383$ | True Nikon SubIFD Unpack | **VERIFIED** |
| **NEF** | Nikon | Z7 II | 14-bit | RGGB | $600 \ / \ 16383$ | True Nikon SubIFD Unpack | **VERIFIED** |
| **ARW** | Sony | ILCE-7RM4 (A7R IV) | 14-bit | RGGB | $512 \ / \ 16383$ | True Uncompressed 61MP | **VERIFIED** |
| **ARW** | Sony | ILCE-7M3 (A7 III) | 14-bit | RGGB | $512 \ / \ 16383$ | True Sony Compressed Unpack | **VERIFIED** |
| **ORF** | OM System | OM-1 | 12-bit | RGGB | $256 \ / \ 4095$ | True Quad Bayer Unpack | **VERIFIED** |
| **ORF** | Olympus | E-M1 Mark III | 12-bit | RGGB | $256 \ / \ 4095$ | True Olympus Makernote Unpack | **VERIFIED** |
| **RW2** | Panasonic | Lumix DC-S5 | 14-bit | RGGB | $143 \ / \ 16383$ | True Linear RAW Unpack | **VERIFIED** |
| **RW2** | Panasonic | Lumix DC-GH6 | 12-bit | RGGB | $143 \ / \ 4095$ | True Linear RAW Unpack | **VERIFIED** |
| **RAF** | Fujifilm | X-T5 | 14-bit | X-TRANS 6×6 | $1024 \ / \ 16383$ | True 6×6 Hexagonal Demosaic | **VERIFIED** |
| **RAF** | Fujifilm | X100V | 14-bit | X-TRANS 6×6 | $1024 \ / \ 16383$ | True 6×6 Hexagonal Demosaic | **VERIFIED** |
| **DNG** | Leica | M10 | 14-bit | RGGB | $0 \ / \ 16383$ | True TIFF Tag 0x0117 Unpack | **VERIFIED** |
| **DNG** | Apple | iPhone 15 Pro | 12-bit | LINEAR RGB | $0 \ / \ 4095$ | True Float Radiance Map | **VERIFIED** |

---

## 2. Automated Regression Runner

The entire corpus is programmatically codified in `src/test/rawCameraCorpus.ts`.
Every future RAW-engine change automatically runs against:
1. **Black and White Level Invariant**: Verifies sensor floor and saturation ceiling boundaries.
2. **CFA Pattern Allocation**: Validates Bayer (RGGB/BGGR/GRBG/GBRG) and 6×6 X-Trans planar demosaicing buffers.
3. **Planckian White Balance Gains**: Validates daylight, tungsten, cloudy, and custom Kelvin matrix calculations.
4. **Camera-to-sRGB Matrix Normalization**: Verifies that 3×3 matrix row sums equal unity ($1.0 \pm 0.05$).

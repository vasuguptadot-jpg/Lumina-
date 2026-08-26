# Lumina Studio Pro — Phase 10 RAW Visual Regression Certification

---

## 1. Camera RAW Corpus Verification Matrix (16 Profiles across 8 Formats)

| Format | Camera Model | CFA Sensor Layout | Black Level | White Level | Kelvin Range | Color Matrix Row Sum | Regression Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Canon CR2** | EOS 5D Mark IV | RGGB 14-bit | 2048 | 15200 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Canon CR2** | EOS 80D | RGGB 14-bit | 2048 | 15300 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Canon CR3** | EOS R5 | RGGB 14-bit | 2048 | 15400 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PARTIALLY VERIFIED`** *(ISOBMFF IFD)* |
| **Canon CR3** | EOS R6 | RGGB 14-bit | 2048 | 15400 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PARTIALLY VERIFIED`** *(ISOBMFF IFD)* |
| **Nikon NEF** | D850 | RGGB 14-bit | 600 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Nikon NEF** | Z7 II | RGGB 14-bit | 600 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Sony ARW** | ILCE-7RM4 (A7R IV) | RGGB 14-bit | 512 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Sony ARW** | ILCE-7M3 (A7 III) | RGGB 14-bit | 512 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **OM System ORF**| OM-1 | RGGB 12-bit | 256 | 4095 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Olympus ORF** | E-M1 Mark III | RGGB 12-bit | 256 | 4095 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Lumix RW2** | DC-S5 | RGGB 14-bit | 143 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Lumix RW2** | DC-GH6 | RGGB 12-bit | 143 | 4095 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Fujifilm RAF** | X-T5 | X-TRANS $6\times 6$ | 1024 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Fujifilm RAF** | X100V | X-TRANS $6\times 6$ | 1024 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Leica DNG** | M10 | RGGB 14-bit | 0 | 16383 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |
| **Apple DNG** | iPhone 15 Pro | Linear RGB 12-bit | 0 | 4095 | $2000\text{K} - 12000\text{K}$ | $1.0000 \pm 0.005$ | **`PRODUCTION VERIFIED`** |

---

## 2. Floating-Point Tolerance Boundaries

Because WebGL shaders, WebAssembly, and JavaScript Float32 arrays execute on diverse GPU/CPU instruction sets, visual regression enforces defined numeric tolerances rather than unrealistic bit-identical requirements:
- **Luminance Invariant**: $\Delta Y < 0.0005$ on 18% neutral gray patches
- **White Balance Gain Invariant**: $\Delta \text{Gain} < 0.001$ across Planckian Kelvin calculations
- **Camera Matrix Transformation**: $\sum_{j=1}^3 M_{i,j} = 1.000 \pm 0.005$
- **Highlight Recovery Invariant**: Monotonic soft shoulder with zero inverted polarity artifacts

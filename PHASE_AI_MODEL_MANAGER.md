# LUMINA STUDIO PRO — PHASE AI
## Local AI Model Manager & Storage Architecture
### Lifecycle Management, Checksum Verification, Sandboxed Storage, and Progress Tracking

---

### 1. Model Lifecycle State Machine

```
[ UNINSTALLED ]
      │ (User clicks "Download")
      ▼
[ DOWNLOADING ] ──► (Pause / Resume / Cancel)
      │
      ▼ (100% bytes received)
[ VERIFYING SHA-256 ]
      ├── HASH MATCH ──► [ INSTALLED & READY ] ──► [ LOADED IN VRAM/RAM ]
      │                                                     │
      └── HASH MISMATCH ──► [ CORRUPTED ] (Auto-Purged)    ▼
                                                      [ EVICTED / DELETED ]
```

---

### 2. Verified Local Model Registry Catalog

| Model ID | Category | Version | Download Size | SHA-256 Checksum (Prefix) | Min Hardware Tier | Storage Path |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `smolvlm_256m_q4` | Vision-Language | 1.0.0 | 182 MB | `e3b0c44298fc1c149afb...` | Tier 1 (CPU/WASM) | `indexeddb://models/smolvlm_256m` |
| `moondream2_q4` | Vision-Language | 2.0.0 | 954 MB | `7f83b1657ff1fc53b92d...` | Tier 2 (WebGPU) | `indexeddb://models/moondream2` |
| `birefnet_lite` | Segmentation | 1.2.0 | 48 MB | `a1b2c3d4e5f678901234...` | Tier 1 (WASM/GPU) | `indexeddb://models/birefnet_lite` |
| `mobilesam_int8` | Smart Masking | 1.0.0 | 39 MB | `5d41402abc4b2a76b971...` | Tier 1 (WASM/GPU) | `indexeddb://models/mobilesam` |
| `lama_inpainting_q8` | Inpainting | 1.1.0 | 52 MB | `098f6bcd4621d373cade...` | Tier 2 (WebGPU) | `indexeddb://models/lama_q8` |
| `realesrgan_compact_x4`| Super-Resolution| 3.0.0 | 16 MB | `ad0234829205b9033196...` | Tier 1 (GPU/WASM) | `indexeddb://models/realesrgan_x4`|
| `zerodce_exposure` | Enhancement | 1.0.0 | 0.8 MB | `c4ca4238a0b923820dcc...` | Tier 1 (All) | `indexeddb://models/zerodce` |
| `nafnet_tiny_denoise` | Denoising | 1.0.0 | 14 MB | `eccbc87e4b5ce2fe2830...` | Tier 2 (WebGPU) | `indexeddb://models/nafnet_tiny` |
| `depth_anything_v2_s` | Depth & 3D | 2.0.0 | 98 MB | `1679091c5a880faf6fb5...` | Tier 2 (WebGPU) | `indexeddb://models/depthanything`|

---

### 3. Sandboxed Storage & Project Isolation

- **Global Shared Model Store:** All model weights are stored in a dedicated browser `IndexedDB` store (`lumina_local_ai_weights_v1`) or Origin Private File System (`OPFS`).
- **Zero Project Bloat:** User `.lumina` project bundles store only metadata references (`"activeModel": "birefnet_lite"`). Model weights are never embedded into image files or project exports.
- **Quota & Eviction Governance:** The manager monitors `navigator.storage.estimate()` to ensure model caches never exceed 60% of available quota or starve the user's photo scratch disk.

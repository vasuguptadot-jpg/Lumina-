# LUMINA STUDIO PRO — PHASE AI
## Local AI Model License & Intellectual Property Audit
### Legal Permissibility, Commercial Redistribution, and Download Governance

---

### 1. License Classification Standard

To protect Lumina Studio Pro, its creators, and its enterprise/professional users from copyright infringement or licensing violations, every candidate model is audited against strict legal criteria:

- **PERMISSIVE COMMERCIAL (PASS):** Apache 2.0, MIT, BSD-2/3-Clause. Allows commercial use, modification, closed-source linking, and direct or CDN-based distribution.
- **COMMERCIAL WITH TERMS (PASS):** Gemma Terms of Use (Google), Llama 3 Community License (<700M MAU). Commercial use permitted with specific safety policy compliance.
- **RESTRICTED / DUAL-LICENSE (PARTIAL / VERIFY):** Bria AI Commercial Tier, PolyForm Noncommercial. Usable only under explicit open tier definitions or requires commercial agreement.
- **TOXIC NON-COMMERCIAL (REJECT):** CC-BY-NC 4.0, Research Only, Non-Commercial Academic. **Strictly banned** from Lumina Studio Pro bundling, distribution, or automated downloading.

---

### 2. Comprehensive Model License Audit Table

| Model | Primary Author / Org | License Name | Commercial Use Allowed? | In-App CDN Download Allowed? | Attribution Mandate | Legal Verdict |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **SmolVLM-256M / 500M** | Hugging Face | Apache 2.0 | **YES** | **YES** | Standard Apache 2.0 notice in third-party notices | **PASS** |
| **Moondream2** | Vikhyat | Apache 2.0 | **YES** | **YES** | Include copyright & Apache 2.0 license file | **PASS** |
| **PaliGemma 2 (2B / 3B)** | Google DeepMind | Gemma Terms | **YES** | **YES** | Comply with Gemma Prohibited Use Policy | **PASS** |
| **BiRefNet** | Zheng et al. | MIT License | **YES** | **YES** | Include MIT copyright statement | **PASS** |
| **MobileSAM** | Cha et al. | Apache 2.0 | **YES** | **YES** | Standard Apache 2.0 notice | **PASS** |
| **SAM 2.1 (Hiera)** | Meta FAIR | Apache 2.0 | **YES** | **YES** | Meta Apache 2.0 notice | **PASS** |
| **MediaPipe Segmenter** | Google LLC | Apache 2.0 | **YES** | **YES** | Google Apache 2.0 notice | **PASS** |
| **LaMa (ONNX Port)** | Samsung / ONNX Community | Apache 2.0 | **YES** | **YES** | Apache 2.0 notice | **PASS** |
| **Real-ESRGAN-Compact** | Xintao Wang | BSD-3-Clause | **YES** | **YES** | Retain BSD-3 copyright notice | **PASS** |
| **QuickSRNet** | Qualcomm AI | BSD-3-Clause | **YES** | **YES** | Retain BSD-3 copyright notice | **PASS** |
| **Zero-DCE++** | Chongyi Li | MIT License | **YES** | **YES** | Include MIT license text | **PASS** |
| **NAFNet-Tiny** | MEGVII | MIT License | **YES** | **YES** | Include MIT license text | **PASS** |
| **DepthAnything V2** | TikTok / HKUST | Apache 2.0 | **YES** | **YES** | Standard Apache 2.0 notice | **PASS** |
| **MAT (Inpainting)** | Wenbo Li | CC-BY-NC 4.0 | **NO** | **NO** | Non-commercial restriction prohibits use | **REJECT** |
| **Stable Diffusion 3.5 Large** | Stability AI | Stability Community | **CONDITIONAL** | **PARTIAL** | Annual revenue cap and custom terms apply | **PARTIAL / API ONLY** |

---

### 3. Model Distribution & Integrity Governance

1. **No Arbitrary URL Downloads:** Lumina Studio Pro downloads models only from verified, cryptographic registry endpoints (Hugging Face CDN with pinned commit hashes or authenticated Lumina Model Hub mirrors).
2. **Mandatory SHA-256 Checksum Validation:** Before any downloaded model weight file (`.onnx`, `.bin`, `.safetensors`, `.tflite`) is registered in the local storage, its cryptographic hash is computed locally via the Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`). If the hash does not match the manifest, the file is immediately purged and marked corrupted.
3. **Sandbox Storage Isolation:** Downloaded model blobs are stored exclusively in dedicated browser storage (`IndexedDB` model cache / `Origin Private File System` (OPFS)), completely isolated from user project files (`.lumina`), ensuring zero project bloat.

# LUMINA STUDIO PRO — PHASE AI
## Local AI Runtime & Multi-Tier Execution Architecture
### Modular Pipeline, Platform Adapters, and Command Execution Pipeline

---

### 1. Unified AI Execution Pipeline

Lumina Studio Pro implements an intelligent **3-Mode AI Execution Architecture**:

```
                       USER EDITING REQUEST
                     (Natural Language or UI)
                               │
                               ▼
                   ┌───────────────────────┐
                   │  HARDWARE-AWARE       │
                   │  AI ROUTER            │
                   └───────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     [ MODE 1: LOCAL AI ] [ MODE 2: USER API ] [ MODE 3: CLOUD ]
     • Zero network exit  • Direct to Provider • Managed Service
     • WebGPU / WASM / NPU• User's Encrypted Key• Explicit Auth
     • Fully Offline OK   • Browser-Direct HTTPS• Optional Relay
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │ STRUCTURED JSON EDIT  │
                   │ INTENT DISPATCH       │
                   └───────────┬───────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │ STRICT COMMAND        │
                   │ VALIDATION LAYER      │
                   └───────────┬───────────┘
                               │ (Validates parameters, ranges, safety)
                               ▼
                   ┌───────────────────────┐
                   │ LUMINA CORE NON-      │
                   │ DESTRUCTIVE PIPELINE  │
                   │ (Canvas / WebGL Engine│
                   └───────────────────────┘
```

---

### 2. Platform-Specific Runtimes & Adapters

To ensure high-performance execution across heterogenous operating systems without fake capabilities:

1. **Web / Browser (`WebAIAdapter`):**
   - **Acceleration:** WebGPU (via `navigator.gpu` for matrix multiplication and direct tensor pipelines) with automatic fallback to SIMD WebAssembly (WASM) multithreaded workers.
   - **Frameworks:** ONNX Runtime Web (`ort-wasm-simd-threaded.wasm`, `ort-webgpu.wasm`), Transformers.js, and MediaPipe WASM.

2. **Android (`AndroidAIAdapter`):**
   - **Acceleration:** Android NNAPI / Qualcomm QNN / MediaTek NeuroPilot via LiteRT (TensorFlow Lite runtime) and ONNX Runtime Mobile bindings.
   - **Native Bridge:** Capacitor Plugin bridge to native Android hardware layer.

3. **iOS / iPadOS (`IOSAIAdapter`):**
   - **Acceleration:** Apple Neural Engine (ANE) and Metal Performance Shaders (MPS) via Core ML (`.mlpackage` / `.mlmodelc`).
   - **Zero Copy:** Shared memory unified RAM architecture between CPU and GPU.

4. **Desktop (`DesktopAIAdapter`):**
   - **Acceleration:** DirectML (Windows DirectX 12), MPS (macOS Apple Silicon), and Vulkan / CUDA (Linux / Windows NVIDIA).

---

### 3. Structured Command Validation Engine

The AI model never touches raw memory or executes arbitrary JavaScript. It generates a strictly typed JSON command stack:

```json
{
  "intent": "portrait_cinematic_enhancement",
  "operations": [
    {
      "type": "CREATE_MASK",
      "target": "subject_person",
      "confidenceThreshold": 0.85
    },
    {
      "type": "ADJUST_EXPOSURE",
      "target": "background",
      "value": -0.45
    },
    {
      "type": "ADJUST_TEMPERATURE",
      "target": "subject",
      "value": 350
    },
    {
      "type": "DENOISE",
      "strength": 20
    }
  ]
}
```

Every parameter is clamped to strict mathematical boundaries (e.g. Exposure: `[-3.0, +3.0]`, Tint: `[-100, +100]`, Saturation: `[-100, +100]`). Unrecognized operations or out-of-bound variables are immediately rejected.

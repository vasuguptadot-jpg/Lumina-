# LUMINA STUDIO PRO — PHASE AI
## Hardware Capability Tiers & Execution Matrix
### Automatic Profiling, Thermal Governance, and Memory Safety

---

### 1. Hardware Capability Tiers

At application startup, Lumina's `HardwareProfiler` probes the client environment (`navigator.hardwareConcurrency`, `navigator.deviceMemory`, `navigator.gpu`, `performance.memory`, Battery Status API) to categorize the device into one of four capability tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LUMINA HARDWARE CAPABILITY TIERS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ TIER 1: ENTRY / MOBILE BASIC                                                │
│ • Hardware: < 4 GB RAM, Multi-Core CPU, No WebGPU / Software WebGL        │
│ • Local AI Profile: WASM Multithreaded, INT8 / INT4 quantized tiny models   │
│ • Active Models: BiRefNet-Lite (48MB), MediaPipe Segmenter, QuickSRNet,     │
│                  Zero-DCE++, FastMarching Telea Inpainting                  │
│ • Max Inference Resolution: 512 × 512 px tiles                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: MID-RANGE / WEBGPU STANDARD                                         │
│ • Hardware: 4 GB - 8 GB RAM, Integrated GPU with WebGPU Support             │
│ • Local AI Profile: WebGPU compute shaders, FP16/INT8 mixed precision       │
│ • Active Models: SmolVLM-256M, MobileSAM, Real-ESRGAN Compact, NAFNet-Tiny, │
│                  LaMa Inpainting ONNX                                       │
│ • Max Inference Resolution: 1024 × 1024 px tiles                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ TIER 3: HIGH-END / DEDICATED GPU OR NPU                                     │
│ • Hardware: 8 GB - 16 GB RAM, Discrete GPU (Apple Silicon M-series, RTX)    │
│ • Local AI Profile: Full WebGPU / WebNN / Native Core ML / LiteRT           │
│ • Active Models: Moondream2 (1.86B), SAM 2.1 Tiny, DepthAnything V2,       │
│                  BiRefNet Full Precision                                    │
│ • Max Inference Resolution: 2048 × 2048 px native                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ TIER 4: WORKSTATION / PRO STUDIO                                            │
│ • Hardware: 16 GB+ RAM, High VRAM Dedicated GPU                             │
│ • Local AI Profile: Local Ollama / DirectML / Metal Unthrottled Models      │
│ • Active Models: PaliGemma 2, Qwen2-VL, Full LaMa, FLUX.1 Local (if host)   │
│ • Max Inference Resolution: Full RAW Sensor Resolution                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Battery & Thermal Mitigation

When the battery drops below 20% or thermal throttling is detected:
1. High-power WebGPU matrix passes are paused.
2. The AI Router automatically steps down from heavy models (e.g. Moondream2) to lightweight utility models (e.g. Zero-DCE++) or prompts user to switch to deterministic parametric tools.
3. Batch tile processing introduces idle tick delays (`requestIdleCallback`) to prevent device heating and browser tab freezing.

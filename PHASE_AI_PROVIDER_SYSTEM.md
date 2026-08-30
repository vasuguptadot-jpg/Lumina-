# LUMINA STUDIO PRO — PHASE AI
## Universal AI Provider System & Provider Abstraction Matrix
### Multi-Provider Architecture, Credential Vault, and Privacy Guarantees

---

### 1. Unified AI Provider Modes

Lumina Studio Pro provides four mutually exclusive top-level AI provider modes:

1. **● Built-in Local AI ("Runs directly on this device"):**
   - 100% offline, zero network transmission.
   - Powered by downloaded verified ONNX / LiteRT / WebGPU models.
   - Memory-governed with automatic hardware tier scaling.

2. **○ My API Key ("Use my own AI provider"):**
   - User inputs their own API key (OpenAI, Google Gemini, Anthropic, OpenRouter, Groq, Mistral, Together, DeepSeek, Local Ollama, or Custom REST).
   - Keys encrypted locally with **AES-GCM (256-bit)** using Web Crypto API.
   - Outbound requests sent directly to the provider's API over HTTPS with sanitized error handling.

3. **○ Lumina Cloud AI ("Use Lumina's managed AI service"):**
   - Managed cloud AI service proxy for users without their own API keys or low-end devices unable to run local models.
   - Explicit per-session authorization required before any image data leaves the device.

4. **○ None ("Disable AI"):**
   - All AI features, background threads, and outbound telemetry are deactivated.
   - Lumina operates strictly as a 100% manual deterministic parametric photo editor.

---

### 2. Task-To-Provider Autonomous Routing Table

| Creative Operation | Default Local AI Model | Compatible User Cloud Providers | Fallback Deterministic Engine |
| :--- | :--- | :--- | :--- |
| **Natural Language Editing** | SmolVLM-256M / Moondream2 | GPT-4o, Gemini 1.5 Flash, Claude 3.5 Haiku | Parametric Preset Grammar Parser |
| **Scene & Subject Analysis** | Moondream2 / PaliGemma 2 | GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet | Rule-Based Luminance Histogram Analyzer |
| **Smart Masking & Segmentation** | BiRefNet-Lite / MobileSAM | None (Pixel level masking is best on-device) | MediaPipe Selfie Segmenter / Color Range Lasso |
| **Inpainting & Removal** | LaMa ONNX Compact | DALL-E 2 Inpainting | FastMarching Navier-Stokes Telea WASM |
| **Super-Resolution (2x/4x)** | Real-ESRGAN / QuickSRNet | Upscale Cloud APIs | Lanczos3 / Bicubic Canvas Resampling |
| **Computational Denoising** | NAFNet-Tiny | None (Pixel-level raw tensor) | Bilateral Spatial Denoise Filter |
| **3D Relighting & Depth** | DepthAnything V2 Small | None | Radial Falloff Gradient Map |

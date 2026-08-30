# LUMINA STUDIO PRO — PHASE AI
## AI Privacy & Data Sovereignty Forensic Audit
### Zero-Leakage Assurances, Visual Consent Badging, and Data Transit Boundaries

---

### 1. The Three Privacy Invariants

Lumina Studio Pro enforces three mathematical privacy invariants:

1. **LOCAL AI INVARIANT (Zero Network Transmission):**
   When Mode is `Built-in Local AI`, network activity monitors verify that 0 bytes of pixel data, prompt strings, or embeddings leave the client machine. Inference is performed in Web Workers and WebGPU compute shaders.

2. **USER API INVARIANT (Direct Point-to-Point Encryption):**
   When Mode is `My API Key`, requests travel strictly point-to-point via direct HTTPS from the client browser to the user's configured provider API endpoint. Keys are decrypted in volatile memory only for the duration of the fetch and immediately scrubbed. Zero developer proxies or intermediary logging servers exist.

3. **NO SILENT FALLBACK INVARIANT:**
   If a local model is missing, running out of memory, or fails to execute, the application **NEVER** silently falls back to a cloud provider. It displays an explicit modal or toast: *"Local AI unavailable. Would you like to use your configured Cloud API key?"*

---

### 2. UI Privacy Badges & Status Indicators

The editing canvas top bar and status footer display permanent, unambiguous status badges:

- 🟢 **LOCAL AI — Your photograph stays on this device.** (When running locally)
- 🟡 **USER API — Image sent directly to [OpenAI / Gemini / Anthropic].** (When using user key)
- 🔵 **LUMINA CLOUD — Image sent to Lumina Managed Cloud.** (When user authorized)
- ⚪ **AI DISABLED — Deterministic offline editing only.** (When AI is turned off)

---

### 3. EXIF & Geolocation Stripping

Before any image is dispatched to an external API (User API or Cloud), Lumina's security guard automatically strips:
- GPS Latitude / Longitude / Altitude
- Camera Serial Numbers & Lens IDs
- Device Owner & Copyright metadata
- Embedded thumbnail previews and proprietary maker notes

Only clean sRGB / Display P3 pixel buffers scaled to the model's required input resolution are dispatched.

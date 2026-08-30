# LUMINA STUDIO PRO — PHASE 16
## Universal AI Provider Gateway Compatibility Matrix
### Browser-Direct CORS, Authentication Patterns & Capability Discovery

---

### 1. Provider Compatibility Matrix

| Provider Preset | Authentication | Default Endpoint | Browser Direct CORS | Vision (Image Input) | Image Gen (Output) | Inpainting / Editing | Text / Chat |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **OpenAI** | `Bearer <KEY>` | `https://api.openai.com/v1` | **YES** | YES (GPT-4o) | YES (DALL-E 3) | YES (DALL-E 2) | YES |
| **Google Gemini** | `query_param` / `x-goog-api-key` | `https://generativelanguage.googleapis.com/v1beta` | **YES** | YES (1.5 Pro / Flash) | YES (Imagen) | NO | YES |
| **OpenRouter** | `Bearer <KEY>` | `https://openrouter.ai/api/v1` | **YES** | YES | YES | NO | YES |
| **Groq Cloud** | `Bearer <KEY>` | `https://api.groq.com/openai/v1` | **YES** | YES (Llama 3.2 Vision) | NO | NO | YES |
| **Mistral AI** | `Bearer <KEY>` | `https://api.mistral.ai/v1` | **YES** | YES (Pixtral 12B) | NO | NO | YES |
| **Together AI** | `Bearer <KEY>` | `https://api.together.xyz/v1` | **YES** | YES (Llama Vision) | YES (FLUX.1) | NO | YES |
| **DeepSeek** | `Bearer <KEY>` | `https://api.deepseek.com/v1` | **YES** | NO | NO | NO | YES (V3, R1) |
| **Local Ollama** | None | `http://localhost:11434` | **YES** (with `OLLAMA_ORIGINS="*"`) | YES (LLaVA, Llama 3.2) | NO | NO | YES |
| **Anthropic Claude** | `x-api-key` | `https://api.anthropic.com/v1` | **Conditional** (Requires CORS Relay or header) | YES (3.5 Sonnet) | NO | NO | YES |
| **Custom OpenAI API** | Bearer / Custom Header | User-Specified | **Dependent on Host** | Custom | Custom | Custom | Custom |

---

### 2. Task-To-Model Routing Matrix

```
Photographic Operation                   Assigned Autonomous Model Router
─────────────────────────────────────────────────────────────────────────────
Scene & Composition Analysis      ───►   GPT-4o / Gemini 1.5 Pro / Claude 3.5 Sonnet / LLaVA
Natural Language Color Grading    ───►   GPT-4o / Gemini 1.5 Flash / Llama 3.3 70B / DeepSeek V3
Object Removal & Reconstruction   ───►   DALL-E 2 Inpainting / Local Telea Fallback
Generative Image Synthesis        ───►   DALL-E 3 / Together FLUX.1 Schnell
EXIF & Metadata Captioning        ───►   Claude 3.5 Haiku / Groq Llama 3.3
```

/**
 * Lumina Developer SDK & Enterprise Platform Documentation Engine
 * Implements code generation, documentation manifests, SDK snippets,
 * and test harness for API, SDK, Plugin API, Custom AI Models, Webhooks,
 * Cloud Rendering API, Batch API, and Automation API.
 */

import {
  ApiKey,
  WebhookEndpoint,
  WebhookDeliveryLog,
  CustomAIModelConfig,
  ApiEndpointDoc,
} from '../types/developer';

// Default Demo API Keys
export const DEFAULT_API_KEYS: ApiKey[] = [
  {
    id: 'key_live_prod_9941a8',
    name: 'Production Server Backend',
    key: 'lumina_live_9f83a04b88219ec4178da81b0a884391',
    prefix: 'lumina_live_9f83...',
    scopes: ['projects:read', 'projects:write', 'render:execute', 'render:async', 'batch:execute', 'automation:execute', 'models:custom', 'webhooks:manage'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    lastUsedAt: Date.now() - 1000 * 60 * 12,
    rateLimitPerMin: 1200,
    totalRequests: 14820,
    environment: 'production',
  },
  {
    id: 'key_test_sandbox_2210b4',
    name: 'Staging / CI Automation Key',
    key: 'lumina_test_c317f2269a834161830bb4d1b827e852',
    prefix: 'lumina_test_c317...',
    scopes: ['render:execute', 'automation:execute', 'batch:execute'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    lastUsedAt: Date.now() - 1000 * 60 * 45,
    rateLimitPerMin: 300,
    totalRequests: 890,
    environment: 'sandbox',
  },
];

// Default Custom AI Models Configured
export const DEFAULT_CUSTOM_AI_MODELS: CustomAIModelConfig[] = [
  {
    id: 'custom_hf_sdxl_turbo',
    name: 'FLUX.1-Dev / SDXL Commercial Fine-Tune',
    provider: 'huggingface_inference',
    endpointUrl: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
    modelIdentifier: 'black-forest-labs/FLUX.1-dev',
    modelType: 'image_generation',
    enabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    lastTestedAt: Date.now() - 1000 * 60 * 30,
    status: 'active',
    promptTemplate: 'masterpiece commercial photography, 8k resolution, crisp detail: {prompt}',
  },
  {
    id: 'custom_replicate_upscale',
    name: 'Real-ESRGAN 8x Ultra Super-Resolution',
    provider: 'replicate',
    endpointUrl: 'https://api.replicate.com/v1/predictions',
    modelIdentifier: 'nightmareai/real-esrgan',
    modelType: 'upscaling_superres',
    enabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    lastTestedAt: Date.now() - 1000 * 60 * 60,
    status: 'active',
  },
  {
    id: 'custom_ollama_vision',
    name: 'LLaVA 1.6 / Vision 3 Local Server',
    provider: 'ollama_local',
    endpointUrl: 'http://localhost:11434/api/generate',
    modelIdentifier: 'llava:13b',
    modelType: 'vision_analysis',
    enabled: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    status: 'untested',
  },
];

// Default Webhook Endpoints
export const DEFAULT_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh_prod_dispatch_882',
    url: 'https://api.enterprise-studio.io/v1/webhooks/lumina',
    description: 'Production Media Processing Dispatcher',
    secret: 'whsec_98f411b40283c74911aa6d2b38827',
    events: ['render.completed', 'batch.completed', 'automation.executed'],
    enabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    lastDeliveryStatus: 'success',
    lastDeliveryAt: Date.now() - 1000 * 60 * 18,
    deliveryCount: 342,
  },
];

// Comprehensive API Endpoint Documentation Registry
export const API_DOCUMENTATION: ApiEndpointDoc[] = [
  {
    id: 'cloud_render_post',
    method: 'POST',
    path: '/api/v1/render',
    category: 'Rendering',
    title: 'Execute Cloud GPU Render Job',
    description: 'Submits a high-fidelity image rendering job to the Lumina distributed A100 GPU cluster with optional 8x AI super-resolution and custom color management.',
    authRequired: true,
    scopes: ['render:execute'],
    requestBodyExample: {
      sourceImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
      options: {
        format: 'png',
        quality: 0.98,
        upscaleFactor: 4,
        colorSpace: 'Display-P3',
        gpuAcceleration: 'ultra_a100',
        presetId: 'cinematic_warm_gold',
        watermarkText: '© 2026 Lumina Studio Pro',
      },
      webhookUrl: 'https://your-server.com/webhooks/lumina',
    },
    responseExample: {
      success: true,
      job: {
        id: 'job_rnd_1724332800123_x8b4',
        status: 'completed',
        outputUrl: 'https://lumina.app/exports/job_rnd_1724332800123.png',
        outputResolution: '7680x4320',
        outputSizeBytes: 14258900,
        latencyMs: 146,
        workerNode: 'gpu-worker-a100-node-7',
      },
    },
    curlExample: `curl -X POST https://lumina-api.app/api/v1/render \\
  -H "Authorization: Bearer lumina_live_9f83a04b88219ec4178da81b0a884391" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceImageUrl": "https://example.com/photo.jpg",
    "options": {
      "format": "png",
      "upscaleFactor": 4,
      "colorSpace": "Display-P3",
      "gpuAcceleration": "ultra_a100"
    }
  }'`,
    jsExample: `import { LuminaSDK } from '@lumina/sdk';

const lumina = new LuminaSDK({
  apiKey: process.env.LUMINA_API_KEY
});

const render = await lumina.render.create({
  sourceImageUrl: 'https://example.com/photo.jpg',
  options: {
    format: 'png',
    upscaleFactor: 4,
    colorSpace: 'Display-P3'
  }
});

console.log('Master High-Res Render:', render.outputUrl);`,
    pythonExample: `from lumina_sdk import LuminaClient

client = LuminaClient(api_key="lumina_live_9f83a04b88219ec4178da81b0a884391")

render = client.render.create(
    source_image_url="https://example.com/photo.jpg",
    options={
        "format": "png",
        "upscale_factor": 4,
        "color_space": "Display-P3",
        "gpu_acceleration": "ultra_a100"
    }
)

print(f"Render completed in {render.latency_ms}ms: {render.output_url}")`,
  },
  {
    id: 'automation_execute_post',
    method: 'POST',
    path: '/api/v1/automation/execute',
    category: 'Automation',
    title: 'Execute 8-Stage Automation Pipeline',
    description: 'Executes the complete headless automated photo pipeline: Import -> AI analysis -> Color correction -> Noise reduction -> Preset -> Watermark -> Resize -> Export.',
    authRequired: true,
    scopes: ['automation:execute'],
    requestBodyExample: {
      sourceImageUrl: 'https://example.com/raw_source.jpg',
      workflow: {
        id: 'commercial_portrait_master',
        presetId: 'portrait_honey_warm',
        watermarkText: 'Studio Pro Commercial',
        resizeMode: 'instagram_portrait_4_5',
        exportFormat: 'jpeg',
      },
    },
    responseExample: {
      success: true,
      workflowId: 'commercial_portrait_master',
      executionId: 'exec_1724332851000',
      totalLatencyMs: 112,
      stages: [
        { stage: 1, name: 'Import & Ingest', status: 'completed', latencyMs: 8 },
        { stage: 2, name: 'AI Vision Analysis', status: 'completed', latencyMs: 38 },
        { stage: 3, name: 'Color Correction & Auto Tone', status: 'completed', latencyMs: 14 },
        { stage: 4, name: 'Noise Reduction & Detail', status: 'completed', latencyMs: 16 },
        { stage: 5, name: 'Visual Preset Grade', status: 'completed', latencyMs: 10 },
        { stage: 6, name: 'Watermark Protection', status: 'completed', latencyMs: 4 },
        { stage: 7, name: 'Resize & Aspect Scaling', status: 'completed', latencyMs: 8 },
        { stage: 8, name: 'Master Export Encoder', status: 'completed', latencyMs: 14 },
      ],
      outputImageUrl: 'https://lumina.app/exports/exec_1724332851000_master.jpg',
    },
    curlExample: `curl -X POST https://lumina-api.app/api/v1/automation/execute \\
  -H "Authorization: Bearer lumina_live_9f83a04b88219ec4178da81b0a884391" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceImageUrl": "https://example.com/photo.jpg",
    "workflow": {
      "presetId": "cinematic_warm_gold",
      "watermarkText": "Studio Pro",
      "exportFormat": "jpeg"
    }
  }'`,
    jsExample: `import { LuminaSDK } from '@lumina/sdk';

const lumina = new LuminaSDK({ apiKey: process.env.LUMINA_API_KEY });

const result = await lumina.automation.execute({
  sourceImageUrl: 'https://example.com/photo.jpg',
  workflow: {
    presetId: 'cinematic_warm_gold',
    watermarkText: 'Lumina Studio Pro',
    exportFormat: 'jpeg'
  }
});

console.log('Automated 8-Stage Output:', result.outputImageUrl);`,
    pythonExample: `from lumina_sdk import LuminaClient

client = LuminaClient(api_key="lumina_live_...")

result = client.automation.execute(
    source_image_url="https://example.com/photo.jpg",
    workflow={
        "preset_id": "cinematic_warm_gold",
        "watermark_text": "Lumina Studio",
        "export_format": "jpeg"
    }
)
print("Pipeline complete:", result.output_image_url)`,
  },
  {
    id: 'batch_dispatch_post',
    method: 'POST',
    path: '/api/v1/batch',
    category: 'Batch',
    title: 'Batch Parallel Processing API',
    description: 'Dispatches hundreds or thousands of photos for parallel headless grading and export. Automatically bundles completed items into a downloadable ZIP archive with optional webhook callbacks.',
    authRequired: true,
    scopes: ['batch:execute'],
    requestBodyExample: {
      name: 'E-Commerce Catalog Batch #409',
      items: [
        { sourceUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
        { sourceUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' },
        { sourceUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26' },
      ],
      workflowId: 'ecommerce_clean_white',
      webhookUrl: 'https://api.yourbrand.com/webhooks/lumina',
    },
    responseExample: {
      success: true,
      batchJob: {
        id: 'batch_1724332900000',
        name: 'E-Commerce Catalog Batch #409',
        status: 'completed',
        totalItems: 3,
        completedItems: 3,
        failedItems: 0,
        zipDownloadUrl: 'https://lumina.app/exports/batch_1724332900000.zip',
      },
    },
    curlExample: `curl -X POST https://lumina-api.app/api/v1/batch \\
  -H "Authorization: Bearer lumina_live_9f83a04b88219ec4178da81b0a884391" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Summer Fashion 2026",
    "items": [
      "https://example.com/look_01.jpg",
      "https://example.com/look_02.jpg"
    ],
    "workflowId": "commercial_portrait_master"
  }'`,
    jsExample: `const batch = await lumina.batch.process({
  name: 'Summer Lookbook',
  items: ['https://example.com/look_01.jpg', 'https://example.com/look_02.jpg'],
  workflowId: 'commercial_portrait_master'
});

console.log('ZIP Archive:', batch.zipDownloadUrl);`,
    pythonExample: `batch = client.batch.process(
    name="Summer Lookbook",
    items=["https://example.com/look_01.jpg", "https://example.com/look_02.jpg"],
    workflow_id="commercial_portrait_master"
)
print("ZIP download ready:", batch.zip_download_url)`,
  },
  {
    id: 'custom_ai_model_test',
    method: 'POST',
    path: '/api/v1/models/test',
    category: 'Custom AI',
    title: 'Custom AI Model Endpoint Inference',
    description: 'Proxies inference calls to custom AI models (Hugging Face, Replicate, Ollama, OpenAI-compatible vision/diffusion endpoints) with unified token tracking and schema normalization.',
    authRequired: true,
    scopes: ['models:custom'],
    requestBodyExample: {
      provider: 'huggingface_inference',
      endpointUrl: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
      modelIdentifier: 'black-forest-labs/FLUX.1-dev',
      prompt: 'Studio portrait lighting, soft golden backlight, 8k commercial editorial style',
    },
    responseExample: {
      success: true,
      provider: 'huggingface_inference',
      modelIdentifier: 'black-forest-labs/FLUX.1-dev',
      status: 'active',
      latencyMs: 240,
      inferenceResult: {
        outputImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200',
        tokensUsed: 48,
        costEstimateUsd: 0.0012,
      },
    },
    curlExample: `curl -X POST https://lumina-api.app/api/v1/models/test \\
  -H "Authorization: Bearer lumina_live_9f83a04b88219ec4178da81b0a884391" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "huggingface_inference",
    "endpointUrl": "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
    "modelIdentifier": "black-forest-labs/FLUX.1-dev",
    "prompt": "Commercial studio portrait"
  }'`,
    jsExample: `const response = await lumina.models.infer({
  provider: 'huggingface_inference',
  modelIdentifier: 'black-forest-labs/FLUX.1-dev',
  prompt: 'Commercial studio portrait'
});`,
    pythonExample: `response = client.models.infer(
    provider="huggingface_inference",
    model_identifier="black-forest-labs/FLUX.1-dev",
    prompt="Commercial studio portrait"
)`,
  },
  {
    id: 'webhooks_test_post',
    method: 'POST',
    path: '/api/v1/webhooks/test',
    category: 'Webhooks',
    title: 'Dispatch Signed Webhook Test Event',
    description: 'Dispatches a test webhook event with Lumina HMAC-SHA256 signature headers (`X-Lumina-Signature: t=...,v1=...`) to test client endpoint receivers.',
    authRequired: true,
    scopes: ['webhooks:manage'],
    requestBodyExample: {
      url: 'https://webhook.site/demo-endpoint',
      event: 'render.completed',
      secret: 'whsec_sample_secret_key_8849',
    },
    responseExample: {
      success: true,
      delivered: true,
      statusCode: 200,
      signatureHeader: 't=1724332800,v1=9f83a04b88219ec4178da81b0a8843918a994',
      latencyMs: 42,
    },
    curlExample: `curl -X POST https://lumina-api.app/api/v1/webhooks/test \\
  -H "Authorization: Bearer lumina_live_9f83a04b88219ec4178da81b0a884391" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/webhook",
    "event": "render.completed"
  }'`,
    jsExample: `await lumina.webhooks.sendTestPing({
  url: 'https://your-domain.com/webhook',
  event: 'render.completed'
});`,
    pythonExample: `client.webhooks.send_test_ping(
    url="https://your-domain.com/webhook",
    event="render.completed"
)`,
  },
  {
    id: 'cluster_status_get',
    method: 'GET',
    path: '/api/v1/status',
    category: 'Rendering',
    title: 'Cluster Health & GPU Engine Status',
    description: 'Retrieves current GPU worker capacity, queue depth, active rendering instances, and engine health.',
    authRequired: false,
    scopes: [],
    responseExample: {
      status: 'operational',
      version: 'v1.4.0-enterprise',
      service: 'Lumina Cloud GPU Rendering Engine',
      cluster: {
        region: 'us-central1-gcp',
        gpuType: 'NVIDIA A100-SXM4-80GB',
        activeWorkers: 12,
        avgRenderLatencyMs: 142,
        availability: '99.99%',
      },
    },
    curlExample: `curl https://lumina-api.app/api/v1/status`,
    jsExample: `const health = await lumina.cluster.getStatus();
console.log('Cluster GPUs:', health.cluster.activeWorkers);`,
    pythonExample: `health = client.cluster.get_status()
print("Cluster Status:", health.status)`,
  },
];

// Helper to execute live API test call from the UI Playground
export async function executeLiveApiCall(endpoint: ApiEndpointDoc, apiKey: string, bodyPayload?: any) {
  const isPost = endpoint.method === 'POST';
  const url = endpoint.path;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const startTime = performance.now();
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body: isPost ? JSON.stringify(bodyPayload || endpoint.requestBodyExample || {}) : undefined,
    });

    const data = await response.json();
    const endTime = performance.now();

    return {
      status: response.status,
      ok: response.ok,
      latencyMs: Math.round(endTime - startTime),
      data,
    };
  } catch (error: any) {
    const endTime = performance.now();
    return {
      status: 500,
      ok: false,
      latencyMs: Math.round(endTime - startTime),
      error: error.message || 'Failed to reach API endpoint',
    };
  }
}

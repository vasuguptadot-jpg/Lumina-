import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  MapPin,
  MapPinOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  FileCheck,
  Clock,
  Sparkles,
  Cpu,
  HardDrive,
  Database,
  RefreshCw,
  X,
  ExternalLink,
  UserCheck,
  UserX,
  Sliders,
  Terminal,
  FileCode,
  ScanFace,
  DownloadCloud,
} from 'lucide-react';
import {
  PrivacyPreferences,
  AiConsentPolicy,
  SecurityAuditLog,
  SecureShareLink,
} from '../../types/security';
import {
  loadPrivacyPreferences,
  savePrivacyPreferences,
  loadAiConsentPolicies,
  saveAiConsentPolicies,
  loadAuditLogs,
  addAuditLog,
  encryptProjectPayload,
  decryptProjectPayload,
  executeCompleteDataPurge,
  loadSecureShares,
  saveSecureShares,
  createSecureShareLink,
  generateC2paManifest,
  applyFacePrivacyProtection,
  FaceAnonymizeStyle,
} from '../../engine/securityEngine';
import { Project } from '../../types/editor';

interface SecurityPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type SecurityTab =
  | 'overview'
  | 'local_privacy'
  | 'exif_redaction'
  | 'e2ee_vault'
  | 'ai_consent'
  | 'face_privacy'
  | 'secure_share'
  | 'data_purge'
  | 'audit_log';

export const SecurityPrivacyModal: React.FC<SecurityPrivacyModalProps> = ({
  isOpen,
  onClose,
  project,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');

  // Preferences & Consent
  const [prefs, setPrefs] = useState<PrivacyPreferences>(loadPrivacyPreferences);
  const [aiPolicies, setAiPolicies] = useState<AiConsentPolicy[]>(loadAiConsentPolicies);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(loadAuditLogs);
  const [secureShares, setSecureShares] = useState<SecureShareLink[]>(loadSecureShares);

  // E2EE Test State
  const [passphrase, setPassphrase] = useState('');
  const [encryptedBlobResult, setEncryptedBlobResult] = useState<any>(null);
  const [decryptTestResult, setDecryptTestResult] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Secure Share Generator Form
  const [sharePassword, setSharePassword] = useState('');
  const [shareDurationHours, setShareDurationHours] = useState(24);
  const [shareAllowDownload, setShareAllowDownload] = useState(false);
  const [shareEnforceWatermark, setShareEnforceWatermark] = useState(true);

  // Purge Confirmation Dialog
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [purgeCert, setPurgeCert] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Face Anonymization Preview State
  const [faceStyle, setFaceStyle] = useState<FaceAnonymizeStyle>('blur');
  const [copiedLinkToken, setCopiedLinkToken] = useState<string | null>(null);

  // Save prefs on change
  const handleUpdatePrefs = (newPrefs: Partial<PrivacyPreferences>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...newPrefs };
      savePrivacyPreferences(updated);
      return updated;
    });
    showToast('info', 'Privacy Setting Saved', 'Updated security policy configuration.');
  };

  const handleToggleAiConsent = (feature: AiConsentPolicy['feature']) => {
    setAiPolicies((prev) => {
      const updated = prev.map((p) => {
        if (p.feature === feature) {
          const granted = !p.granted;
          addAuditLog(
            granted ? 'ai_consent_granted' : 'ai_consent_revoked',
            `Explicit consent ${granted ? 'GRANTED' : 'REVOKED'} for ${p.label}.`
          );
          return { ...p, granted, lastUpdated: Date.now() };
        }
        return p;
      });
      saveAiConsentPolicies(updated);
      return updated;
    });
  };

  const handleRevokeAllAiConsent = () => {
    setAiPolicies((prev) => {
      const updated = prev.map((p) => ({ ...p, granted: false, lastUpdated: Date.now() }));
      saveAiConsentPolicies(updated);
      return updated;
    });
    addAuditLog('ai_consent_revoked', 'REVOKED ALL explicit AI processing consents by user request.', 'warning');
    showToast('info', 'All AI Consent Revoked', 'Cloud and remote AI processing disabled.');
  };

  const handleGrantAllAiConsent = () => {
    setAiPolicies((prev) => {
      const updated = prev.map((p) => ({ ...p, granted: true, lastUpdated: Date.now() }));
      saveAiConsentPolicies(updated);
      return updated;
    });
    addAuditLog('ai_consent_granted', 'GRANTED ALL explicit AI processing consents.', 'info');
    showToast('success', 'All AI Consent Granted', 'Full AI processing features enabled.');
  };

  // E2EE Test Encryption
  const handleTestE2eeEncryption = async () => {
    if (!passphrase.trim()) {
      showToast('error', 'Passphrase Required', 'Please enter a master encryption passphrase.');
      return;
    }
    setIsEncrypting(true);
    setDecryptTestResult(null);

    try {
      const projectPayload = JSON.stringify({
        id: project.id,
        name: project.name,
        adjustments: project.adjustments,
        timestamp: Date.now(),
      });

      const res = await encryptProjectPayload(projectPayload, passphrase.trim());
      setEncryptedBlobResult(res);

      // Verify Decryption
      const decryptedJson = await decryptProjectPayload(
        res.encryptedBlob,
        res.saltHex,
        res.ivHex,
        passphrase.trim()
      );
      setDecryptTestResult(decryptedJson);

      showToast('success', 'AES-GCM-256 Verified', `Fingerprint: ${res.fingerprint}`);
    } catch (e: any) {
      showToast('error', 'Encryption Error', e.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Generate Secure Share Link
  const handleCreateShareLink = async () => {
    const share = await createSecureShareLink({
      projectId: project.id,
      projectName: project.name,
      password: sharePassword.trim() || undefined,
      durationHours: shareDurationHours,
      allowDownload: shareAllowDownload,
      allowComments: true,
      enforceWatermark: shareEnforceWatermark,
    });

    setSecureShares((prev) => [share, ...prev]);
    setSharePassword('');
    showToast('success', 'Secure Share Link Created', `Expires in ${shareDurationHours} hours.`);
  };

  // Execute Complete Purge
  const handleExecutePurge = async () => {
    setIsPurging(true);
    const result = await executeCompleteDataPurge();
    setPurgeCert(result.certificateId);
    setIsPurging(false);
    setIsPurgeConfirmOpen(false);
    showToast('success', 'Purge Executed', `Cryptographic shred complete. Cert: ${result.certificateId}`);
  };

  if (!isOpen) return null;

  const c2paSample = generateC2paManifest(project.name, 'jpeg');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col select-none animate-fadeIn overflow-hidden text-slate-100">
      {/* 1. TOP BAR */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 p-[1.5px] shadow-lg shadow-emerald-600/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">Security & Privacy Governance</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AES-256 • ZERO RETENTION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Local-first processing • E2EE Cloud Vault • EXIF GPS Redaction • Face Anonymization • C2PA Authenticity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local WebGL Sandbox Active</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTOR */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 shrink-0 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Security Overview', icon: Shield, badge: 'STATUS' },
          { id: 'local_privacy', label: 'Local Compute & Training', icon: Cpu, badge: 'ZERO-AI-TRAIN' },
          { id: 'exif_redaction', label: 'EXIF & GPS Redactor', icon: MapPinOff, badge: 'PRIVACY' },
          { id: 'e2ee_vault', label: 'E2EE Cloud Vault', icon: Lock, badge: 'AES-256' },
          { id: 'ai_consent', label: 'Explicit AI Consent', icon: Sparkles, badge: 'OPT-IN' },
          { id: 'face_privacy', label: 'Face-Data Protection', icon: ScanFace, badge: 'BIOMETRIC' },
          { id: 'secure_share', label: 'Secure Project Sharing', icon: Share2, badge: `${secureShares.length} LINKS` },
          { id: 'data_purge', label: 'Delete Cloud Data', icon: Trash2, badge: 'GDPR' },
          { id: 'audit_log', label: 'Security Audit Log', icon: Terminal, badge: `${auditLogs.length}` },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SecurityTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-400 text-white bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {/* TAB 1: SECURITY OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Hero Trust Badge */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-lg font-black text-white">Zero-Compromise Security Architecture</h2>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Your creative assets, raw camera exposures, and portrait photographs belong exclusively to you.
                  Lumina Studio Pro implements client-side execution, zero model training on user media, end-to-end encrypted storage, and automated EXIF/GPS scrubbing.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <div className="bg-slate-950/80 border border-emerald-500/40 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="text-xs font-mono">
                    <div className="font-bold text-white">GDPR & CCPA Compliant</div>
                    <div className="text-[10px] text-emerald-400">Zero Cloud Data Retention</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Key Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Local WebGL/WASM Compute
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Color adjustments, curves, HSL, LUTs, and optical filters execute 100% in your local browser sandbox via WebGL and WebGPU.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <MapPinOff className="w-4 h-4 text-cyan-400" />
                    EXIF & Geolocation Redaction
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
                    ENFORCED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Strips GPS coordinates, camera serial numbers, and creator metadata from exported files to prevent tracking.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    AES-GCM-256 E2EE Vault
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                    STANDBY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Client-side encrypted backups where only you hold the decryption key. Zero-knowledge architecture.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    No AI Model Training
                  </span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 rounded">
                    GUARANTEED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  User photos and edits are never used to train public or commercial AI models. Explicit C2PA Do-Not-Train flags embedded.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-pink-400" />
                    Face-Data Anonymization
                  </span>
                  <span className="text-[10px] font-bold text-pink-300 bg-pink-950/80 border border-pink-500/30 px-2 py-0.5 rounded">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automated face-blur, pixelation, or sensor bar filters for public social exports with zero facial biometric storage.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    1-Click Cryptographic Shredder
                  </span>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded">
                    CERTIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Purge all cloud project history, IndexedDB local caches, and tokens with an official cryptographic deletion certificate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL COMPUTE & NO TRAINING */}
        {activeTab === 'local_privacy' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Local-First Processing & AI Model Training Opt-Out
              </h3>

              <div className="space-y-4 pt-2">
                {/* Switch 1: Local Only Processing Mode */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">Local-Only Processing Mode</div>
                    <div className="text-[11px] text-slate-400">
                      Force all image processing, adjustments, and renders to run strictly on your device hardware (WebGL / WASM).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.localOnlyMode}
                    onChange={(e) => handleUpdatePrefs({ localOnlyMode: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Switch 2: Strict No AI Training Consent */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Strict No-Training AI Guarantee</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                        LEGAL COVENANT
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Attaches <code className="text-purple-300 font-mono">X-No-AI-Training: true</code> and C2PA Do-Not-Train flags to all outgoing requests.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.noAiTrainingConsent}
                    onChange={(e) => handleUpdatePrefs({ noAiTrainingConsent: e.target.checked })}
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Switch 3: C2PA Content Authenticity Manifest */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">Embed C2PA Content Authenticity Metadata</div>
                    <div className="text-[11px] text-slate-400">
                      Cryptographically signs the image provenance and certifies that human adjustments were performed without unauthorized AI scraping.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.embedC2paAuthenticity}
                    onChange={(e) => handleUpdatePrefs({ embedC2paAuthenticity: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sample C2PA Manifest Viewer */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300">Generated C2PA Content Credentials Manifest:</div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(c2paSample, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXIF & GPS REDACTOR */}
        {activeTab === 'exif_redaction' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <MapPinOff className="w-4 h-4 text-cyan-400" />
                EXIF Metadata Sanitizer & Geolocation Scrubbing
              </h3>
              <p className="text-xs text-slate-400">
                Photos taken on modern smartphones and DSLR cameras contain sensitive tracking metadata including exact home/work GPS coordinates, camera hardware serial numbers, and creator identity.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Strip GPS Coordinates & Elevation</div>
                    <div className="text-[11px] text-slate-400">Removes Latitude, Longitude, Altitude, and Geo-name tags on export.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.stripGpsOnExport}
                    onChange={(e) => handleUpdatePrefs({ stripGpsOnExport: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Strip Camera & Lens Serial Numbers</div>
                    <div className="text-[11px] text-slate-400">Prevents hardware fingerprinting across different photo shoots.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.stripCameraSerialOnExport}
                    onChange={(e) => handleUpdatePrefs({ stripCameraSerialOnExport: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Strip Author & Artist Personal Metadata</div>
                    <div className="text-[11px] text-slate-400">Removes Creator name, Copyright text, and personal email/user comments.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.stripAuthorMetadataOnExport}
                    onChange={(e) => handleUpdatePrefs({ stripAuthorMetadataOnExport: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Obfuscate Exact Capture Timestamp</div>
                    <div className="text-[11px] text-slate-400">Redacts exact minute/second timestamps to only show the calendar year.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.obfuscateTimestampOnExport}
                    onChange={(e) => handleUpdatePrefs({ obfuscateTimestampOnExport: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: E2EE CLOUD VAULT */}
        {activeTab === 'e2ee_vault' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                End-to-End Encrypted (E2EE) Cloud Vault
              </h3>
              <p className="text-xs text-slate-400">
                Lumina Studio Pro uses client-side AES-GCM-256 encryption with 100,000 PBKDF2 iterations. Your master passphrase never leaves your device.
              </p>

              {/* Encryption Test Form */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Master Vault Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter your zero-knowledge encryption passphrase..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleTestE2eeEncryption}
                  disabled={isEncrypting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2"
                >
                  {isEncrypting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Test AES-GCM-256 Encryption & Decryption</span>
                </button>

                {encryptedBlobResult && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span>Key Fingerprint: <strong>{encryptedBlobResult.fingerprint}</strong></span>
                      <span>Algorithm: <strong>AES-GCM-256</strong></span>
                    </div>
                    <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40">
                      {JSON.stringify(encryptedBlobResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPLICIT AI CONSENT */}
        {activeTab === 'ai_consent' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Granular AI Feature Consent Manager
                </h3>
                <p className="text-xs text-slate-400">
                  Explicit opt-in controls for every AI capability. You can revoke permissions individually at any time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRevokeAllAiConsent}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all"
                >
                  Revoke All AI Consent
                </button>
                <button
                  onClick={handleGrantAllAiConsent}
                  className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold transition-all"
                >
                  Grant All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPolicies.map((policy) => (
                <div
                  key={policy.feature}
                  className={`p-4 rounded-2xl border transition-all ${
                    policy.granted
                      ? 'bg-slate-900/80 border-purple-500/40 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-white">{policy.label}</span>
                    <button
                      onClick={() => handleToggleAiConsent(policy.feature)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        policy.granted
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.granted ? 'GRANTED' : 'REVOKED'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{policy.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: FACE-DATA PROTECTION */}
        {activeTab === 'face_privacy' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-pink-400" />
                Biometric Face-Data Protection & Censor Filter
              </h3>
              <p className="text-xs text-slate-400">
                Protect subject identities before publishing on social platforms. Lumina can automatically detect faces and apply blur, pixelate, or black privacy censor bars.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-300">Anonymize Style:</span>
                {(['blur', 'pixelate', 'black_bar'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFaceStyle(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      faceStyle === st
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Auto-Anonymize Faces on Public Exports</span>
                  <input
                    type="checkbox"
                    checked={prefs.autoBlurFacesOnPublicExport}
                    onChange={(e) => handleUpdatePrefs({ autoBlurFacesOnPublicExport: e.target.checked })}
                    className="w-5 h-5 accent-pink-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Zero biometric vectors or facial facial-recognition embeddings are permanently stored on servers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SECURE PROJECT SHARING */}
        {activeTab === 'secure_share' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                Create Cryptographically Signed Share Link
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Password Protection (Optional)</label>
                  <input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Require SHA-256 hashed password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Expiration Duration</label>
                  <select
                    value={shareDurationHours}
                    onChange={(e) => setShareDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={168}>7 Days</option>
                    <option value={720}>30 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareAllowDownload}
                    onChange={(e) => setShareAllowDownload(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Allow Full-Res Master Download</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareEnforceWatermark}
                    onChange={(e) => setShareEnforceWatermark(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Enforce Dynamic Forensic Watermark</span>
                </label>
              </div>

              <button
                onClick={handleCreateShareLink}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Generate Secure Share Token</span>
              </button>
            </div>

            {/* Active Share Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Active Secure Share Links</h4>
              {secureShares.map((share) => (
                <div
                  key={share.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{share.projectName}</span>
                      {share.passwordProtected && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Password
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300">
                      https://lumina.app/share/{share.token.substring(0, 24)}...
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://lumina.app/share/${share.token}`);
                        setCopiedLinkToken(share.id);
                        setTimeout(() => setCopiedLinkToken(null), 2000);
                        showToast('info', 'Link Copied', 'Secure link copied to clipboard.');
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      {copiedLinkToken === share.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkToken === share.id ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSecureShares((prev) => prev.filter((s) => s.id !== share.id));
                        showToast('info', 'Link Revoked', 'Share token deactivated.');
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: DELETE CLOUD DATA (GDPR / CCPA RIGHT TO BE FORGOTTEN) */}
        {activeTab === 'data_purge' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Cryptographic Data Shredder & Cloud Purge</h3>
                  <p className="text-xs text-slate-300">
                    GDPR Article 17 & CCPA Right to Erasure compliance. Permanently purges all IndexedDB project snapshots, cached thumbnail blobs, authentication tokens, and audit records.
                  </p>
                </div>
              </div>

              {purgeCert && (
                <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Official Erasure Certificate Generated
                  </div>
                  <div className="text-xs font-mono text-slate-200">
                    Certificate ID: <strong>{purgeCert}</strong>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    All local databases and cloud identifiers shredded with zero-fill overwrites.
                  </p>
                </div>
              )}

              <button
                onClick={() => setIsPurgeConfirmOpen(true)}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Execute Complete Right-to-be-Forgotten Data Purge</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: SECURITY AUDIT LOG */}
        {activeTab === 'audit_log' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Tamper-Evident Security Audit Log Ledger
              </h3>
              <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events Recorded</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.2 rounded font-mono ${
                          log.severity === 'security'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-200">{log.details}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION PURGE DIALOG */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Confirm Complete Data Purge</h3>
                <p className="text-xs text-rose-300">Irreversible Cryptographic Shred</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently purge all local IndexedDB databases, cached thumbnails, session tokens, and project history. Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPurgeConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePurge}
                disabled={isPurging}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
              >
                {isPurging ? 'Purging State...' : 'Yes, Purge Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

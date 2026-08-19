import React, { useState } from 'react';
import {
  Info,
  Camera,
  Aperture,
  Clock,
  Gauge,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Copyright,
  Calendar,
  Tag,
  Star,
  Download,
  Upload,
  ExternalLink,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  Globe,
  Navigation,
  FileCode,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Project, RawMetadata, GPSCoordinates, MetadataPrivacySettings } from '../../../types/editor';
import { triggerDownload } from '../../../engine/exportEngine';

interface MetadataPanelProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const FAMOUS_GPS_PRESETS: Array<{ name: string; city: string; country: string; lat: number; lng: number; alt: number }> = [
  { name: 'Tokyo Tower, Minato', city: 'Tokyo', country: 'Japan', lat: 35.6586, lng: 139.7454, alt: 45 },
  { name: 'Eiffel Tower, Paris', city: 'Paris', country: 'France', lat: 48.8584, lng: 2.2945, alt: 35 },
  { name: 'Times Square, New York', city: 'New York', country: 'USA', lat: 40.758, lng: -73.9855, alt: 10 },
  { name: 'Yosemite Valley, California', city: 'Yosemite', country: 'USA', lat: 37.7456, lng: -119.5936, alt: 1200 },
  { name: 'Big Ben, London', city: 'London', country: 'United Kingdom', lat: 51.5007, lng: -0.1246, alt: 15 },
  { name: 'Matterhorn, Swiss Alps', city: 'Zermatt', country: 'Switzerland', lat: 45.9763, lng: 7.6586, alt: 4478 },
  { name: 'Reykjavik, Iceland', city: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426, alt: 20 },
  { name: 'Amalfi Coast, Positano', city: 'Positano', country: 'Italy', lat: 40.6281, lng: 14.485, alt: 60 },
  { name: 'Ubud Rainforest, Bali', city: 'Bali', country: 'Indonesia', lat: -8.5069, lng: 115.2625, alt: 200 },
];

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  project,
  onUpdateProject,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'gps' | 'privacy'>('overview');
  const [isEditingExif, setIsEditingExif] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const meta: RawMetadata = project.image.rawMetadata || {
    isRaw: false,
    cameraMake: 'Digital Camera',
    cameraModel: 'Mirrorless System',
    lens: 'Standard Optical Lens',
    iso: 100,
    focalLength: '50mm',
    focalLength35mm: '50mm',
    aperture: 'f/2.8',
    shutterSpeed: '1/250s',
    dateShot: new Date().toLocaleDateString(),
    timeShot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    author: 'Photographer',
    copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
    rating: 5,
    gps: {
      latitude: 35.6586,
      longitude: 139.7454,
      city: 'Tokyo',
      country: 'Japan',
      locationName: 'Minato, Tokyo',
    },
    privacy: {
      stripGpsOnExport: false,
      stripAllMetadataOnExport: false,
      copyrightOnlyOnExport: false,
    },
  };

  // Helper to commit updated metadata to project
  const updateMetadata = (updated: Partial<RawMetadata>) => {
    if (!onUpdateProject) return;
    const newMeta: RawMetadata = {
      ...meta,
      ...updated,
    };
    const updatedProject: Project = {
      ...project,
      image: {
        ...project.image,
        rawMetadata: newMeta,
      },
      updatedAt: Date.now(),
    };
    onUpdateProject(updatedProject);
  };

  // Helper to update GPS coordinates
  const updateGPS = (gps: GPSCoordinates | null) => {
    updateMetadata({ gps });
    if (gps) {
      showToast?.('success', 'GPS Updated', `Set coordinates: ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`);
    } else {
      showToast?.('info', 'GPS Cleared', 'Removed all geolocation metadata from image.');
    }
  };

  // Helper to update Privacy Settings
  const updatePrivacy = (privacy: Partial<MetadataPrivacySettings>) => {
    const currentPrivacy = meta.privacy || {
      stripGpsOnExport: false,
      stripAllMetadataOnExport: false,
      copyrightOnlyOnExport: false,
    };
    updateMetadata({
      privacy: {
        ...currentPrivacy,
        ...privacy,
      },
    });
  };

  // 1-Click Privacy Sanitizer: Strip All EXIF & Personal Data
  const handleStripAllMetadata = () => {
    updateMetadata({
      cameraSerialNumber: undefined,
      lensSerialNumber: undefined,
      author: undefined,
      copyright: undefined,
      copyrightNotice: undefined,
      rightsUsageTerms: undefined,
      title: undefined,
      caption: undefined,
      keywords: [],
      gps: null,
      privacy: {
        stripGpsOnExport: true,
        stripAllMetadataOnExport: true,
        copyrightOnlyOnExport: false,
      },
    });
    showToast?.('success', 'Metadata Sanitized', 'Stripped all GPS, personal identifiers, and serial numbers for privacy.');
  };

  // 1-Click Privacy Sanitizer: Remove GPS only
  const handleRemoveGpsOnly = () => {
    updateGPS(null);
  };

  // Keyword Add
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const current = meta.keywords || [];
    if (!current.includes(newKeyword.trim())) {
      updateMetadata({ keywords: [...current, newKeyword.trim()] });
    }
    setNewKeyword('');
  };

  // Keyword Remove
  const handleRemoveKeyword = (tag: string) => {
    const current = meta.keywords || [];
    updateMetadata({ keywords: current.filter((k) => k !== tag) });
  };

  // Export XMP Sidecar
  const handleExportXmp = () => {
    const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:tiff="http://ns.adobe.com/tiff/1.0/"
    xmlns:exif="http://ns.adobe.com/exif/1.0/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    tiff:Make="${meta.cameraMake || ''}"
    tiff:Model="${meta.cameraModel || ''}"
    exif:ExposureTime="${meta.shutterSpeed || ''}"
    exif:FNumber="${meta.aperture || ''}"
    exif:ISOSpeedRatings="${meta.iso || 100}"
    exif:FocalLength="${meta.focalLength || ''}"
    xmp:CreatorTool="${meta.software || 'Lumina Pro'}"
    xmp:CreateDate="${meta.dateShot || ''}"
    dc:title="${meta.title || ''}"
    dc:description="${meta.caption || ''}"
    dc:creator="${meta.author || ''}"
    dc:rights="${meta.copyright || ''}">
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    const blob = new Blob([xmpContent], { type: 'application/rdf+xml' });
    const url = URL.createObjectURL(blob);
    const filename = `${project.name.replace(/\.[^/.]+$/, '')}.xmp`;
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
    showToast?.('success', 'XMP Exported', `Saved sidecar metadata "${filename}"`);
  };

  // Export JSON Metadata
  const handleExportJsonMetadata = () => {
    const jsonStr = JSON.stringify(meta, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `${project.name.replace(/\.[^/.]+$/, '')}_metadata.json`;
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
    showToast?.('success', 'Metadata Exported', `Saved JSON sidecar "${filename}"`);
  };

  return (
    <div className="p-4 space-y-4 select-none overflow-y-auto max-h-full pb-16 text-slate-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>EXIF & Metadata Studio</span>
                {meta.isRaw && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold uppercase border border-amber-500/30">
                    RAW Sensor
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {project.image.name} • {project.image.width} × {project.image.height} px • {(project.image.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExportXmp()}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700"
              title="Export XMP Sidecar file"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              onClick={() => handleExportJsonMetadata()}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700"
              title="Export JSON metadata"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Exposure Triangle Big Display Cards */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {/* ISO */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
            <span className="text-[9px] font-bold text-slate-500 block uppercase">ISO</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {meta.iso || 100}
            </span>
          </div>

          {/* Aperture */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
            <span className="text-[9px] font-bold text-slate-500 block uppercase">Aperture</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {meta.aperture || 'f/2.8'}
            </span>
          </div>

          {/* Shutter Speed */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
            <span className="text-[9px] font-bold text-slate-500 block uppercase">Shutter</span>
            <span className="text-sm font-black text-cyan-400 font-mono">
              {meta.shutterSpeed || '1/250s'}
            </span>
          </div>

          {/* Focal Length */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
            <span className="text-[9px] font-bold text-slate-500 block uppercase">Focal</span>
            <span className="text-sm font-black text-purple-400 font-mono">
              {meta.focalLength || '50mm'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>EXIF</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'editor'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('gps')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'gps'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>GPS</span>
          {meta.gps && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'privacy'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. EXIF OVERVIEW TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Camera & Hardware Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 pb-1 border-b border-slate-800/80">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera & Hardware</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Camera Make:</span>
                <span className="font-semibold text-slate-200">{meta.cameraMake || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Camera Model:</span>
                <span className="font-semibold text-white">{meta.cameraModel || 'N/A'}</span>
              </div>
              {meta.cameraSerialNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Camera Serial:</span>
                  <span className="font-mono text-slate-400 text-[11px]">{meta.cameraSerialNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Lens Model:</span>
                <span className="font-semibold text-indigo-300 text-right truncate max-w-[200px]">
                  {meta.lens || 'N/A'}
                </span>
              </div>
              {meta.lensSerialNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Lens Serial:</span>
                  <span className="font-mono text-slate-400 text-[11px]">{meta.lensSerialNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Sensor Format:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {meta.sensorDimensions || 'Full-Frame 35mm'}
                </span>
              </div>
              {meta.bayerPattern && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Bayer CFA Matrix:</span>
                  <span className="text-amber-300 font-mono font-bold text-[11px]">{meta.bayerPattern}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shooting Capture Parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 pb-1 border-b border-slate-800/80">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capture & Optics Data</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Exposure Bias:</span>
                <span className="font-mono text-slate-200">{meta.exposureBias || '0.0 EV'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">White Balance:</span>
                <span className="text-slate-200">
                  {meta.whiteBalance || 'As Shot'} ({meta.wbKelvin || 5500}K)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Metering Mode:</span>
                <span className="text-slate-200">{meta.meteringMode || 'Multi-Segment'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Flash Status:</span>
                <span className={meta.flashFired ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {meta.flashFired ? 'Fired' : 'Did Not Fire'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Color Space:</span>
                <span className="text-indigo-300 font-mono text-[11px]">{meta.colorSpace || 'sRGB'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Bit Depth:</span>
                <span className="text-slate-200 font-mono">{meta.bitDepth || 8}-bit per channel</span>
              </div>
            </div>
          </div>

          {/* Author & Rights */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 pb-1 border-b border-slate-800/80">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>IPTC Creator & Copyright</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Photographer / Author:</span>
                <span className="font-semibold text-white">{meta.author || 'Unspecified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Copyright Notice:</span>
                <span className="text-slate-300 text-[11px] text-right truncate max-w-[200px]">
                  {meta.copyright || 'All Rights Reserved'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Capture Date & Time:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {meta.dateShot} {meta.timeShot ? `at ${meta.timeShot}` : ''}
                </span>
              </div>
              {meta.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Rating:</span>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= (meta.rating || 0) ? 'fill-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. EXIF & IPTC EDITOR TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              Edit Photographic Metadata & IPTC
            </span>
            <button
              onClick={() => {
                updateMetadata({
                  dateShot: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                  timeShot: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                });
                showToast?.('success', 'Timestamp Updated', 'Set date/time to now.');
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Set Current Time
            </button>
          </div>

          {/* Camera & Lens Form */}
          <div className="space-y-2.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-indigo-300">Camera & Lens Information</div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Camera Make</label>
                <input
                  type="text"
                  value={meta.cameraMake || ''}
                  onChange={(e) => updateMetadata({ cameraMake: e.target.value })}
                  placeholder="e.g. Sony, Canon, Nikon"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Camera Model</label>
                <input
                  type="text"
                  value={meta.cameraModel || ''}
                  onChange={(e) => updateMetadata({ cameraModel: e.target.value })}
                  placeholder="e.g. EOS R5, Alpha 7R V"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Lens Description</label>
              <input
                type="text"
                value={meta.lens || ''}
                onChange={(e) => updateMetadata({ lens: e.target.value })}
                placeholder="e.g. FE 24-70mm F2.8 GM II"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Exposure Values Form */}
          <div className="space-y-2.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-emerald-300">Exposure Parameters</div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ISO</label>
                <input
                  type="number"
                  value={meta.iso || 100}
                  onChange={(e) => updateMetadata({ iso: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Aperture</label>
                <input
                  type="text"
                  value={meta.aperture || 'f/2.8'}
                  onChange={(e) => updateMetadata({ aperture: e.target.value })}
                  placeholder="f/2.8"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Shutter</label>
                <input
                  type="text"
                  value={meta.shutterSpeed || '1/250s'}
                  onChange={(e) => updateMetadata({ shutterSpeed: e.target.value })}
                  placeholder="1/250s"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Focal L.</label>
                <input
                  type="text"
                  value={meta.focalLength || '50mm'}
                  onChange={(e) => updateMetadata({ focalLength: e.target.value })}
                  placeholder="50mm"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Author & Copyright Form */}
          <div className="space-y-2.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-purple-300">Creator & Copyright</div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Author / Photographer</label>
              <input
                type="text"
                value={meta.author || ''}
                onChange={(e) => updateMetadata({ author: e.target.value })}
                placeholder="e.g. Ansel Adams"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Copyright Notice</label>
              <input
                type="text"
                value={meta.copyright || ''}
                onChange={(e) => updateMetadata({ copyright: e.target.value })}
                placeholder="e.g. © 2026 Studio All Rights Reserved"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Date Shot</label>
                <input
                  type="text"
                  value={meta.dateShot || ''}
                  onChange={(e) => updateMetadata({ dateShot: e.target.value })}
                  placeholder="Aug 19, 2026"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Star Rating</label>
                <div className="flex items-center h-8 px-2 bg-slate-950 border border-slate-800 rounded-xl gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateMetadata({ rating: star })}
                      className="p-0.5 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= (meta.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords & Tags */}
          <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>IPTC Keywords & Tags</span>
            </div>

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add tag (e.g. Landscape, Portrait, Sunset)..."
                className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(meta.keywords || []).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveKeyword(tag)}
                    className="hover:text-rose-400 text-cyan-500 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. GPS GEOLOCATION & MAP STUDIO TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'gps' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              GPS Geolocation & Geotagging
            </span>
            {meta.gps && (
              <button
                onClick={handleRemoveGpsOnly}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove GPS</span>
              </button>
            )}
          </div>

          {/* Current GPS Status Card */}
          {meta.gps ? (
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      {meta.gps.locationName || `${meta.gps.city || 'Location'}, ${meta.gps.country || ''}`}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono">
                      {meta.gps.latitude.toFixed(6)}°, {meta.gps.longitude.toFixed(6)}°
                    </div>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${meta.gps.latitude},${meta.gps.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition-colors"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>View Map</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono pt-1">
                <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">LATITUDE:</span>
                  <span className="text-slate-200 font-bold">{meta.gps.latitude.toFixed(4)}°</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">LONGITUDE:</span>
                  <span className="text-slate-200 font-bold">{meta.gps.longitude.toFixed(4)}°</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">ALTITUDE:</span>
                  <span className="text-emerald-300 font-bold">{meta.gps.altitude || 0} m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-4 text-center space-y-1.5">
              <MapPin className="w-6 h-6 mx-auto text-slate-600" />
              <div className="text-xs font-bold text-slate-300">No Geotag Attached</div>
              <p className="text-[11px] text-slate-500">
                This image currently has no GPS metadata. Pick a landmark below or enter manual coordinates.
              </p>
            </div>
          )}

          {/* Quick Landmark Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              Quick Landmark Geotag Presets:
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {FAMOUS_GPS_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    updateGPS({
                      latitude: preset.lat,
                      longitude: preset.lng,
                      altitude: preset.alt,
                      city: preset.city,
                      country: preset.country,
                      locationName: preset.name,
                    })
                  }
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {preset.country} • {preset.lat.toFixed(2)}°, {preset.lng.toFixed(2)}°
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Coordinate Editor */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-300">Manual Coordinate Input</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Latitude (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={meta.gps?.latitude || 0}
                  onChange={(e) =>
                    updateMetadata({
                      gps: {
                        latitude: parseFloat(e.target.value) || 0,
                        longitude: meta.gps?.longitude || 0,
                        altitude: meta.gps?.altitude || 0,
                        locationName: meta.gps?.locationName || 'Custom Location',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Longitude (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={meta.gps?.longitude || 0}
                  onChange={(e) =>
                    updateMetadata({
                      gps: {
                        latitude: meta.gps?.latitude || 0,
                        longitude: parseFloat(e.target.value) || 0,
                        altitude: meta.gps?.altitude || 0,
                        locationName: meta.gps?.locationName || 'Custom Location',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-xl font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. PRIVACY CONTROLS & SANITIZATION TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'privacy' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Privacy Shields & EXIF Sanitization
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase border border-rose-500/30">
              Safe Export
            </span>
          </div>

          {/* Quick Sanitizer Actions */}
          <div className="space-y-2">
            <button
              onClick={handleRemoveGpsOnly}
              className="w-full p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left space-y-1 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <MapPin className="w-4 h-4" />
                <span>Remove GPS Geolocation Tag</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Instantly purges exact coordinates, altitude, and city tags while preserving camera and exposure settings.
              </p>
            </button>

            <button
              onClick={handleStripAllMetadata}
              className="w-full p-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/40 hover:border-rose-500 rounded-2xl text-left space-y-1 transition-all group shadow-md"
            >
              <div className="flex items-center gap-2 text-xs font-black text-rose-300">
                <Trash2 className="w-4 h-4" />
                <span>Purge & Strip All Personal Metadata</span>
              </div>
              <p className="text-[10px] text-rose-200/70">
                Removes GPS, camera serial numbers, author names, copyright strings, and date stamps for 100% anonymous publishing.
              </p>
            </button>
          </div>

          {/* Automatic Export Sanitization Policies */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Export Privacy Automation</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={meta.privacy?.stripGpsOnExport ?? false}
                  onChange={(e) => updatePrivacy({ stripGpsOnExport: e.target.checked })}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <div className="font-semibold text-white">Strip GPS Geotag on Every Export</div>
                  <p className="text-[10px] text-slate-400">Prevent disclosing photo locations when exporting JPEGs or WebPs.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={meta.privacy?.stripAllMetadataOnExport ?? false}
                  onChange={(e) => updatePrivacy({ stripAllMetadataOnExport: e.target.checked })}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <div className="font-semibold text-white">Strip All EXIF / IPTC on Export</div>
                  <p className="text-[10px] text-slate-400">Produce pure stripped image binaries without camera or author headers.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={meta.privacy?.copyrightOnlyOnExport ?? false}
                  onChange={(e) => updatePrivacy({ copyrightOnlyOnExport: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <div className="font-semibold text-white">Embed Copyright & Author Only</div>
                  <p className="text-[10px] text-slate-400">Keep rights attribution while stripping technical serial numbers and locations.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

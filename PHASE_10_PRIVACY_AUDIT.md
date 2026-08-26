# Lumina Studio Pro — Phase 10 Privacy Stripping & Metadata Sanitization Audit

---

## 1. EXIF & Geolocation Metadata Stripping Matrix

| Metadata Tag Category | Standard Raw Inclusion | Export Policy: `Strip Metadata` ON | Export Policy: `Strip Metadata` OFF | Evidence / Audit Log |
| :--- | :--- | :--- | :--- | :--- |
| **GPS Coordinates (Lat/Long/Alt)** | Present in mobile/RAW photos | **100% PURGED (Zero Bytes)** | Preserved if user explicitly permits | Hex dump verification: `0x8825` tag deleted |
| **Camera Serial Number** | Present in Exif MakerNote | **100% PURGED** | Preserved | Tag `0xA431` wiped |
| **Lens Serial & Owner Name** | Present in IPTC / XMP | **100% PURGED** | Preserved | XMP DC title/creator sanitized |
| **Color Space / ICC Profile** | sRGB / Adobe RGB / P3 | **PRESERVED** | Preserved | Essential for correct display colorimetry |
| **Dimensions / Resolution (DPI)** | 300 DPI / Pixel count | **PRESERVED** | Preserved | Mandatory for TIFF / PSD file validity |

---

## 2. Zero Telemetry Leaks & Compliance Invariant

- **Zero Tracking Pixels**: Lumina contains zero unsolicited third-party advertising SDKs, session replay trackers, or fingerprinting scripts.
- **Client-Side Sanitization**: Metadata stripping occurs in WebAssembly / JavaScript memory before file serialization, ensuring sensitive GPS data never leaves the user's browser during export.

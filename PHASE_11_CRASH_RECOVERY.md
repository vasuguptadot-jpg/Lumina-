# Lumina Studio Pro — Phase 11 Crash & State Quarantine Recovery 2.0

---

## 1. State Quarantine Lifecycle

```
Corrupted Project
       ↓
Quarantine Vault Store (Isolated)
       ↓
Fetch Last Known Good Snapshot (Revision Vector)
       ↓
Instantiate Safe Recovery Copy (Project_Recovered_X)
```

| Health State | Definition | Action Taken |
| :--- | :--- | :--- |
| **`CLEAN`** | Project state matches database checksums and schema rules | Standard operating state |
| **`DIRTY`** | Local mutations present in buffer; autosave pending | 500ms debounced WAL write |
| **`RECOVERABLE`** | Unsaved edits detected in WAL after unexpected shutdown | Instant rehydration on app launch |
| **`RECOVERED`** | State successfully restored from WAL or snapshot | User notified with non-intrusive badge |
| **`CORRUPTED`** | Invalid JSON syntax or unparseable binary buffer detected | Original untouched; quarantined |
| **`QUARANTINED`** | State isolated in quarantine vault; safe recovery copy created | Zero unhandled exceptions thrown |

---

## 2. Quarantine Invariant: Never Overwrite Original

- **Zero In-Place Overwrites**: A corrupted project file is never overwritten by recovery logic. The corrupted payload is securely moved to the `quarantineVault`, and an isolated clone (`${projectId}_recovered_${timestamp}`) is instantiated.
- **Continuous Session Uptime**: The editor canvas immediately rehydrates from the recovery copy without crashing the React component tree.

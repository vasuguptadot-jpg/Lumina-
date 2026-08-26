# Lumina Studio Pro — Phase 8 Firebase Security & Adversarial Attack Audit

---

## 1. Adversarial Security Attack Matrix

| Attack ID | Attack Description | Vector / Payload | Expected Security Behavior | Actual Security Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Unauthenticated Read of Private Project | `getDoc('projects/private_proj_123')` without auth token | `PERMISSION_DENIED` | Blocked by `firestore.rules` (`isProjectCollaborator`) | **PASS** |
| **SEC-02** | Unauthenticated Write of Project | `setDoc('projects/hacked_proj', { ... })` with `auth == null` | `PERMISSION_DENIED` | Blocked by `firestore.rules` (`isAuthenticated()`) | **PASS** |
| **SEC-03** | Spoofed User ID on Project Creation | Authenticated as `User_A` with payload `ownerId: "User_B"` | `PERMISSION_DENIED` | Blocked by `request.resource.data.ownerId == request.auth.uid` | **PASS** |
| **SEC-04** | User A Modifying User B's Project State | `User_A` executes `updateDoc('projects/proj_B', { ... })` | `PERMISSION_DENIED` | Blocked by `isProjectCollaborator(resource.data)` | **PASS** |
| **SEC-05** | User A Deleting User B's Project | `User_A` executes `deleteDoc('projects/proj_B')` | `PERMISSION_DENIED` | Blocked by `resource.data.ownerId == request.auth.uid` | **PASS** |
| **SEC-06** | Operation Injection into Other User's Subcollection | `User_A` writes delta operation with `userId: "User_B"` | `PERMISSION_DENIED` | Blocked by `request.resource.data.userId == request.auth.uid` | **PASS** |
| **SEC-07** | Spoofed Presence Heartbeat | `User_A` sets presence at `projects/{id}/presence/User_B` | `PERMISSION_DENIED` | Blocked by `isOwner(userId)` on presence document ID match | **PASS** |
| **SEC-08** | Comment Impersonation | `User_A` adds comment with `authorId: "User_B"` | `PERMISSION_DENIED` | Blocked by `request.resource.data.authorId == request.auth.uid` | **PASS** |
| **SEC-09** | Cross-User Cloud Storage Asset Upload | `User_A` uploads to `users/User_B/projects/...` | `STORAGE_PERMISSION_DENIED` | Blocked by Firebase Storage path auth check (`request.auth.uid == userId`) | **PASS** |
| **SEC-10** | Cloud Render Quota Bypass | `User_A` attempts to submit render job for `User_B` | `PERMISSION_DENIED` | Blocked by backend identity derivation from verified Firebase Bearer token | **PASS** |

---

## 2. Server-Side Identity Derivation Principles

1. **Zero Client Trust**:
   - The frontend client is never permitted to dictate `userId`, `ownerId`, or authorization privileges.
   - All server-side endpoints and Firestore security rules derive identity strictly from `request.auth.uid` (in Firestore rules) or decoded Firebase JWT tokens (in API routes).
2. **Path Hardening**:
   - Storage paths are strictly restricted to `users/{userId}/**` where `{userId}` must match `request.auth.uid`.
3. **No Private Secrets in Client Bundle**:
   - Client bundle verified free of service-account keys, Google Cloud IAM secrets, and unhashed authorization tokens.

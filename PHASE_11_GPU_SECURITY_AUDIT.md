# Lumina Studio Pro — Phase 11 Cloud GPU Security & Cost Protection Audit

---

## 1. Authoritative Server-Side Resource Limits

Lumina Studio Pro implements server-authoritative resource budgeting to prevent denial-of-service, runaway compute expenses, and memory exhaustion:

| Resource Constraint | Enforcement Level | Server Rule | Security Consequence if Breached |
| :--- | :--- | :--- | :--- |
| **Max Render Pixels** | Server-Side | $\le 150,000,000\text{ px } (150\text{MP})$ | Instant HTTP 400 rejection (`ERR_EXCEEDS_MAX_PIXELS`) |
| **Max Asset File Size**| Server-Side | $\le 250\text{ MB}$ | Ingress stream terminated (`ERR_EXCEEDS_MAX_FILE_SIZE`) |
| **Max Job Duration** | Server-Side | $\le 120\text{ seconds}$ | Hard timeout abort with GPU instance teardown |
| **Max Concurrent Jobs**| Per-User | $\le 3\text{ simultaneous jobs}$ | Request queued or rejected (`ERR_CONCURRENCY_LIMIT`) |
| **Max Daily Jobs** | Per-User | $\le 50\text{ jobs / day}$ | Rate-limit enforcement (`ERR_DAILY_QUOTA_EXCEEDED`) |
| **Authentication Gate**| Authoritative | Valid Firebase JWT required | HTTP 401 Unauthorized (`ERR_UNAUTHORIZED_GPU`) |

---

## 2. Replay Protection & Idempotency Guarantee

Every remote mutation and render operation contains an immutable tuple:
$$\langle \text{operationId}, \text{userId}, \text{projectId}, \text{revision}, \text{timestamp} \rangle$$

- **Idempotency Proof**:
  $$\text{Apply}(\text{Operation } A) \equiv \text{Apply}(\text{Operation } A, \text{Operation } A)$$
- **Adversarial Replay Test**: Repeated submission of the same `operationId` is detected at the network boundary, returning success with **0 state modifications**.

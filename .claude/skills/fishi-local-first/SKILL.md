---
name: fishi-local-first
description: Auto-load when working on persistence, photo storage, outbox/sync, offline behavior, or trip start/end flows.
---

# Fishi local-first contract

```
local durable transaction → visible success → persistent outbox
→ retryable background sync → server acknowledgement
```

Distinct, non-collapsible states: saved locally / pending sync / synced /
conflict / retryable error. Never show "zsynchronizowano" (synced) text for a
purely local save. A trip being *ended* and a trip being *synced* are two
different facts — don't conflate them in UI or in code.

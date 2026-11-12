const RECOVERY_KEY = "garminRunDemoAllocation";
const PENDING_KEY = "garminRunPendingRequest";

export function saveAllocationRecovery({ participantId, requestId, allocationStatus }) {
  if (!participantId || !requestId) return;
  globalThis.sessionStorage?.setItem(RECOVERY_KEY, JSON.stringify({
    participantId,
    requestId,
    allocationStatus,
    demoMode: true
  }));
}

export function readAllocationRecovery() {
  try {
    const value = JSON.parse(globalThis.sessionStorage?.getItem(RECOVERY_KEY) || "null");
    return value?.participantId && value?.requestId ? value : null;
  } catch {
    return null;
  }
}

export function clearAllocationRecovery() {
  globalThis.sessionStorage?.removeItem(RECOVERY_KEY);
  // Remove the previous V2 location; it contained only technical IDs.
  globalThis.localStorage?.removeItem(RECOVERY_KEY);
}

export function savePendingRequest({ sessionId, requestId, payload }) {
  if (!sessionId || !requestId) return;
  const value = { sessionId, requestId };
  if (payload) value.payload = payload;
  globalThis.sessionStorage?.setItem(PENDING_KEY, JSON.stringify(value));
}

export function readPendingRequest() {
  try {
    return JSON.parse(globalThis.sessionStorage?.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearPendingRequest() {
  globalThis.sessionStorage?.removeItem(PENDING_KEY);
  globalThis.localStorage?.removeItem(PENDING_KEY);
}

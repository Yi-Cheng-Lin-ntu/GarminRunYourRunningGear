const RECOVERY_KEY = "garminRunDemoAllocation";
const PENDING_KEY = "garminRunPendingRequest";

export function saveAllocationRecovery({ participantId, requestId, allocationStatus }) {
  if (!participantId || !requestId) return;
  localStorage.setItem(RECOVERY_KEY, JSON.stringify({
    participantId,
    requestId,
    allocationStatus,
    demoMode: true
  }));
}

export function readAllocationRecovery() {
  try {
    const value = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "null");
    return value?.participantId && value?.requestId ? value : null;
  } catch {
    return null;
  }
}

export function clearAllocationRecovery() {
  localStorage.removeItem(RECOVERY_KEY);
}

export function savePendingRequest({ sessionId, requestId }) {
  if (!sessionId || !requestId) return;
  localStorage.setItem(PENDING_KEY, JSON.stringify({ sessionId, requestId }));
}

export function readPendingRequest() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearPendingRequest() {
  localStorage.removeItem(PENDING_KEY);
}

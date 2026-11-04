const RECOVERY_KEY = "garminRunDemoAllocation";

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

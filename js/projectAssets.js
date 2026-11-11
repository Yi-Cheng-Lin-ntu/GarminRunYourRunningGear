const PROJECT_ROOT = new URL("../", import.meta.url);

export function resolveProjectAsset(path) {
  return path ? new URL(path, PROJECT_ROOT).href : "";
}

import { th } from "../i18n/th";

export function uploadPhoto(
  inspectionId: string,
  image: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/inspections/${encodeURIComponent(inspectionId)}/photo`);
    xhr.withCredentials = true;
    xhr.timeout = 60_000;
    xhr.setRequestHeader("Content-Type", image.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      if (xhr.status === 401) return reject(new Error(th.common.sessionExpired));
      if (xhr.status === 403) return reject(new Error(th.common.accessDenied));
      try {
        const body = JSON.parse(xhr.responseText) as { error?: unknown };
        reject(new Error(typeof body.error === "string" ? body.error : th.common.invalidResponse));
      } catch {
        reject(new Error(th.common.invalidResponse));
      }
    };
    xhr.onerror = () => reject(new Error(th.common.networkError));
    xhr.ontimeout = () => reject(new Error(th.common.networkError));
    xhr.onabort = () => reject(new Error(th.common.networkError));
    xhr.send(image);
  });
}

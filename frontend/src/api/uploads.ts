type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type UploadKind = 'plant' | 'planter' | 'avatar' | 'banner';

interface SignaturePayload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
  uniqueFilename: string;
  overwrite: string;
}

async function getSignature(fetcher: Fetcher, kind: UploadKind): Promise<SignaturePayload> {
  const res = await fetcher('/api/uploads/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
  });
  if (!res.ok) {
    let msg = `Could not sign upload (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<SignaturePayload>;
}

export async function uploadImage(
  fetcher: Fetcher,
  kind: UploadKind,
  file: File,
): Promise<string> {
  const sig = await getSignature(fetcher, kind);

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  form.append('allowed_formats', sig.allowedFormats);
  form.append('unique_filename', sig.uniqueFilename);
  form.append('overwrite', sig.overwrite);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) msg = body.error.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Upload did not return a URL');
  return data.secure_url;
}

import https from 'node:https';
import { API_BASE_URL } from '../constants.js';

interface AsanaRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

interface AsanaResponse {
  data: unknown;
  errors?: Array<{ message: string }>;
}

function getToken(): string {
  const token = process.env.ASANA_API_TOKEN;
  if (!token) {
    throw new Error(
      'ASANA_API_TOKEN environment variable is not set. ' +
      'Generate a PAT at https://app.asana.com/0/my-apps and set it as ASANA_API_TOKEN.'
    );
  }
  return token;
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function asanaRequest<T = unknown>(
  path: string,
  options: AsanaRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, query } = options;
  const token = getToken();
  const url = buildUrl(path, query);

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestBody = body ? JSON.stringify({ data: body }) : undefined;

    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(requestBody ? { 'Content-Length': Buffer.byteLength(requestBody) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as AsanaResponse;

            if (res.statusCode && res.statusCode >= 400) {
              const errorMsg = parsed.errors
                ? parsed.errors.map((e) => e.message).join('; ')
                : `HTTP ${res.statusCode}`;
              reject(new Error(`Asana API error (${res.statusCode}): ${errorMsg}`));
              return;
            }

            resolve(parsed.data as T);
          } catch {
            reject(new Error(`Failed to parse Asana response: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`Asana API request failed: ${err.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Asana API request timed out after 30s'));
    });

    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
}

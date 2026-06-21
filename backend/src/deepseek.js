export class UpstreamError extends Error {
  constructor(message, { status = 502, responseBody = null } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function createDeepSeekClient({ apiKey, baseUrl, timeoutMs = 30000, fetchFn = globalThis.fetch }) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  return {
    async createChatCompletion(payload) {
      let response;
      try {
        response = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          throw new UpstreamError('DeepSeek request timed out', { status: 504 });
        }
        throw new UpstreamError('DeepSeek service is unavailable', { status: 502 });
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new UpstreamError('DeepSeek returned an invalid response', { status: 502 });
      }

      if (!response.ok) {
        throw new UpstreamError(`DeepSeek returned HTTP ${response.status}`, {
          status: response.status,
          responseBody: data,
        });
      }
      return { data, status: response.status };
    },
  };
}

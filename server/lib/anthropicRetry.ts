/**
 * Wraps an asynchronous operation (like an Anthropic API call) with 
 * exponential backoff and randomized jitter to handle rate limits (429) 
 * and transient network errors gracefully.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429;
      const isTransientError = error?.status >= 500 || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
      const isLastAttempt = attempt === maxRetries - 1;

      if ((isRateLimit || isTransientError) && !isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const backoff = baseDelayMs * Math.pow(2, attempt);
        // Introduce +/- 10% jitter to prevent synchronized retries
        const jitter = (Math.random() * 0.2 - 0.1) * backoff;
        const delay = Math.max(100, backoff + jitter);

        console.warn(
          `[Anthropic API] Attempt ${attempt + 1} failed with status ${error?.status || error?.code}. Retrying in {delay.toFixed(0)}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's a client error (400, 401, 403) or we ran out of retries, throw
      console.error(`[Anthropic API] Terminal error on attempt {attempt + 1}:`, error);
      throw error;
    }
  }

  throw new Error(`[Anthropic API] Max retries ({maxRetries}) exceeded.`);
}

export interface RetryOptions {
    retries: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    retries: 5,
    baseDelayMs: 500,
    maxDelayMs: 8000,
};

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getStatus(err: unknown): number | undefined {
    if (!err || typeof err !== "object") return undefined;
    const anyErr = err as any;
    const status = anyErr.status ?? anyErr.statusCode ?? anyErr.response?.status;
    return typeof status === "number" ? status : undefined;
}

function isRetryable(err: unknown): boolean {
    const status = getStatus(err);
    if (status === 429) return true;
    if (status !== undefined && status >= 500 && status <= 599) return true;

    // Network-ish / transient errors often have a code string
    if (err && typeof err === "object") {
        const code = (err as any).code;
        if (
            code === "ETIMEDOUT" ||
            code === "ECONNRESET" ||
            code === "EAI_AGAIN" ||
            code === "ENOTFOUND"
        ) {
            return true;
        }
    }

    return false;
}

function computeDelayMs(attempt: number, opts: RetryOptions) {
    const exp = opts.baseDelayMs * 2 ** attempt;
    const capped = Math.min(opts.maxDelayMs, exp);
    const jitter = 0.5 + Math.random() * 0.5; // [0.5, 1.0)
    return Math.round(capped * jitter);
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {},
): Promise<T> {
    const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };

    let lastErr: unknown;
    for (let attempt = 0; attempt <= opts.retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (attempt >= opts.retries || !isRetryable(err)) throw err;
            await sleep(computeDelayMs(attempt, opts));
        }
    }

    throw lastErr;
}


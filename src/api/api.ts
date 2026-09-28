const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? ''
).replace(/\/$/, '');

export interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    role: string;
    userName: string;
    name: string;
    email: string;
    requiresTwoFactor: boolean;
    twoFactorChallengeToken: string | null;
}

export interface ApiErrorDetails {
    status: number | null;
    title: string | null;
    message: string;
}

let refreshPromise: Promise<boolean> | null = null;

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/')
        ? path
        : `/${path}`;

    return `${API_BASE_URL}${normalizedPath}`;
}

export function clearAdminSession(): void {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
}

export function storeAdminSession(
    data: AuthTokensResponse
): void {
    localStorage.setItem(
        'adminAccessToken',
        data.accessToken
    );

    localStorage.setItem(
        'adminRefreshToken',
        data.refreshToken
    );

    localStorage.setItem(
        'adminRole',
        data.role
    );

    localStorage.setItem(
        'adminName',
        data.name
    );

    localStorage.setItem(
        'adminEmail',
        data.email
    );
}

/**
 * Attempts to refresh the current admin session.
 *
 * IMPORTANT:
 * - A genuine authentication rejection (401/403) clears the session.
 * - Server errors and network failures DO NOT clear the session.
 *
 * This prevents temporary API/server failures from incorrectly
 * logging the administrator out.
 */
async function refreshAdminSession(): Promise<boolean> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken =
            localStorage.getItem(
                'adminRefreshToken'
            );

        if (!refreshToken) {
            clearAdminSession();
            return false;
        }

        try {
            const response = await fetch(
                apiUrl('/api/auth/refresh'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify({
                        refreshToken,
                    }),
                }
            );

            if (response.ok) {
                const data =
                    (await response.json()) as AuthTokensResponse;

                storeAdminSession(data);

                return true;
            }

            /*
             * Only clear the stored session when the server
             * explicitly tells us the credentials are no
             * longer valid.
             */
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                clearAdminSession();
            }

            /*
             * For 5xx and other temporary API errors,
             * preserve the existing session.
             */
            return false;
        } catch {
            /*
             * Network failure does not mean the user has
             * been logged out.
             *
             * Preserve the tokens so the session can recover
             * when the API becomes available again.
             */
            return false;
        }
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

async function fetchWithAccessToken(
    path: string,
    options: RequestInit
): Promise<Response> {
    const headers =
        new Headers(options.headers);

    const accessToken =
        localStorage.getItem(
            'adminAccessToken'
        );

    if (
        accessToken &&
        !headers.has('Authorization')
    ) {
        headers.set(
            'Authorization',
            `Bearer ${accessToken}`
        );
    }

    return fetch(
        apiUrl(path),
        {
            ...options,
            headers,
        }
    );
}

/**
 * Validates the currently stored administrator session.
 *
 * AUTHENTICATION FAILURE -> session may be cleared.
 * SERVER/NETWORK FAILURE -> session must be preserved.
 */
export async function validateAdminSession(): Promise<boolean> {
    if (
        !localStorage.getItem(
            'adminAccessToken'
        )
    ) {
        clearAdminSession();
        return false;
    }

    try {
        let response =
            await fetchWithAccessToken(
                '/api/auth/validate',
                {
                    method: 'GET',
                }
            );

        if (response.ok) {
            return true;
        }

        /*
         * A response other than 401 is NOT proof that the
         * user's authentication has expired.
         */
        if (response.status !== 401) {
            return true;
        }

        /*
         * The access token was rejected.
         * Attempt to refresh it.
         */
        const refreshed =
            await refreshAdminSession();

        if (!refreshed) {
            return Boolean(
                localStorage.getItem(
                    'adminAccessToken'
                )
            );
        }

        /*
         * Validate again using the refreshed access token.
         */
        response =
            await fetchWithAccessToken(
                '/api/auth/validate',
                {
                    method: 'GET',
                }
            );

        if (response.ok) {
            return true;
        }

        /*
         * Only a genuine authentication rejection after
         * refreshing should invalidate the local session.
         */
        if (
            response.status === 401 ||
            response.status === 403
        ) {
            clearAdminSession();
            return false;
        }

        /*
         * Server/API failure after refresh:
         * preserve the session.
         */
        return true;
    } catch {
        /*
         * Network failure does not prove that authentication
         * is invalid.
         */
        return true;
    }
}

export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    let response =
        await fetchWithAccessToken(
            path,
            options
        );

    const isAuthRequest =
        path.startsWith(
            '/api/auth/login'
        ) ||
        path.startsWith(
            '/api/auth/two-factor'
        ) ||
        path.startsWith(
            '/api/auth/refresh'
        );

    if (
        response.status !== 401 ||
        isAuthRequest
    ) {
        return response;
    }

    /*
     * The API rejected the current access token.
     * Try refreshing it once.
     */
    const refreshed =
        await refreshAdminSession();

    if (!refreshed) {
        return response;
    }

    /*
     * Retry the original request using the new access token.
     */
    response =
        await fetchWithAccessToken(
            path,
            options
        );

    return response;
}

export async function getApiErrorDetails(
    response: Response,
    fallbackMessage =
        'Unable to complete the request.'
): Promise<ApiErrorDetails> {
    let title: string | null = null;
    let message = fallbackMessage;

    try {
        const body =
            await response
                .clone()
                .json();

        if (
            typeof body?.title ===
            'string' &&
            body.title.trim()
        ) {
            title =
                body.title.trim();
        }

        if (
            typeof body?.detail ===
            'string' &&
            body.detail.trim()
        ) {
            message =
                body.detail.trim();
        } else if (
            typeof body?.message ===
            'string' &&
            body.message.trim()
        ) {
            message =
                body.message.trim();
        } else if (
            body?.errors
        ) {
            const validationMessages =
                Object.values(
                    body.errors
                )
                    .flat()
                    .filter(
                        (
                            value
                        ): value is string =>
                            typeof value ===
                            'string'
                    );

            if (
                validationMessages.length >
                0
            ) {
                message =
                    validationMessages.join(
                        ' '
                    );
            }
        }
    } catch {
        /*
         * The response may not contain JSON.
         * Keep the supplied fallback message.
         */
    }

    return {
        status: response.status,
        title,
        message,
    };
}

export function getNetworkErrorDetails(
    error?: unknown
): ApiErrorDetails {
    let message =
        'We could not connect to the service. Please check your connection and try again.';

    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        message =
            error.message.trim();
    }

    return {
        status: null,
        title: 'Unable to connect',
        message,
    };
}
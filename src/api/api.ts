
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? ''
).replace(/\/$/, '');

interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    role: string;
    userName: string;
    name: string;
    email: string;
}

let refreshPromise: Promise<boolean> | null = null;

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

export function clearAdminSession(): void {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
}

function storeAdminSession(data: AuthTokensResponse): void {
    localStorage.setItem('adminAccessToken', data.accessToken);
    localStorage.setItem('adminRefreshToken', data.refreshToken);
    localStorage.setItem('adminRole', data.role);
    localStorage.setItem('adminName', data.name);
    localStorage.setItem('adminEmail', data.email);
}

async function refreshAdminSession(): Promise<boolean> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken =
            localStorage.getItem('adminRefreshToken');

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
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                }
            );

            if (!response.ok) {
                clearAdminSession();
                return false;
            }

            const data =
                (await response.json()) as AuthTokensResponse;

            storeAdminSession(data);
            return true;
        } catch {
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
    const headers = new Headers(options.headers);
    const accessToken =
        localStorage.getItem('adminAccessToken');

    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return fetch(apiUrl(path), { ...options, headers });
}

export async function validateAdminSession(): Promise<boolean> {
    if (!localStorage.getItem('adminAccessToken')) {
        clearAdminSession();
        return false;
    }

    try {
        let response = await fetchWithAccessToken(
            '/api/auth/validate',
            { method: 'GET' }
        );

        if (response.ok) {
            return true;
        }

        if (response.status !== 401) {
            clearAdminSession();
            return false;
        }

        if (!(await refreshAdminSession())) {
            return false;
        }

        response = await fetchWithAccessToken(
            '/api/auth/validate',
            { method: 'GET' }
        );

        if (!response.ok) {
            clearAdminSession();
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    let response = await fetchWithAccessToken(path, options);

    const isAuthRequest =
        path.startsWith('/api/auth/login') ||
        path.startsWith('/api/auth/refresh');

    if (response.status !== 401 || isAuthRequest) {
        return response;
    }

    if (!(await refreshAdminSession())) {
        return response;
    }

    response = await fetchWithAccessToken(path, options);
    return response;
}

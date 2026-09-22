const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? ''
).replace(/\/$/, '');

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/')
        ? path
        : `/${path}`;

    return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = new Headers(options.headers);

    /*
     * Attach the administrator access token when one exists.
     *
     * Public API requests continue to work normally when there
     * is no administrator token.
     */
    const accessToken =
        localStorage.getItem('adminAccessToken');

    if (
        accessToken &&
        !headers.has('Authorization')
    ) {
        headers.set(
            'Authorization',
            `Bearer ${accessToken}`
        );
    }

    /*
     * Do not automatically set Content-Type here.
     *
     * Some API operations, such as Gallery image uploads,
     * will use FormData. The browser must generate the
     * multipart/form-data boundary itself.
     */
    return fetch(
        apiUrl(path),
        {
            ...options,
            headers,
        }
    );
}
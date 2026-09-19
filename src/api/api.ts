const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? ''
).replace(/\/$/, '');

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(
    path: string,
    options?: RequestInit
): Promise<Response> {
    return fetch(apiUrl(path), options);
}
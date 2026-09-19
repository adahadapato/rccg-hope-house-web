import { useState, useEffect } from 'react';
import { apiFetch } from '@/api/api';
export interface ServiceBroadcast {
    id: string;
    category: string;
    title: string;
    videoId: string;
    videoUrl: string;
    thumbnailUrl: string;
    description: string | null;
    theme: string | null;
    serviceMonth: string;
    isLive: boolean;
}

export function useServiceBroadcasts() {
    const [broadcasts, setBroadcasts] = useState<ServiceBroadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiFetch('/api/service-broadcasts/latest', { signal: controller.signal });
                if (!res.ok) throw new Error(`Failed to load broadcasts (${res.status})`);
                const data: ServiceBroadcast[] = await res.json();
                setBroadcasts(data);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load service videos.');
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    return { broadcasts, loading, error };
}
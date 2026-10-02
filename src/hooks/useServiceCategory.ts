import {
    apiFetch,
} from '@/api/api';
import {
    useEffect,
    useState,
} from 'react';

/**
 * Loads all church service categories defined by the backend.
 *
 * The backend ServiceCategory enum remains the single source of truth,
 * so categories are available regardless of whether an existing service
 * currently uses them or whether that service is active.
 */
export function useServiceCategory() {
    const [
        categories,
        setCategories,
    ] = useState<string[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    useEffect(() => {
        const controller =
            new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const res =
                    await apiFetch(
                        '/api/services/categories',
                        {
                            signal:
                                controller.signal,
                        }
                    );

                if (!res.ok) {
                    throw new Error(
                        `Failed to load service categories (${res.status})`
                    );
                }

                const data: string[] =
                    await res.json();

                setCategories(data);
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError'
                ) {
                    setError(
                        'Unable to load service categories.'
                    );
                }
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        })();

        return () =>
            controller.abort();
    }, []);

    return {
        categories,
        loading,
        error,
    };
}
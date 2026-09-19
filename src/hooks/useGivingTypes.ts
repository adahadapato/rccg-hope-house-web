import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/api';

export interface GivingType {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
}

/*
 * Module-level cache.
 *
 * Once giving types have been loaded successfully, other components
 * using this hook during the same application session can reuse them
 * without making another API request.
 */
let givingTypesCache: GivingType[] | null = null;

export function useGivingTypes() {
    const [givingTypes, setGivingTypes] = useState<GivingType[]>(
        givingTypesCache ?? []
    );

    const [loading, setLoading] = useState(
        givingTypesCache === null
    );

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        /*
         * We already have the data for this application session,
         * so there is no reason to request it again.
         */
        if (givingTypesCache !== null) {
            setGivingTypes(givingTypesCache);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiFetch(
                    '/api/giving-types/active',
                    {
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load giving types (${response.status})`
                    );
                }

                const data: GivingType[] = await response.json();

                givingTypesCache = data;
                setGivingTypes(data);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError(
                        'Unable to load giving types. Please try again.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        })();

        return () => controller.abort();
    }, []);

    return {
        givingTypes,
        loading,
        error,
    };
}
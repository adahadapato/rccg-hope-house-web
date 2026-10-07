import {
    useEffect,
    useState,
} from 'react';

import { apiFetch } from '@/api/api';

export type ChurchContactMethodType =
    | 'Phone'
    | 'Email'
    | 'Website'
    | 'WhatsAppGroup'
    | 'Facebook'
    | 'Instagram'
    | 'YouTube';

export interface ChurchContactMethod {
    id: string;
    type: ChurchContactMethodType;
    value: string;
    label: string | null;
    displayOrder: number;
}

export interface ChurchInfo {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postCode: string | null;
    country: string;
    parishName: string;
    establishedYear: number;
    yearsOfMinistry: number;
    tagline: string;
    aboutLead: string;
    aboutText: string;
    multiCulturalStat: string;
    activeMemberCount: number;
    contactMethods: ChurchContactMethod[];
}

/**
 * Loads the public church profile and contact information.
 */
export function useChurchInfo() {
    const [
        churchInfo,
        setChurchInfo,
    ] = useState<ChurchInfo | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    useEffect(() => {
        const controller =
            new AbortController();

        const loadChurchInfo =
            async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const response =
                        await apiFetch(
                            '/api/church-info',
                            {
                                signal:
                                    controller.signal,
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Failed to load church info (${response.status})`
                        );
                    }

                    const data =
                        (await response.json()) as ChurchInfo;

                    setChurchInfo(data);
                } catch (err) {
                    if (
                        (err as Error)
                            .name !==
                        'AbortError'
                    ) {
                        setError(
                            'Unable to load church information.'
                        );
                    }
                } finally {
                    if (
                        !controller.signal
                            .aborted
                    ) {
                        setLoading(false);
                    }
                }
            };

        void loadChurchInfo();

        return () =>
            controller.abort();
    }, []);

    return {
        churchInfo,
        loading,
        error,
    };
}
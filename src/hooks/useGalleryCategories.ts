import {
    useEffect,
    useState,
} from 'react';

import { apiFetch } from '../api/api';

export interface GalleryCategoryOption {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
}

let galleryCategoryCache:
    GalleryCategoryOption[] | null = null;

export function useGalleryCategories() {
    const [
        galleryCategories,
        setGalleryCategories,
    ] = useState<GalleryCategoryOption[]>(
        galleryCategoryCache ?? []
    );

    const [
        loading,
        setLoading,
    ] = useState(
        galleryCategoryCache === null
    );

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    useEffect(() => {
        if (galleryCategoryCache) {
            return;
        }

        const controller =
            new AbortController();

        async function loadCategories() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await apiFetch(
                        '/api/gallery-categories/active',
                        {
                            signal:
                                controller.signal,
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load gallery categories (${response.status}).`
                    );
                }

                const data:
                    GalleryCategoryOption[] =
                    await response.json();

                const ordered =
                    [...data].sort(
                        (a, b) =>
                            a.displayOrder -
                            b.displayOrder ||
                            a.name.localeCompare(
                                b.name
                            )
                    );

                galleryCategoryCache =
                    ordered;

                setGalleryCategories(
                    ordered
                );
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError'
                ) {
                    setError(
                        'Unable to load gallery categories.'
                    );
                }
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }

        void loadCategories();

        return () => {
            controller.abort();
        };
    }, []);

    return {
        galleryCategories,
        loading,
        error,
    };
}
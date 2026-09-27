import {
    useEffect,
    useState,
} from 'react';

import '../../styles/back-to-top.css';

export default function BackToTop() {
    const [
        isVisible,
        setIsVisible,
    ] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(
                window.scrollY > 500
            );
        };

        handleScroll();

        window.addEventListener(
            'scroll',
            handleScroll,
            {
                passive: true,
            }
        );

        return () => {
            window.removeEventListener(
                'scroll',
                handleScroll
            );
        };
    }, []);

    const scrollToTop = () => {
        const homeSection =
            document.getElementById(
                'home'
            );

        if (homeSection) {
            homeSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });

            return;
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            type="button"
            className={`back-to-top ${isVisible
                    ? 'back-to-top-visible'
                    : ''
                }`}
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
        >
            <span
                aria-hidden="true"
                className="back-to-top-arrow"
            >
                ↑
            </span>
        </button>
    );
}
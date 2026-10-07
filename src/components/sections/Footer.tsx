import { useChurchInfo } from '@/hooks/useChurchInfo';

export default function Footer() {
    const { churchInfo } = useChurchInfo();

    const facebook = churchInfo?.contactMethods.find(
        method => method.type === 'Facebook'
    );

    const instagram = churchInfo?.contactMethods.find(
        method => method.type === 'Instagram'
    );

    const youtube = churchInfo?.contactMethods.find(
        method => method.type === 'YouTube'
    );

    const whatsapp = churchInfo?.contactMethods.find(
        method => method.type === 'WhatsAppGroup'
    );

    const website = churchInfo?.contactMethods.find(
        method => method.type === 'Website'
    );

    const parishName =
        churchInfo?.parishName || 'RCCG Hope House Parish';

    const tagline =
        churchInfo?.tagline ||
        'A place of hope, faith, and transformation in the heart of London.';

    return (
        <footer className="footer-modern">
            <div className="container">
                <div className="footer-grid-modern">
                    <div className="footer-brand-modern">
                        <img
                            src="/rccg-logo.png"
                            alt="RCCG Logo"
                            className="footer-logo"
                        />

                        <p>{tagline}</p>

                        <div className="social-links">
                            {facebook && (
                                <a
                                    href={facebook.value}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Facebook"
                                    title={
                                        facebook.label ||
                                        'Facebook'
                                    }
                                >
                                    f
                                </a>
                            )}

                            {youtube && (
                                <a
                                    href={youtube.value}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="YouTube"
                                    title={
                                        youtube.label ||
                                        'YouTube'
                                    }
                                >
                                    yt
                                </a>
                            )}

                            {instagram && (
                                <a
                                    href={instagram.value}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    title={
                                        instagram.label ||
                                        'Instagram'
                                    }
                                >
                                    ig
                                </a>
                            )}

                            {whatsapp && (
                                <a
                                    href={whatsapp.value}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Join our WhatsApp group"
                                    title={
                                        whatsapp.label ||
                                        'Join Our WhatsApp Group'
                                    }
                                >
                                    wa
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="footer-links-modern">
                        <h4>Quick Links</h4>

                        <ul>
                            <li>
                                <a href="#about">
                                    About Us
                                </a>
                            </li>

                            <li>
                                <a href="#services">
                                    Services
                                </a>
                            </li>

                            <li>
                                <a href="#events">
                                    Events
                                </a>
                            </li>

                            <li>
                                <a href="#prayer">
                                    Prayer
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-links-modern">
                        <h4>Ministries</h4>

                        <ul>
                            <li>
                                <a href="#">
                                    Children
                                </a>
                            </li>

                            <li>
                                <a href="#">
                                    Youth
                                </a>
                            </li>

                            <li>
                                <a href="#">
                                    Women
                                </a>
                            </li>

                            <li>
                                <a href="#">
                                    Men
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-links-modern">
                        <h4>Resources</h4>

                        <ul>
                            {website && (
                                <li>
                                    <a
                                        href={website.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {website.label ||
                                            'Church Website'}
                                    </a>
                                </li>
                            )}

                            {whatsapp && (
                                <li>
                                    <a
                                        href={whatsapp.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {whatsapp.label ||
                                            'Join Our WhatsApp Group'}
                                    </a>
                                </li>
                            )}

                            <li>
                                <a href="#">
                                    Give Online
                                </a>
                            </li>

                            <li>
                                <a href="#">
                                    Bible Study
                                </a>
                            </li>

                            <li>
                                <a href="#">
                                    Newsletter
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom-modern">
                    <p>
                        &copy; {new Date().getFullYear()}{' '}
                        {parishName}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
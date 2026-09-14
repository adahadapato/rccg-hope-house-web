//import { useState } from 'react';

//export default function Navigation() {
//    const [isMenuOpen, setIsMenuOpen] = useState(false);

//    return (
//        <nav className="nav-modern">
//            <div className="nav-content">
//                <a href="#home" className="logo">
//                    <img src="/rccg-logo.png" alt="RCCG Logo" className="logo-img" />
//                    <div className="logo-text">
//                        <h1>RCCG Hope House</h1>
//                        <p>Redeemed Christian Church of God</p>
//                    </div>
//                </a>

//                <div className="nav-links">
//                    <a href="#home">Home</a>
//                    <a href="#about">About</a>
//                    <a href="#beleifs">Beliefs</a>
//                    <a href="#vision">Vision</a>
//                    <a href="#services">Services</a>
//                    <a href="#services">Services</a>
//                    <a href="#devotional">Devotional</a>
//                    <a href="#events">Events</a>
//                    <a href="#prayer">Prayer Request</a>
//                    <a href="#contact">Contact Us</a>
//                    <button className="btn-primary">Give Online</button>
//                </div>

//                <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
//                    <div className="hamburger-line"></div>
//                    <div className="hamburger-line"></div>
//                    <div className="hamburger-line"></div>
//                </button>
//            </div>

//            {isMenuOpen && (
//                <div className="mobile-menu">
//                    <a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a>
//                    <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
//                    <a href="#services" onClick={() => setIsMenuOpen(false)}>Services</a>
//                    <a href="#devotional" onClick={() => setIsMenuOpen(false)}>Devotional</a>
//                    <a href="#events" onClick={() => setIsMenuOpen(false)}>Events</a>
//                    <a href="#prayer" onClick={() => setIsMenuOpen(false)}>Prayer</a>
//                    <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
//                </div>
//            )}
//        </nav>
//    );
//}

import { useState } from 'react';
export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);

    const menuItems = [
        { label: 'Home', href: '#home' },
        {
            label: 'About',
            href: '#about',
            children: [
                { label: 'About Us', href: '#about' },
                { label: 'Our Family', href: '#welcome' },
                { label: 'Gallery', href: '#photo-gallery' },
                { label: 'Beliefs', href: '#beliefs' },
                { label: 'Vision', href: '#vision-mission' },
            ],
        },
        {
            label: 'Ministries',
            href: '#services',
            children: [
                { label: 'Services', href: '#services' },
                { label: 'Devotional', href: '#devotional' },
                { label: 'Pastors Corner', href: '#pastors-corner' },
            ],
        },
        {
            label: 'Events', href: '#events',
            children: [
                { label: 'Special Services', href: '#monthly-services' },
                { label: 'Theme of the Year', href: '#theme-of-year' },
                { label: 'Prophecy of the Year', href: '#prophecy-of-the-year' },
                { label: 'Prayer for the year', href: '#prayer-for-the-year' },
            ],
        },
        {
            label: 'Connect',
            href: '#connect',
            children: [
                { label: 'Prayer Request', href: '#prayer' },
                { label: 'Contact Us', href: '#contact' },
            ],
        },
    ];

    return (
        <nav className="nav-modern">
            <div className="nav-content">
                <a href="#home" className="logo">
                    <img src="/rccg-logo.png" alt="RCCG Logo" className="logo-img" />
                    <div className="logo-text">
                        <h1>RCCG Hope House</h1>
                        <p>Redeemed Christian Church of God</p>
                    </div>
                </a>

                {/* Desktop Navigation */}
                <div className="nav-links">
                    {menuItems.map((item) =>
                        item.children ? (
                            <div
                                key={item.label}
                                className="dropdown"
                                onMouseEnter={() => setActiveDropdown(item.label)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <a href={item.href} className="dropdown-trigger">
                                    {item.label}
                                    <svg
                                        className={`dropdown-arrow ${activeDropdown === item.label ? 'rotated' : ''
                                            }`}
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                    >
                                        <path
                                            d="M2 3.5L5 6.5L8 3.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </a>
                                <div
                                    className={`dropdown-content ${activeDropdown === item.label ? 'open' : ''
                                        }`}
                                >
                                    {item.children.map((child) => (
                                        <a
                                            key={child.label}
                                            href={child.href}
                                            className="dropdown-item"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {child.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <a key={item.label} href={item.href} className="nav-link">
                                {item.label}
                            </a>
                        )
                    )}
                    <button className="btn-primary">Give Online</button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <div className="hamburger-line"></div>
                    <div className="hamburger-line"></div>
                    <div className="hamburger-line"></div>
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    {menuItems.map((item) =>
                        item.children ? (
                            <div key={item.label} className="mobile-dropdown">
                                <button
                                    className="mobile-dropdown-toggle"
                                    onClick={() =>
                                        setMobileOpenDropdown(
                                            mobileOpenDropdown === item.label
                                                ? null
                                                : item.label
                                        )
                                    }
                                >
                                    {item.label}
                                    <svg
                                        className={`mobile-arrow ${mobileOpenDropdown === item.label
                                                ? 'rotated'
                                                : ''
                                            }`}
                                        width="12"
                                        height="12"
                                        viewBox="0 0 10 10"
                                    >
                                        <path
                                            d="M2 3.5L5 6.5L8 3.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </button>
                                <div
                                    className={`mobile-dropdown-content ${mobileOpenDropdown === item.label ? 'open' : ''
                                        }`}
                                >
                                    {item.children.map((child) => (
                                        <a
                                            key={child.label}
                                            href={child.href}
                                            className="mobile-dropdown-item"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setMobileOpenDropdown(null);
                                            }}
                                        >
                                            {child.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className="mobile-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        )
                    )}
                    <button
                        className="mobile-give-btn"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Give Online
                    </button>
                </div>
            )}
        </nav>
    );
}
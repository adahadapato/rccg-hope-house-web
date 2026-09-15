import { useState, useEffect } from 'react';

type CategoryKey = 'general' | 'nigeria' | 'international';
export default function Prophecies() {
    const [activeModal, setActiveModal] = useState<CategoryKey | null>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveModal(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (activeModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeModal]);

    const propheciesData = {
        general: {
            title: "General Prophecies",
            subtitle: "For the Church & Believers",
            icon: "✨",
            accent: "from-amber-400 to-orange-500",
            accentLight: "bg-amber-50",
            accentText: "text-amber-600",
            items: [
                "Daddy says 2026 will be more remarkable than 2025",
                "Daddy says that the wind that has been blowing since 2024 will continue to blow more strongly than before",
                "Daddy said there will be more opportunities this year than last year – more breakthroughs, more successes, more victories and less failures",
                "Daddy says a lot of testimonies this year will begin with, 'God remembered me at last!'"
            ]
        },
        nigeria: {
            title: "For Nigeria",
            subtitle: "Prophetic Declarations",
            icon: "NG",
            accent: "from-green-500 to-emerald-600",
            accentLight: "bg-green-50",
            accentText: "text-green-600",
            items: [
                "This year there will be a reduction in hunger",
                "Small and medium enterprises will begin to blossom",
                "Daddy said something that I can only put down as reverse 'japa' – many who 'japad' (travelled) will come back home",
                "Note: The second part concerning Nigeria is being prayed about and will be shared when God gives the go-ahead"
            ]
        },
        international: {
            title: "International Scene",
            subtitle: "Global Prophecies",
            icon: "🌍",
            accent: "from-blue-500 to-indigo-600",
            accentLight: "bg-blue-50",
            accentText: "text-blue-600",
            items: [
                "The chance of a major war is less this year than last year",
                "As far as the weather is concerned, the pattern will be similar to 2025 except there is the chance of a couple of major hurricanes",
                "RCCG: we will tell your pastors who will tell house fellowship leaders, who will tell you because what He is saying to you, I don't want anybody else to know",
                "If we are going to fast, we won't begin on January 11. They are waiting for us to begin on January 11 – we will disappoint them"
            ]
        }
    };

    //type CategoryKey = keyof typeof propheciesData;

    const openModal = (category: CategoryKey) => setActiveModal(category);
    const closeModal = () => setActiveModal(null);

    return (
        <section id="prophecy-of-the-year" className="section prophecies-section">
            <div className="container">
                <div className="prophecy-header">
                    <span className="prophecy-tag">DIVINE REVELATION</span>
                    <h2 className="prophecy-title">RCCG Prophecies for 2026</h2>
                    <div className="title-divider-center"></div>
                    <p className="prophecy-subtitle">
                        Prophetic declarations and revelations for the year from our General Overseer
                    </p>
                </div>

                <div className="prophecy-cards">
                    {(Object.entries(propheciesData) as [CategoryKey, typeof propheciesData.general][]).map(([key, data]) => (
                        <div key={key} className="prophecy-card">
                            <div className="card-header">
                                <div className={`card-icon-wrapper ${data.accentLight}`}>
                                    <span className="card-icon">{data.icon}</span>
                                </div>
                                <h3 className="card-title">{data.title}</h3>
                                <p className="card-subtitle">{data.subtitle}</p>
                            </div>

                            <div className="card-preview">
                                {data.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="preview-item">
                                        <span className={`preview-number ${data.accentText}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <p className="preview-text">{item}</p>
                                    </div>
                                ))}
                                {data.items.length > 2 && (
                                    <div className="preview-more">
                                        <span>+{data.items.length - 2} more prophecies</span>
                                    </div>
                                )}
                            </div>

                            <button
                                className={`view-full-btn ${key}`}
                                onClick={() => openModal(key)}
                            >
                                <span>View Full Prophecies</span>
                                <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {activeModal && (
                <div className="prophecy-modal-overlay" onClick={closeModal}>
                    <div className="prophecy-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Close Icon - Top Left */}
                        <button className="modal-close-icon" onClick={closeModal} aria-label="Close">
                            ✕
                        </button>

                        {/* Modal Header */}
                        <div className={`modal-header ${activeModal}`}>
                            <div className="modal-header-content">
                                <span className="modal-icon">{propheciesData[activeModal].icon}</span>
                                <div>
                                    <h3 className="modal-title">{propheciesData[activeModal].title}</h3>
                                    <p className="modal-subtitle">{propheciesData[activeModal].subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="modal-body">
                            <div className="modal-intro">
                                <p>Here are the complete prophetic declarations for <strong>{propheciesData[activeModal].title.toLowerCase()}</strong> in 2026:</p>
                            </div>

                            <div className="full-prophecy-list">
                                {propheciesData[activeModal].items.map((item, idx) => (
                                    <div key={idx} className="full-prophecy-item">
                                        <div className={`item-number ${activeModal}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="item-content">
                                            <p>{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <p className="footer-note">
                                    💡 These prophecies are from the General Overseer of RCCG. Hold on to them in faith!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
export default function Vision() {
    const visionPoints = [
        "To groom & develop mature disciples and raise leaders that will in turn raise other leaders",
        "To reach the lost for Christ and using every available means to populate the Kingdom of God",
        "To reach other parts of the world with the Word of God and provide financial assistance"
    ];

    return (
        <section className="section vision-section">
            <div className="container">
                <div className="vision-grid">
                    <div className="vision-content">
                        <div className="section-header-left">
                            <span className="section-tag">OUR VISION</span>
                            <h2 className="section-title">Our Vision</h2>
                            <div className="title-divider-left"></div>
                        </div>
                        <ul className="vision-list">
                            {visionPoints.map((point, idx) => (
                                <li key={idx} className="vision-item">
                                    <span className="vision-bullet"></span>
                                    <span className="vision-text">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="vision-image">
                        <img
                            src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop"
                            alt="Church congregation worshipping"
                            className="vision-photo"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
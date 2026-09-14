export default function VisionMission() {
    const visionPoints = [
        "To groom & develop mature disciples and raise leaders that will in turn raise other leaders",
        "To reach the lost for Christ and using every available means to populate the Kingdom of God",
        "To reach other parts of the world with the Word of God and provide financial assistance"
    ];

    const missionPoints = [
        {
            title: "Worship",
            desc: "A cultivation of true worship in our churches"
        },
        {
            title: "Fellowship",
            desc: "Building lasting relationships and friendships, creating a unique family environment & strengthening family ties"
        },
        {
            title: "Discipleship",
            desc: "Converts turning into true & solid disciples"
        },
        {
            title: "Services Opportunities",
            desc: "To make opportunities and training available for disciples provide their gifts & services to the Lord"
        },
        {
            title: "Witnessing",
            desc: "Encouraging witnessing & evangelism in order to fulfil the great commission according to Matt 28:19-20 Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son"
        }
    ];

    return (
        <section id="vision-mission" className="section vision-mission-section">
            <div className="container">
                {/* Vision Section */}
                <div className="vision-mission-grid">
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
                            src="/IMG-10.jpg"
                            alt="Church congregation worshipping"
                            className="vision-photo"
                        />
                    </div>
                </div>

                {/* Mission Section */}
                <div className="mission-section">
                    <div className="section-header-center">
                        <span className="section-tag">OUR STRATEGY</span>
                        <h2 className="section-title">How are we going to achieve this?</h2>
                        <div className="title-divider-center"></div>
                    </div>

                    <div className="mission-grid">
                        {missionPoints.map((item, idx) => (
                            <div key={idx} className="mission-card">
                                <div className="mission-number">{String(idx + 1).padStart(2, '0')}</div>
                                <h3 className="mission-title">{item.title}</h3>
                                <p className="mission-description">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
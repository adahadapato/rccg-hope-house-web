export default function Mission() {
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
            title: "Service Opportunities",
            desc: "To make opportunities and training available for disciples to provide their gifts & services to the Lord"
        },
        {
            title: "Witnessing",
            desc: "Encouraging witnessing & evangelism in order to fulfil the great commission according to Matt 28:19-20 Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son"
        }
    ];

    return (
        <section className="section mission-section">
            <div className="container">
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
        </section>
    );
}
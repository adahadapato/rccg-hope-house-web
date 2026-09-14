export default function AnnualPrayerPoints() {
    // This structure mimics what your database/API will return
    const prayerData = {
        year: 2026,
        theme: "Brand New Beginning",
        service: "January 2026 Holy Ghost Service",
        author: "Pastor E.A. Adeboye",
        points: [
            "Thank God that He has kept you till now.",
            "Ask Him to forgive you for your previous lukewarmness. You won't take Him for granted anymore and you will be serious from now on. You won't allow the comfort He has given you to drive you away from Him.",
            "Father, now that my set time has come, arise and help me.",
            "Father, from this very moment, let all those who are connected with my destiny begin to fulfil their purpose.",
            "If there is still any form of jonah left in my life (laziness, pride, lukewarmness, incomplete obedience) blocking my way to complete victory, please help me uproot them.",
            "Father, give me a brand new beginning to serve You now with all seriousness.",
            "Father, like in the case of Naaman, let me become a testimony to the whole world.",
            "Your personal prayer points"
        ],
        bibleText: {
            reference: "Exo 14:21-22",
            content: "And Moses stretched out his hand over the sea, and the LORD caused the sea to go back by a strong east wind all that night, and made the sea dry land, and the waters were divided. And the children of Israel went into the midst of the sea upon the dry ground: and the waters were a wall unto them on their right hand, and on their left."
        },
        declaration: "The Lord has declared through our Father in the Lord (Pastor E.A Adeboye) that: \"The Wind is Blowing\". The wind of God will surely reposition His children into a brand new beginning for good and bring destruction to their enemies.",
        closingVerse: "Remember that your brand new beginning will be determined by the fact that you are on God's side. Galatians 3:26."
    };

    return (
        <section id="prayer-for-the-year" className="section annual-prayer-section">
            <div className="container">
                <div className="annual-prayer-grid">
                    {/* Left Column - Prayer Points */}
                    <div className="prayer-points-column">
                        <div className="prayer-header">
                            <h2 className="prayer-title">Prayer for the year {prayerData.year}</h2>
                            <div className="prayer-subtitle">
                                <p>Prayer Points from RCCG {prayerData.service}</p>
                                <p className="hashtag">#{prayerData.theme.replace(/\s+/g, '')}</p>
                                <p>By {prayerData.author}.</p>
                            </div>
                        </div>

                        <div className="prayer-points-list">
                            {prayerData.points.map((point, idx) => (
                                <div key={idx} className="prayer-point-item">
                                    <span className="prayer-point-number">{idx + 1}.</span>
                                    <p className="prayer-point-text">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Bible Text & Image */}
                    <div className="prayer-sidebar-column">
                        {/*<div className="prayer-image-wrapper">*/}
                        {/*    <img*/}
                        {/*        src="https://images.unsplash.com/photo-1507692049790-de58293a4695?w=800&auto=format&fit=crop"*/}
                        {/*        alt="Person praying"*/}
                        {/*        className="prayer-image"*/}
                        {/*    />*/}
                        {/*</div>*/}

                        <div className="prayer-image-wrapper">
                            <img
                                src="/prayers-image.jpg"
                                alt="Person praying in church"
                                className="prayer-image"
                            />
                        </div>

                        <div className="bible-text-section">
                            <h4 className="bible-text-heading">BIBLE TEXT: <span>{prayerData.bibleText.reference}</span></h4>
                            <div className="bible-text-content">
                                <p>{prayerData.bibleText.content}</p>
                                <p className="bible-declaration">
                                    {prayerData.declaration}
                                </p>
                                <p className="closing-verse">
                                    {prayerData.closingVerse}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
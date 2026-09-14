import { useState } from 'react';

export default function Beliefs() {
    const [activeBelief, setActiveBelief] = useState<number | null>(null);

    const beliefs = [
        { id: 0, icon: "📖", title: "The Holy Bible", excerpt: "The inspired, revealed Word of God and foundation of our faith.", full: "That the Holy Bible is the written and revealed will of God. We believe that the entire Scripture, both Old and New Testament are written by the inspiration of the Holy Spirit. All the Christian teachings and the Christian attitude of the Children of God are such as are established in the Holy Bible. As revealed unto us by the Bible, we believe that there is only one God, who is the Creator of both the visible and invisible. He exists in three Persons: God the Father, God the Son and God the Holy Spirit." },
        { id: 1, icon: "✝️", title: "Jesus Christ", excerpt: "The Son of God, Saviour of the world, born of a virgin.", full: "Jesus Christ is the Son of God; Who took away our sins, and the Saviour of the world. We also believe that Jesus is God and was born by Mary the Virgin. He is God revealed in the flesh. Through Him all things were created. We believe in His death on the Cross, and resurrection, by which He brought redemption." },
        { id: 2, icon: "🕊️", title: "The Holy Spirit", excerpt: "Infilling, divine power, and spiritual gifts for believers.", full: "We also believe in the infilling and power of the Holy Spirit. The holy spirit enables us to use spiritual gifts, including speaking in tongues. He guides us into all truth, convicts of sin, and empowers us for witness and service.", image: "https://images.unsplash.com/photo-1589987281416-2c9e8f8a5c6e?w=400&auto=format&fit=crop&q=80" },
        { id: 3, icon: "👑", title: "Second Coming", excerpt: "Eternal life, purpose, and the promised return of Christ.", full: "In the second coming of Jesus Christ will be in physical form and will be visible to all. We believe in Heaven & Hell. The Bible teaches us that there is eternal punishment as well as eternal life. We also believe that God wants us to live a life full of purpose, abundance, health and transformation." }
    ];

    return (
        <section id="beliefs" className="section beliefs-modern">
            <div className="container">
                <div className="section-header-center">
                    <span className="section-tag">OUR FOUNDATION</span>
                    <h2 className="section-title">What We Believe</h2>
                    <div className="title-divider-center"></div>
                    <p className="section-description">Rooted in Scripture, guided by the Holy Spirit, and committed to the truth of God's Word.</p>
                </div>
                <div className="beliefs-grid-modern">
                    {beliefs.map((belief) => (
                        <div key={belief.id} className={`belief-card-modern ${activeBelief === belief.id ? 'active' : ''}`} onClick={() => setActiveBelief(activeBelief === belief.id ? null : belief.id)}>
                            <div className="belief-header">
                                <span className="belief-icon">
                                    {belief.image ? <img src={belief.image} alt={belief.title} loading="lazy" className="belief-icon-image" /> : belief.icon}
                                </span>
                                <h3 className="belief-title">{belief.title}</h3>
                                <button className="belief-toggle" aria-label="Toggle details"><span className="toggle-icon">+</span></button>
                            </div>
                            <div className="belief-excerpt">{belief.excerpt}</div>
                            {activeBelief === belief.id && <div className="belief-detail"><p>{belief.full}</p></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
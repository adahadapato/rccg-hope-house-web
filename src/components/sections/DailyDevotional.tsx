import { useState, useEffect } from 'react';

export default function DailyDevotional() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('devotional'); // 'devotional' or 'bible'
  const [activeTranslation, setActiveTranslation] = useState('KJV');
  const [bibleText, setBibleText] = useState('');
  const [isLoadingBible, setIsLoadingBible] = useState(false);

  // Full Devotional Data (In production, this comes from your backend)
  const devotional = {
    date: "June 6, 2026",
    theme: "DIVINE REPOSITIONING",
    scripture: "Exodus 14:1-4",
    thought: "Beloved, divine repositioning is a strategic move by God to place you in a position where His glory will be manifested. What looks like a dead end is actually a setup for your breakthrough.",
    fullCommentary: `
      <p>Beloved, divine repositioning is a strategic move by God to place you in a position where His glory will be manifested in your life. Just as God instructed the children of Israel to change their direction and encamp by the sea, He may ask you to make seemingly unusual decisions that will ultimately lead to your breakthrough.</p>
      <p>The Israelites appeared to be trapped and confused, but God had a greater plan. What looks like a dead end to you is actually a setup for God's mighty deliverance. Your current position is not your final destination.</p>
      <p>When God repositions you, He does so for a purpose: to display His power, to confound your enemies, and to bring you into a new season of victory. Trust His leading even when it doesn't make sense to your natural understanding.</p>
    `,
    prayerPoints: [
      "Father, thank You for Your divine repositioning in my life.",
      "Lord, give me the grace to follow Your instructions precisely.",
      "Father, reposition me for breakthrough and divine manifestation.",
      "Lord, confuse every Pharaoh pursuing my destiny in Jesus' name.",
      "Father, let my life be a testimony of Your power and deliverance."
    ],
    declaration: "I am divinely repositioned for breakthrough. My enemies shall be confounded, and the glory of God shall be manifested in my life. In Jesus' name!"
  };

  // Smart Bible Text Fetcher
  const fetchBibleText = async (translation) => {
    setIsLoadingBible(true);
    setActiveTranslation(translation);
    
    try {
      // 1. KJV uses a free public API
      if (translation === 'KJV') {
        const response = await fetch('https://bible-api.com/exodus+14:1-4?translation=kjv');
        const data = await response.json();
        setBibleText(data.text);
      } 
      // 2. Other translations (Due to copyright, free APIs limit NIV/NLT/NKJV. 
      // We use high-quality text for this specific verse for the demo. 
      // In production, connect your API.Bible key here).
      else {
        const mockTexts = {
          'NKJV': "Now the LORD spoke to Moses, saying: \"Speak to the children of Israel, that they turn and camp before Pi Hahiroth, between Migdol and the sea, opposite Baal Zephon. You shall camp before it by the sea. And Pharaoh will say of the children of Israel, 'They are bewildered by the land; the wilderness has closed them in.' Then I will harden Pharaoh's heart, so that he will pursue them; and I will gain honor over Pharaoh and over all his army, that the Egyptians may know that I am the LORD.\" And they did so.",
          'NIV': "Then the LORD said to Moses, \"Tell the Israelites to turn back and encamp near Pi Hahiroth, between Migdol and the sea. They are to encamp by the sea, directly opposite Baal Zephon. Pharaoh will think, 'The Israelites are wandering around the land in confusion, hemmed in by the desert.' And I will harden Pharaoh's heart, and he will pursue them. But I will gain glory for myself through Pharaoh and all his army, and the Egyptians will know that I am the LORD.\" So the Israelites did this.",
          'NLT': "Then the LORD gave these instructions to Moses: \"Tell the people of Israel to turn back and camp by Pi-hahiroth between Migdol and the sea. Camp there along the shore, across from Baal-zephon. Then Pharaoh will think, 'The people of Israel are confused. They are trapped in the wilderness.' And once again I will harden Pharaoh's heart, and he will chase after you. I have planned this in order to display my glory through Pharaoh and his whole army. After this the Egyptians will know that I am the LORD!\" So the people of Israel camped there as they were told."
        };
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 600));
        setBibleText(mockTexts[translation]);
      }
    } catch (error) {
      setBibleText("Unable to load scripture. Please check your connection.");
    } finally {
      setIsLoadingBible(false);
    }
  };

  // Load KJV by default when modal opens
  useEffect(() => {
    if (isModalOpen && activeTab === 'bible' && !bibleText) {
      fetchBibleText('KJV');
    }
  }, [isModalOpen, activeTab]);

  return (
    <>
      <section id="devotional" className="section daily-devotional-section">
        <div className="container">
          {/* Section Header */}
          <div className="devotional-header">
            <span className="devotional-tag">📖 DAILY BREAD</span>
            <h2 className="devotional-main-title">Open Heavens Devotional</h2>
            <div className="title-divider-center"></div>
            <p className="devotional-subtitle">
              Start your day with spiritual nourishment and divine direction.
            </p>
          </div>

          {/* Devotional Card */}
          <div className="devotional-showcase">
            <div className="devotional-highlight">
              <div className="highlight-date">
                <span className="date-icon"></span>
                <span>{devotional.date}</span>
              </div>
              
              <div className="highlight-theme">
                <span className="theme-label">Today's Theme</span>
                <h3 className="theme-text">{devotional.theme}</h3>
              </div>

              {/* Clickable Scripture */}
              <div className="highlight-scripture clickable" onClick={() => { setIsModalOpen(true); setActiveTab('bible'); }}>
                <span className="scripture-label">📜 Click to Read Scripture</span>
                <p className="scripture-text">{devotional.scripture}</p>
              </div>
            </div>

            <div className="devotional-content">
              <div className="thought-block">
                <h4>💡 Thought for the Day</h4>
                <p>{devotional.thought}</p>
              </div>

              <button className="btn-read-devotional" onClick={() => setIsModalOpen(true)}>
                Read Full Devotional <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          FULL DEVOTIONAL MODAL
      ========================================= */}
      {isModalOpen && (
        <div className="devotional-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="devotional-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <h2>{devotional.theme}</h2>
                <span className="modal-date">{devotional.date}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}></button>
            </div>

            {/* Modal Tabs */}
            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'devotional' ? 'active' : ''}`}
                onClick={() => setActiveTab('devotional')}
              >
                📖 Devotional
              </button>
              <button 
                className={`tab-btn ${activeTab === 'bible' ? 'active' : ''}`}
                onClick={() => { setActiveTab('bible'); fetchBibleText(activeTranslation); }}
              >
                 Bible Reading
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="modal-content-scroll">
              
              {/* DEVOTIONAL TAB */}
              {activeTab === 'devotional' && (
                <div className="tab-content devotional-tab">
                  <div className="modal-section">
                    <h3>📜 Scripture Reading</h3>
                    <p className="modal-scripture-ref" onClick={() => setActiveTab('bible')}>
                      {devotional.scripture} <span className="click-hint">(Click to read)</span>
                    </p>
                  </div>

                  <div className="modal-section">
                    <h3>💡 Commentary</h3>
                    <div className="commentary-body" dangerouslySetInnerHTML={{ __html: devotional.fullCommentary }} />
                  </div>

                  <div className="modal-section prayer-section">
                    <h3>🙏 Prayer Points</h3>
                    <ul className="modal-prayer-list">
                      {devotional.prayerPoints.map((point, idx) => (
                        <li key={idx}>
                          <span className="prayer-num">{idx + 1}</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-section declaration-section">
                    <h3>📢 Declaration</h3>
                    <p className="declaration-text">"{devotional.declaration}"</p>
                  </div>
                </div>
              )}

              {/* BIBLE TAB */}
              {activeTab === 'bible' && (
                <div className="tab-content bible-tab">
                  <div className="translation-selector">
                    {['KJV', 'NKJV', 'NIV', 'NLT'].map((trans) => (
                      <button 
                        key={trans}
                        className={`trans-btn ${activeTranslation === trans ? 'active' : ''}`}
                        onClick={() => fetchBibleText(trans)}
                      >
                        {trans}
                      </button>
                    ))}
                  </div>

                  <div className="bible-text-display">
                    <div className="bible-header">
                      <h3>{devotional.scripture}</h3>
                      <span className="trans-badge">{activeTranslation}</span>
                    </div>
                    
                    {isLoadingBible ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Fetching the Word...</p>
                      </div>
                    ) : (
                      <p className="actual-bible-text">{bibleText}</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
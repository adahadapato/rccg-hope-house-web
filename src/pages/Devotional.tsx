import { useState } from 'react';
import Navigation from '../components/sections/Navigation';
import Footer from '../components/sections/Footer';

export default function Devotional() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Sample Open Heavens devotional data structure
  // In production, this would come from your backend/CMS
  const devotionalData = {
    date: "2026-01-15",
    theme: "DIVINE REPOSITIONING",
    scripture: "Exodus 14:1-4 (NIV)",
    bibleReading: "Exodus 14:1-4, Psalm 27:1-3",
    openHeavensText: `And the LORD said unto Moses, Speak unto the children of Israel, that they turn and encamp before Pihahiroth, between Migdol and the sea, over against Baalzephon: before it shall ye encamp by the sea. For Pharaoh will say of the children of Israel, They are entangled in the land, the wilderness hath shut them in. And I will harden Pharaoh's heart, that he shall follow after them; and I will be honoured upon Pharaoh, and upon all his host; that the Egyptians may know that I am the LORD. And they did so.`,
    commentary: `
      <p>Beloved, divine repositioning is a strategic move by God to place you in a position where His glory will be manifested in your life. Just as God instructed the children of Israel to change their direction and encamp by the sea, He may ask you to make seemingly unusual decisions that will ultimately lead to your breakthrough.</p>
      
      <p>The Israelites appeared to be trapped and confused, but God had a greater plan. What looks like a dead end to you is actually a setup for God's mighty deliverance. Your current position is not your final destination.</p>
      
      <p>When God repositions you, He does so for a purpose: to display His power, to confound your enemies, and to bring you into a new season of victory. Trust His leading even when it doesn't make sense to your natural understanding.</p>
    `,
    prayerPoints: [
      "Father, thank You for Your divine repositioning in my life.",
      "Lord, give me the grace to follow Your instructions precisely, even when they seem unusual.",
      "Father, reposition me for breakthrough and divine manifestation of Your glory.",
      "Lord, confuse every Pharaoh pursuing my destiny in Jesus' name.",
      "Father, let my life be a testimony of Your power and deliverance.",
      "Lord, I reject every spirit of confusion and fear; give me clarity and boldness.",
      "Father, use my life to glorify Your name in Jesus' name."
    ],
    declaration: "I am divinely repositioned for breakthrough. My enemies shall be confounded, and the glory of God shall be manifested in my life. In Jesus' name!",
    author: "Dr. D.K. Olukoya"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-orange-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="devotional-hero">
        <div className="container">
          <div className="devotional-header-content">
            <span className="devotional-badge">📖 DAILY DEVOTIONAL</span>
            <h1 className="devotional-title">OPEN HEAVENS</h1>
            <p className="devotional-subtitle">Redeemed Christian Church of God</p>
            <div className="devotional-date">
              <span className="date-icon">📅</span>
              <span>{new Date(devotionalData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Devotional Content */}
      <section className="devotional-content-section">
        <div className="container">
          <div className="devotional-grid">
            
            {/* Main Content */}
            <div className="devotional-main">
              
              {/* Theme Card */}
              <div className="devotional-card theme-card">
                <div className="card-header">
                  <span className="card-icon">🎯</span>
                  <h2>Theme of the Day</h2>
                </div>
                <h3 className="theme-text">{devotionalData.theme}</h3>
              </div>

              {/* Scripture Card */}
              <div className="devotional-card scripture-card">
                <div className="card-header">
                  <span className="card-icon">📜</span>
                  <h2>Daily Scripture</h2>
                </div>
                <div className="scripture-text">
                  <p>{devotionalData.scripture}</p>
                </div>
                <div className="bible-reading">
                  <strong>Further Reading:</strong> {devotionalData.bibleReading}
                </div>
              </div>

              {/* Open Heavens Text */}
              <div className="devotional-card oh-text-card">
                <div className="card-header">
                  <span className="card-icon">✨</span>
                  <h2>Open Heavens</h2>
                </div>
                <div className="oh-text">
                  <p>{devotionalData.openHeavensText}</p>
                </div>
              </div>

              {/* Commentary */}
              <div className="devotional-card commentary-card">
                <div className="card-header">
                  <span className="card-icon">💡</span>
                  <h2>Commentary</h2>
                </div>
                <div 
                  className="commentary-text"
                  dangerouslySetInnerHTML={{ __html: devotionalData.commentary }}
                />
              </div>

              {/* Prayer Points */}
              <div className="devotional-card prayer-card">
                <div className="card-header">
                  <span className="card-icon">🙏</span>
                  <h2>Prayer Points</h2>
                </div>
                <ul className="prayer-list">
                  {devotionalData.prayerPoints.map((prayer, index) => (
                    <li key={index} className="prayer-item">
                      <span className="prayer-number">{index + 1}</span>
                      <span className="prayer-text">{prayer}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Declaration */}
              <div className="devotional-card declaration-card">
                <div className="card-header">
                  <span className="card-icon">📢</span>
                  <h2>Today's Declaration</h2>
                </div>
                <p className="declaration-text">"{devotionalData.declaration}"</p>
              </div>

              {/* Author */}
              <div className="devotional-author">
                <p>Written by: <strong>{devotionalData.author}</strong></p>
                <p className="church-tag">RCCG - Redeemed Christian Church of God</p>
              </div>

            </div>

            {/* Sidebar */}
            <div className="devotional-sidebar">
              
              {/* Date Selector */}
              <div className="sidebar-card">
                <h3>Select Date</h3>
                <input 
                  type="date" 
                  className="date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Quick Info */}
              <div className="sidebar-card">
                <h3>About Open Heavens</h3>
                <p>Open Heavens is a daily devotional written by Dr. D.K. Olukoya, the General Overseer of the Redeemed Christian Church of God (RCCG).</p>
                <p>It has been a source of spiritual nourishment and breakthrough for millions of believers worldwide.</p>
              </div>

              {/* Share Options */}
              <div className="sidebar-card">
                <h3>Share Today's Devotional</h3>
                <div className="share-buttons">
                  <button className="share-btn facebook">
                    <span>📘</span> Facebook
                  </button>
                  <button className="share-btn twitter">
                    <span>🐦</span> Twitter
                  </button>
                  <button className="share-btn whatsapp">
                    <span>📱</span> WhatsApp
                  </button>
                  <button className="share-btn copy">
                    <span>📋</span> Copy Link
                  </button>
                </div>
              </div>

              {/* Archive Notice */}
              <div className="sidebar-card archive-notice">
                <h3>📚 Previous Devotionals</h3>
                <p>Want to read past devotionals? Check out our archive section.</p>
                <button className="btn-archive">View Archive</button>
              </div>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
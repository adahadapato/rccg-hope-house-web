import { useState, useEffect } from 'react';

export default function PastorsCorner() {
    const [activeArticle, setActiveArticle] = useState<number | null>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveArticle(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (activeArticle) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeArticle]);

    const articles = [
        {
            id: 1,
            category: "2026 - A Brand New Beginning",
            title: "A BRAND NEW BEGINNING – JOSEPH",
            scripture: "GENESIS 37-50",
            excerpt: "The story of Joseph in Genesis (chapters 37–50) provides profound lessons on how God can take a life marked by betrayal, slavery, and imprisonment and give it a 'brand new beginning' as a ruler.",

            // 1. INTRODUCTION (The missing text is here)
            intro: {
                heading: "INTRODUCTION",
                text: "The story of Joseph in Genesis (chapters 37–50) provides profound lessons on how God can take a life marked by betrayal, slavery, and imprisonment and give it a “brand new beginning” as a ruler. Joseph’s journey from the pit to the palace teaches that God works behind the scenes, transforming evil into good, and that faithfulness in adversity leads to divine promotion."
            },

            // 2. FIRST SET OF POINTS
            firstPoints: [
                {
                    title: "God is Present in Every Location:",
                    content: "Whether in the pit, Potiphar’s house, or the prison, the Bible notes that “the Lord was with Joseph”. This assures us that we are never alone in our struggles."
                },
                {
                    title: "Adversity is Preparation:",
                    content: "Joseph’s years in prison were not wasted time, but rather leadership training that prepared him for managing Egypt."
                },
                {
                    title: "God Turns Evil into Good (“But God”)",
                    bullets: [
                        "The Lesson: Regardless of the evil intentions or negative circumstances meant to destroy you, God has the power to orchestrate those same situations for your ultimate good and his glory.",
                        "Joseph’s Example: Joseph explicitly told his brothers, “You intended to harm me, but God intended it all for good” (Gen. 50:20).",
                        "Application: When dealing with betrayal, injustice, or misfortune, believe that God is working behind the scenes to turn the situation into a blessing."
                    ]
                },
                {
                    title: "The “New Beginning” is Often Larger than our Own Dream.",
                    bullets: [
                        "God Gives a Bigger Dream: Joseph likely dreamed of a comfortable life, but God gave him a role in saving the known world.",
                        "God Uses Pain for Purpose: What others meant for evil, God used for good, transforming a “rags to riches” story into a, “slave to savior” story."
                    ]
                }
            ],

            // 3. PREFACE / BADGE SECTION
            prefaceSection: {
                mainHeading: "lessons we can learn from God who gave a brand new beginning to Joseph in Genesis",
                preamble: "The story of Joseph in Genesis (chapters 37-50) is a powerful narrative of divine providence, showing how God can take a person from the lowest pit to the highest palace. God’s act of giving Joseph a “brand new beginning”—transforming him from a forgotten prisoner into the ruler of Egypt—offers profound lessons on faith, character, and trusting God’s timing.",
                subHeading: "Here are the key lessons we can learn from Joseph’s new beginning:"
            },

            // 4. DETAILED LESSONS (1 to 5)
            detailedLessons: [
               {
                    title: "Character Matters More Than Circumstances",
                    bullets: [
                        "The Lesson: God is less interested in our comfort and more interested in our character. He allows trials to build integrity, resilience, and faith.",
                        "Joseph’s Example: In both Potiphar’s house and the prison, Joseph acted with integrity, refusing to sin against God, even when it cost him his freedom.",
                        "Application: Maintain your integrity, even when no one is watching, and even when doing the right thing leads to temporary suffering."
                    ]
                },
                {
                    title: "God’s Timing is Perfect",
                    bullets: [
                        "The Lesson: A new beginning often requires waiting. God’s timeline is rarely our own, but his delays are designed to prepare us for the responsibility of the promotion.",
                        "Joseph’s Example: Joseph spent 13 long years in slavery and prison before becoming prime minister at age 30.",
                        "Application: Do not become weary in well-doing; wait patiently for God’s appointed time, knowing that he has not forgotten you."
                    ]
                },
                {
                    title: "Forgiveness is the Key to Freedom",
                    bullets: [
                        "The Lesson: Holding onto bitterness locks you in the past, but true forgiveness releases you to embrace the new beginning God has provided.",
                        "Joseph’s Example: Instead of seeking revenge, Joseph forgave his brothers, recognizing that his suffering was part of a larger plan to save many lives.",
                        "Application: Release those who have hurt you, and focus on the purpose God has for you rather than the pain others caused you."
                    ]
                },
                {
                    title: "God’s Presence is Your Real Success",
                    bullets: [
                        "The Lesson: True prosperity is not determined by material possessions, but by the presence of God in your life, regardless of whether you are in a prison or a palace.",
                        "Joseph’s Example: “The Lord was with Joseph, and he was a successful man” (Gen. 39:2) — this was said while he was a slave in Potiphar’s house.",
                        "Application: Focus on your relationship with God rather than your circumstances, knowing that his presence makes you successful in his eyes."
                    ]
                }
            ],

            closing: "With great joy, i welcome you all again into another Year themed A BRAND NEW BEGINNING."
        }
    ];

    const activeArticleData = articles.find(a => a.id === activeArticle);

    return (
        <section id="pastors-corner" className="section pastors-corner-section">
            <div className="pastors-header">
                <div className="pastors-header-content">
                    <h1 className="pastors-title">PASTOR'S CORNER</h1>
                    <p className="pastors-subtitle">2026 - A Brand New Beginning.</p>
                </div>
            </div>

            <div className="container">
                {articles.map((article) => (
                    <div key={article.id} className="article-card">
                        <div className="article-preview">
                            <div className="preview-header">
                                <span className="article-category">{article.category}</span>
                                <h2 className="article-title">{article.title}</h2>
                                <p className="article-scripture">{article.scripture}</p>
                            </div>
                            {/*<div className="preview-content">*/}
                            {/*    <p className="preview-excerpt">{article.excerpt}</p>*/}
                            {/*</div>*/}
                            <div className="preview-content">
                                <h4 className="preview-intro-heading">INTRODUCTION</h4>
                                <p className="preview-excerpt">{article.intro.text}</p>
                            </div>
                            <button className="btn-read-full" onClick={() => setActiveArticle(article.id)}>
                                <span>📖</span> Read Full Article <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full Article Modal */}
            {activeArticleData && (
                <div className="article-modal-overlay" onClick={() => setActiveArticle(null)}>
                    <div className="article-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveArticle(null)} aria-label="Close">✕</button>

                        <div className="modal-article-header">
                            <span className="article-category">{activeArticleData.category}</span>
                            <h2 className="article-title">{activeArticleData.title}</h2>
                            <div className="article-divider"></div>
                            <p className="article-scripture">{activeArticleData.scripture}</p>
                        </div>

                        <div className="modal-article-body">

                            {/* 1. INTRODUCTION - This is where the text is rendered */}
                            <div className="intro-section">
                                <h3 className="intro-heading">INTRODUCTION</h3>
                                <p className="intro-text">{activeArticleData.intro.text}</p>
                            </div>

                            {/* 2. FIRST SET OF POINTS */}
                            <div className="content-block first-points-block">
                                {activeArticleData.firstPoints.map((point, idx) => (
                                    <div key={idx} className="point-card simple-point">
                                        <h4 className="point-title">{point.title}</h4>
                                        {point.content && <p className="point-text">{point.content}</p>}
                                        {point.bullets && (
                                            <ul className="point-bullets">
                                                {point.bullets.map((bullet, bIdx) => (
                                                    <li key={bIdx}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 3. PREFACE / BADGE SECTION */}
                            <div className="content-block preface-block">
                                <h3 className="preface-main-heading">{activeArticleData.prefaceSection.mainHeading}</h3>

                                <div className="preface-content-wrapper">
                                    {/*<span className="preface-badge">{activeArticleData.prefaceSection.badge}</span>*/}
                                    <p className="preface-preamble">{activeArticleData.prefaceSection.preamble}</p>
                                </div>

                                <p className="preface-sub-heading">{activeArticleData.prefaceSection.subHeading}</p>
                            </div>

                            {/* 4. DETAILED LESSONS (1 to 5) */}
                            <div className="content-block detailed-lessons-block">
                                {activeArticleData.detailedLessons.map((lesson, idx) => (
                                    <div key={idx} className="point-card detailed-point">
                                        <h4 className="point-title">{lesson.title}</h4>
                                        <ul className="point-bullets">
                                            {lesson.bullets.map((bullet, bIdx) => (
                                                <li key={bIdx}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            {/* CLOSING */}
                            <div className="content-block closing-block">
                                <p className="closing-text">{activeArticleData.closing}</p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
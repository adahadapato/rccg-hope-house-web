export default function RegularServices() {
    return (
        <section id="services" className="section regular-services-section">
            <div className="container">
                <div className="services-header">
                    <div className="services-title-block">
                        <span className="section-tag">WORSHIP WITH US</span>
                        <h2 className="section-title">Our Services</h2>
                        <div className="title-divider-left"></div>
                        <p className="services-subtitle">Join us for these regular gatherings</p>
                    </div>
                </div>

                <div className="services-grid">
                    {/* Sunday Services */}
                    <div className="service-category">
                        <div className="service-category-icon">⛪</div>
                        <h3>Sunday Services</h3>
                        <div className="service-items">
                            <div className="service-item">
                                <h4>Sunday School</h4>
                                <p className="service-time">10:00 AM - 11:00 AM</p>
                            </div>
                            <div className="service-item">
                                <h4>Worship Service</h4>
                                <p className="service-time">11:00 AM - 12:40 PM</p>
                                <p className="service-note">Physical Service</p>
                            </div>
                            <div className="service-item">
                                <h4>Thanksgiving Sunday</h4>
                                <p className="service-note">First Sunday of every month</p>
                                <p className="service-note">11:00 AM - 12:45 PM</p>
                            </div>
                        </div>
                    </div>

                    {/* Wednesday Service */}
                    <div className="service-category">
                        <div className="service-category-icon">🙏</div>
                        <h3>Wednesday Service</h3>
                        <div className="service-items">
                            <div className="service-item">
                                <h4>Fasting and Prayer Day</h4>
                                <p className="service-time">Prayer Meeting</p>
                                <p className="service-time">7:00 PM - 7:40 PM</p>
                                <p className="service-note">Online Prayer</p>
                                <p className="service-note">Zoom ID 833 483 0396</p>
                            </div>
                        </div>
                    </div>

                    {/* Monthly & Special Services */}
                    <div className="service-category">
                        <div className="service-category-icon">📅</div>
                        <h3>Monthly & Special</h3>
                        <div className="service-items">
                            <div className="service-item">
                                <h4>Last Friday of the Month</h4>
                                <p className="service-time">End of Month Vigil</p>
                                <p className="service-time">10:00 PM - 1:00 AM</p>
                            </div>
                            <div className="service-item">
                                <h4>Every Fortnight Saturdays</h4>
                                <p className="service-time">Evangelism</p>
                                <p className="service-time">1:00 PM - 2:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="services-additional">
                    <div className="additional-card">
                        <div className="additional-icon">🏠</div>
                        <div>
                            <h4>House Fellowship</h4>
                            <p>6:00 PM - 7:00 PM (Except 1st Sunday of the month)</p>
                            <p className="service-note">Online on Zoom ID</p>
                            <p className="service-note">833 483 0396 PASSCODE = 333</p>
                        </div>
                    </div>

                    <div className="additional-card">
                        <div className="additional-icon">📍</div>
                        <div>
                            <h4>Church Address</h4>
                            <p>230 Burnt Oak Broadway, Edgware.<br />HA8 0AP</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
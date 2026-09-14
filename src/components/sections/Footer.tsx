export default function Footer() {
    return (
        <footer className="footer-modern">
            <div className="container">
                <div className="footer-grid-modern">
                    <div className="footer-brand-modern">
                        <img src="/rccg-logo.png" alt="RCCG Logo" className="footer-logo" />
                        <p>A place of hope, faith, and transformation in the heart of London.</p>
                        <div className="social-links">
                            <a href="#" className="social-link">f</a>
                            <a href="#" className="social-link">in</a>
                            <a href="#" className="social-link">yt</a>
                            <a href="#" className="social-link">ig</a>
                        </div>
                    </div>
                    <div className="footer-links-modern">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#events">Events</a></li>
                            <li><a href="#prayer">Prayer</a></li>
                        </ul>
                    </div>
                    <div className="footer-links-modern">
                        <h4>Ministries</h4>
                        <ul>
                            <li><a href="#">Children</a></li>
                            <li><a href="#">Youth</a></li>
                            <li><a href="#">Women</a></li>
                            <li><a href="#">Men</a></li>
                        </ul>
                    </div>
                    <div className="footer-links-modern">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Give Online</a></li>
                            <li><a href="#">Bible Study</a></li>
                            <li><a href="#">Podcast</a></li>
                            <li><a href="#">Newsletter</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom-modern">
                    <p>&copy; {new Date().getFullYear()} RCCG Hope House Parish. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
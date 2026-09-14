//export default function PrayerCta() {
//    return (
//        <section id="prayer" className="section prayer-cta-modern">
//            <div className="prayer-bg-pattern"></div>
//            <div className="container">
//                <div className="prayer-content-modern">
//                    <div className="prayer-icon-modern"></div>
//                    <h2 className="prayer-title">How Can We Pray for You?</h2>
//                    <p className="prayer-description">Our prayer team is standing by to intercede on your behalf. Share your prayer requests with us, and let's lift them up together.</p>
//                    <div className="prayer-buttons-modern">
//                        <button className="btn-white btn-large">Submit Prayer Request</button>
//                        <button className="btn-outline-white btn-large">Join Prayer Team</button>
//                    </div>
//                </div>
//            </div>
//        </section>
//    );
//}

import { useState } from 'react';
import PrayerForm from './PrayerForm';

export default function PrayerCta() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <>
            <section id="prayer" className="section prayer-cta-modern">
                <div className="prayer-bg-pattern"></div>
                <div className="container">
                    <div className="prayer-content-modern">
                        <div className="prayer-icon-modern">🙏</div>
                        <h2 className="prayer-title">How Can We Pray for You?</h2>
                        <p className="prayer-description">
                            Our prayer team is standing by to intercede on your behalf.
                            Share your prayer requests with us, and let's lift them up together.
                        </p>
                        <div className="prayer-buttons-modern">
                            <button
                                className="btn-white btn-large"
                                onClick={() => setIsFormOpen(true)}
                            >
                                Submit Prayer Request
                            </button>
                            <button className="btn-outline-white btn-large">
                                Join Prayer Team
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Modal is rendered here */}
            <PrayerForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
            />
        </>
    );
}
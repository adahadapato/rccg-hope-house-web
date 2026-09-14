

import Navigation from '../components/sections/Navigation';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Beliefs from '../components/sections/Beliefs';
{/*import Vision from '../components/sections/Vision';
import Mission from '../components/sections/Mission';*/}

import VisionMission from '../components/sections/VisionMission';
import Welcome from '../components/sections/Welcome';
import PhotoGallery from '../components/sections/PhotoGallery';
import RegularServices from '../components/sections/RegularServices';
import MonthlyServices from '../components/sections/MonthlyServices';
import DailyDevotional from '../components/sections/DailyDevotional';
import Events from '../components/sections/Events';
import ThemeOfTheYear from '../components/sections/ThemeOfTheYear';
import Prophecies from '../components/sections/Prophecies';
import AnnualPrayerPoints from '../components/sections/AnnualPrayerPoints';
import PastorsCorner from '../components/sections/PastorsCorner';
import PrayerCta from '../components/sections/PrayerCta';
import Contact from '../components/sections/Contact';
import Footer from '../components/sections/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <Hero />
            <About />
            <Beliefs />
            {/*<Vision />
            <Mission />*/}
            
            <VisionMission />
            <Welcome />
            <PhotoGallery />
            <RegularServices /> 
            <MonthlyServices /> 
            <DailyDevotional />
            <Events />
            <ThemeOfTheYear />
            <Prophecies />
            <AnnualPrayerPoints /> 
            <PastorsCorner />
            <PrayerCta />
            <Contact />
            <Footer />
        </div>
    );
}
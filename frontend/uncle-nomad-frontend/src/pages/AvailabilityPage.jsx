import { useEffect } from "react"
import AnimatedSection from "../components/AnimatedSection"
import AvailabilitySection from "../components/AvailabilitySection"
import Footer from "../components/Footer"
import Header from "../components/Header"
import AvailableRooms from "../components/AvailableRooms"

const AvailabilityPage = ()=>{
    useEffect(()=>{
        window.scrollTo(0,0)
    },[])

    return (
        <AnimatedSection animation="slide-up" duration={1000}>
            <Header/>
            <AvailabilitySection />
            <Footer/>
        </AnimatedSection>
    )
}

export default AvailabilityPage
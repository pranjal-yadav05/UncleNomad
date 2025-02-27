import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const AnimatedCounter = ({ targetNumber, duration = 2 }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const counterRef = useRef(null);
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );
  
      if (counterRef.current) {
        observer.observe(counterRef.current);
      }
  
      return () => observer.disconnect();
    }, []);
  
    useEffect(() => {
      if (!isVisible) return;
      let start = 0;
      const increment = targetNumber / (duration * 60);
      const interval = setInterval(() => {
        start += increment;
        if (start >= targetNumber) {
          setCount(targetNumber);
          clearInterval(interval);
        } else {
          setCount(Math.ceil(start));
        }
      }, 1000 / 60);
  
      return () => clearInterval(interval);
    }, [isVisible, targetNumber, duration]);
  
    return (
      <motion.div
        ref={counterRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-blue-600"
      >
        {count}
      </motion.div>
    );
  };

export default AnimatedCounter
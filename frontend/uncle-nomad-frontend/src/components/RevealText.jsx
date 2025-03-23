import { useRef, useEffect } from "react";
import { motion, useInView, useAnimate } from "framer-motion";

export default function RevealText({
  text,
  className = "",
  once = true,
  threshold = 0.1,
  delay = 0,
  duration = 0.5,
  staggerChildren = 0.03,
  tag = "h2",
  animation = "slide-up",
  color = "",
  glow = false,
  highlightWords = [],
}) {
  const ref = useRef(null);
  const [scope, animate] = useAnimate();

  // Reduced negative margin for less aggressive early animation
  const isInView = useInView(ref, {
    once,
    threshold,
    margin: "0px 0px -150px 0px", // Reduced from -300px to -150px for smoother triggering
  });

  // Use effect to manually control animation when in view
  useEffect(() => {
    if (isInView && ref.current) {
      // Only manipulate style if element exists
      ref.current.style.opacity = "1";
    }
  }, [isInView]);

  // Split text into words - limit to 20 words max for performance
  const words = text.split(" ").slice(0, 20);

  // Simplified container animation
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delay * i,
        staggerDirection: animation === "wave" ? -1 : 1,
        duration: 0.15, // Even faster container animation
      },
    }),
  };

  // Get child animation based on animation type - simplified for performance
  const getChildAnimation = () => {
    // Common spring config
    const springConfig = {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.8,
      restDelta: 0.01,
    };

    switch (animation) {
      case "fade":
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              duration,
              type: "tween",
              ease: "easeOut",
            },
          },
        };
      case "zoom":
        return {
          hidden: { opacity: 0, scale: 0.7 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              ...springConfig,
              duration,
            },
          },
        };
      case "bounce":
        return {
          hidden: { opacity: 0, y: 15 }, // Reduced y offset
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              ...springConfig,
              stiffness: 200,
              damping: 12,
              duration,
            },
          },
        };
      case "wave":
        return {
          hidden: { opacity: 0, y: 10, rotate: -2 }, // Reduced values
          visible: {
            opacity: 1,
            y: 0,
            rotate: 0,
            transition: {
              ...springConfig,
              stiffness: 70,
              duration,
            },
          },
        };
      case "slide-up":
      default:
        return {
          hidden: {
            opacity: 0,
            y: 15, // Reduced y offset
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              ...springConfig,
              duration,
            },
          },
        };
    }
  };

  const child = getChildAnimation();
  const Tag = tag;

  // Generate word style based on options - simplified for performance
  const getWordStyle = (word) => {
    const isHighlighted = highlightWords.includes(word);

    return {
      display: "inline-block",
      marginRight: "0.25em",
      fontWeight: isHighlighted ? "bold" : "inherit",
      color: isHighlighted && color ? "inherit" : "",
      textShadow: glow ? "0 0 10px rgba(148, 130, 255, 0.5)" : "none", // Reduced glow strength
    };
  };

  // Create gradient text class if color is specified
  const gradientTextClass = color
    ? "text-transparent bg-clip-text bg-gradient-to-r " + color
    : "";

  return (
    <Tag className={`${className} ${gradientTextClass}`}>
      <motion.span
        ref={ref}
        style={{ display: "inline-block", willChange: "opacity" }} // Simplified willChange
        variants={container}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        onViewportEnter={() => {
          // Simplified animation forcing logic
          if (scope.current) {
            animate(scope.current, { opacity: 1 }, { duration: 0.1 });
          }
        }}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            ref={scope}
            variants={child}
            style={getWordStyle(word)}
            whileHover={{
              scale: 1.05, // Reduced hover scale
              transition: { duration: 0.1 }, // Faster hover
            }}>
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}

"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function ParallaxBackground({
  children,
  backgroundImage,
  speed = 0.5,
  overlay = true,
  overlayOpacity = 0.5,
  className = "",
}) {
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 30}%`])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Parallax Background */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          y: backgroundY,
          willChange: "transform",
        }}
      />

      {/* Optional overlay */}
      {overlay && <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}


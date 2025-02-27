"use client"

import { useEffect, useRef, useState } from "react"

export default function FadeInSection({ children, threshold = 0.1 }) {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // When the element enters the viewport
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          // Once it's visible, we don't need to observe it anymore
          observer.unobserve(domRef.current)
        }
      },
      { threshold }
    )

    const currentRef = domRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold])

  return (
    <div
      ref={domRef}
      className={`transition-opacity duration-1000 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  )
}
"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function VersionSwitcher({ versions, defaultVersion }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion)

  const toggleDropdown = () => setIsOpen(!isOpen)

  const selectVersion = (version) => {
    setSelectedVersion(version)
    setIsOpen(false)
  }

  return (
    <div className="relative mb-4">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-4 py-2 text-blue-800 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <span>Version: {selectedVersion}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-600 rounded-lg shadow-lg">
          <ul>
            {versions.map((version) => (
              <li key={version}>
                <button
                  onClick={() => selectVersion(version)}
                  className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                    version === selectedVersion ? "bg-blue-100 font-medium" : ""
                  }`}
                >
                  {version}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}


"use client"

import { useState } from "react"
import { Search } from "lucide-react"

export function SearchForm() {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    // Implement search functionality here
    console.log("Searching for:", searchTerm)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search gallery..."
          className="w-full h-10 pl-10 pr-4 text-blue-800 bg-white border-2 border-blue-600 rounded-full focus:outline-none focus:border-blue-700"
        />
        <button type="submit" className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="w-5 h-5 text-blue-600" />
        </button>
      </div>
    </form>
  )
}


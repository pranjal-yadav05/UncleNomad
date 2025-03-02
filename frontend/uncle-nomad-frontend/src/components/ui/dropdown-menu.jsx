"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Button } from "./button"

const DropdownMenu = ({ children }) => {
  return (
    <DropdownMenuPrimitive.Root>
      {children}
    </DropdownMenuPrimitive.Root>
  )
}

const DropdownMenuTrigger = ({ children }) => (
    <DropdownMenuPrimitive.Trigger asChild>
      {children}
    </DropdownMenuPrimitive.Trigger>
  )
  
const DropdownMenuContent = ({ children }) => (
  <DropdownMenuPrimitive.Content
    align="start"
    side="bottom"
    className="z-50 w-56 mt-2 origin-top-left rounded-md border bg-white shadow-lg"
  >
    <div className="py-1">{children}</div>
  </DropdownMenuPrimitive.Content>
)

const DropdownMenuItem = ({ children, className }) => (
  <DropdownMenuPrimitive.Item
    className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md ${className}`}
  >
    {children}
  </DropdownMenuPrimitive.Item>
)

const DropdownMenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="my-1 border-t border-gray-200" />
)

const DropdownMenuArrow = () => (
  <DropdownMenuPrimitive.Arrow className="fill-current text-white" />
)

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuArrow }

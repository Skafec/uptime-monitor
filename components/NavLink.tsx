'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function NavLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  const pathname = usePathname()
  // Highlight when on this route (or a sub-route). External links (e.g. the
  // public status page opened in a new tab) never show as active.
  const active = !external && (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      aria-current={active ? 'page' : undefined}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 font-medium'
          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  )
}

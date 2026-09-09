import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "WEB3 UNO · Next.js",
  description: "Assignment 6 SSR adaptation of the WEB3 UNO multiplayer application",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><nav className="site-nav"><Link href="/">UNO</Link><div><Link href="/rules">Rules</Link><Link href="/play">Play</Link></div></nav>{children}</body></html>
}

"use client"

import { useEffect } from "react"
import Header from "@/components/Layout/Header"
import Footer from "@/components/Layout/Footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 뒤로가기 비활성화 - 로그인 페이지로 돌아가는 것을 방지
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, LogOut, LogIn, Calculator, LayoutDashboard } from "lucide-react"
import { useTranslation } from "@/lib/hooks/useTranslation"
import Link from "next/link"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage, languages } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      setIsLoading(false)
    }
    checkAuth()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/calculator")
  }

  const handleLogin = () => {
    router.push("/auth/signin")
  }

  // 비로그인 시 계산기만, 로그인 시 대시보드도 표시
  const tabs = [
    { href: "/calculator", label: t("calculator") || "계산기", icon: Calculator },
    ...(isLoggedIn ? [{ href: "/dashboard", label: t("dashboard") || "대시보드", icon: LayoutDashboard }] : []),
  ]

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/gme-logo.png"
              alt="GME Finance"
              className="h-9 w-auto"
            />
            <div className="hidden sm:block border-l pl-3 border-gray-200">
              <p className="text-sm font-medium text-gray-700">{t("title")}</p>
              <p className="text-xs text-gray-500">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">{languages.find(l => l.code === language)?.nativeName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-red-50 text-red-600' : ''}
                  >
                    {lang.nativeName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {isLoggedIn ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{t("logout")}</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLogin} className="gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{t("login") || "로그인"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${isActive
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

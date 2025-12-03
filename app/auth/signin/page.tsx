"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, ChevronDown } from "lucide-react"
import AuthLeftPanel from "@/components/Auth/AuthLeftPanel"
import LanguageSelector from "@/components/LanguageSelector"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/hooks/useTranslation"

const CORRIDORS = [
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
]

export default function SignInPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showMicrosoftCountrySelect, setShowMicrosoftCountrySelect] = useState(false)
  const [microsoftCorridor, setMicrosoftCorridor] = useState("")
  const [isMicrosoftCorridorOpen, setIsMicrosoftCorridorOpen] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace("/calculator")
      } else {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  // Show nothing while checking auth
  if (isCheckingAuth) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError(t("authErrorEmptyFields"))
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        router.replace("/calculator")
      }
    } catch (err) {
      setError(t("authErrorGeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftButtonClick = () => {
    setError("")
    setShowMicrosoftCountrySelect(true)
  }

  const handleMicrosoftCorridorSelect = (code: string) => {
    setMicrosoftCorridor(code)
    setIsMicrosoftCorridorOpen(false)
  }

  const selectedMicrosoftCorridor = CORRIDORS.find((c) => c.code === microsoftCorridor)

  const handleMicrosoftLogin = async () => {
    if (!microsoftCorridor) {
      setError(t("authErrorAllFields"))
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // localStorage에 corridor 저장 (콜백에서 사용)
      localStorage.setItem("pending_corridor", microsoftCorridor)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile openid',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        localStorage.removeItem("pending_corridor")
        setIsLoading(false)
      }
    } catch (err) {
      setError(t("authErrorMicrosoftFailed"))
      localStorage.removeItem("pending_corridor")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white px-8">
        {/* Language Selector */}
        <div className="flex justify-end pt-4">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t("authLogin")}</h2>
              <p className="text-gray-500 mt-2">
                {t("authLoginDesc")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {t("authEmail")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  {t("authPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium text-base"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("authLoggingIn")}
                  </span>
                ) : (
                  t("authLoginButton")
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
              <Link href="/auth/forgot-password" className="text-gray-500 hover:text-gray-700">
                {t("authForgotPassword")}
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/auth/signup" className="text-red-500 hover:text-red-600 font-medium">
                {t("authSignup")}
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t("authOrContinueWith")}</span>
              </div>
            </div>

            {/* Microsoft Login */}
            {!showMicrosoftCountrySelect ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftButtonClick}
                className="w-full h-12 border-gray-300 hover:bg-gray-50 font-medium"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {t("authSignInWithMicrosoft")}
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  <span className="font-medium text-gray-700">{t("authSignInWithMicrosoft")}</span>
                </div>

                {/* Microsoft용 Country Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium mt-3">
                    {t("authCountry")} <span className="text-red-500">{t("authRequired")}</span>
                  </Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMicrosoftCorridorOpen(!isMicrosoftCorridorOpen)}
                      className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      {selectedMicrosoftCorridor ? (
                        <span className="flex items-center gap-2">
                          <span>{selectedMicrosoftCorridor.flag}</span>
                          <span>{selectedMicrosoftCorridor.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">{t("authSelectCountry")}</span>
                      )}
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isMicrosoftCorridorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMicrosoftCorridorOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {CORRIDORS.map((corridor) => (
                          <button
                            key={corridor.code}
                            type="button"
                            onClick={() => handleMicrosoftCorridorSelect(corridor.code)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span>{corridor.flag}</span>
                            <span>{corridor.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowMicrosoftCountrySelect(false)
                      setMicrosoftCorridor("")
                    }}
                    className="flex-1 h-10"
                  >
                    {t("authCancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    disabled={!microsoftCorridor || isLoading}
                    className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </span>
                    ) : (
                      t("authLoginButton")
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Footer */}
            <p className="lg:hidden mt-8 text-center text-xs text-gray-400">
              {t("authCopyright")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

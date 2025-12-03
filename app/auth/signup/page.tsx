"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, ChevronDown, Lock, CheckCircle } from "lucide-react"
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

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    corridor: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCorridorOpen, setIsCorridorOpen] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCorridorSelect = (code: string) => {
    setFormData({ ...formData, corridor: code })
    setIsCorridorOpen(false)
  }

  const selectedCorridor = CORRIDORS.find((c) => c.code === formData.corridor)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.corridor) {
      setError(t("authErrorAllFields"))
      setIsLoading(false)
      return
    }

    // 이메일 사용자명 검증 (영문, 숫자, 점, 하이픈, 언더스코어만 허용)
    const emailUsernameRegex = /^[a-zA-Z0-9._-]+$/
    if (!emailUsernameRegex.test(formData.email)) {
      setError(t("authErrorEmailFormat"))
      setIsLoading(false)
      return
    }

    // 전체 이메일 주소 생성
    const fullEmail = `${formData.email}@gmeremit.com`

    if (formData.password !== formData.confirmPassword) {
      setError(t("authErrorPasswordMismatch"))
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError(t("authErrorPasswordLength"))
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: fullEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            corridor: formData.corridor,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // profiles 테이블은 Supabase 트리거가 자동으로 처리
        setSuccess(t("authSuccessAccountCreated"))
        setTimeout(() => {
          router.push("/auth/signin")
        }, 3000)
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

  const handleMicrosoftSignup = async () => {
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

  const selectedMicrosoftCorridor = CORRIDORS.find((c) => c.code === microsoftCorridor)

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white px-8 py-4">
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t("authSignup")}</h2>
              <p className="text-gray-500 mt-2">
                {t("authSignupDesc")}
              </p>
            </div>

            {/* Microsoft Signup */}
            {!showMicrosoftCountrySelect ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftButtonClick}
                className="w-full h-12 border-gray-300 hover:bg-gray-50 font-medium mb-4"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {t("authSignUpWithMicrosoft")}
              </Button>
            ) : (
              <div className="space-y-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  <span className="font-medium text-gray-700">{t("authSignUpWithMicrosoft")}</span>
                </div>

                {/* Microsoft용 Country Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
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
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMicrosoftSignup}
                    disabled={!microsoftCorridor || isLoading}
                    className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </span>
                    ) : (
                      t("authSignupButton")
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t("authOrRegisterWith")}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  {t("authFullName")} <span className="text-red-500">{t("authRequired")}</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {t("authEmail")} <span className="text-red-500">{t("authRequired")}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="username"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="username"
                    className="h-11 flex-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-400 text-lg font-medium">@</span>
                  <div className="flex-2 h-11 px-3 flex items-center justify-between bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
                    <span className="text-gray-500 font-medium text-sm">gmeremit.com</span>
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {t("authCompanyEmailOnly")}
                </p>
              </div>

              {/* Corridor Selection */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  {t("authCountry")} <span className="text-red-500">{t("authRequired")}</span>
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCorridorOpen(!isCorridorOpen)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  >
                    {selectedCorridor ? (
                      <span className="flex items-center gap-2">
                        <span>{selectedCorridor.flag}</span>
                        <span>{selectedCorridor.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">{t("authSelectCountry")}</span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCorridorOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCorridorOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {CORRIDORS.map((corridor) => (
                        <button
                          key={corridor.code}
                          type="button"
                          onClick={() => handleCorridorSelect(corridor.code)}
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  {t("authPassword")} <span className="text-red-500">{t("authRequired")}</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 pr-12"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  {t("authConfirmPassword")} <span className="text-red-500">{t("authRequired")}</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium text-base mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("authCreatingAccount")}
                  </span>
                ) : (
                  t("authSignupButton")
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm mt-4 text-gray-600">
              {t("authAlreadyHaveAccount")}{" "}
              <Link href="/auth/signin" className="text-red-500 hover:text-red-600 font-medium">
                {t("authLoginButton")}
              </Link>
            </p>

            {/* Mobile Footer */}
            <p className="lg:hidden mt-6 text-center text-xs text-gray-400">
              {t("authCopyright")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

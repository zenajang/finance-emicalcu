"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react"
import AuthLeftPanel from "@/components/Auth/AuthLeftPanel"
import LanguageSelector from "@/components/LanguageSelector"
import { useTranslation } from "@/lib/hooks/useTranslation"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email) {
      setError(t("authErrorEmptyEmail"))
      setIsLoading(false)
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t("authErrorInvalidEmail"))
      setIsLoading(false)
      return
    }

    // TODO: 실제 비밀번호 재설정 API 연동
    setTimeout(() => {
      setSuccess(true)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white px-8">
        {/* Language Selector */}
        <div className="flex justify-end pt-4">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-red-500">GME Finance</h1>
            <p className="text-sm text-gray-500">Global Financial Solutions</p>
          </div>

          {/* Back Button */}
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("authBackToLogin")}
          </Link>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t("authResetPassword")}</h2>
            <p className="text-gray-500 mt-2">
              {t("authResetPasswordDesc")}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {t("authResetLinkSent")} <strong>{email}</strong>.
                  {t("authCheckInbox")}
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">
                  {t("authCheckSpam")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  className="w-full"
                >
                  {t("authTryAnotherEmail")}
                </Button>
                <Link href="/auth/signin">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full">
                    {t("authReturnToLogin")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium text-base"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("authSendingResetLink")}
                  </span>
                ) : (
                  t("authSendResetLink")
                )}
              </Button>
            </form>
          )}

          {/* Links */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <span className="text-gray-500">{t("authRememberPassword")}</span>
            <Link href="/auth/signin" className="text-red-500 hover:text-red-600 font-medium">
              {t("authLoginButton")}
            </Link>
          </div>

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

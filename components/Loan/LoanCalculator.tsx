"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useTranslation } from "@/lib/hooks/useTranslation"
import { type Language } from "@/lib/i18n/translations"
import { format } from "date-fns"
import { enUS, ko, th, ru, zhCN, vi, id as idLocale, bn, hi, type Locale } from "date-fns/locale"
import { cn } from "@/lib/utils"
import LoanResultCard from "./LoanResultCard"

const INTEREST_RATE = 0.2 / 12
const CAPACITY = 550000

// 상수로 분리 (useState 불필요)
const LOAN_AMOUNTS = Array.from({ length: 39 }, (_, i) => (i + 2) * 1000000) // 2,000,000 ~ 40,000,000
const LOAN_DURATIONS = Array.from({ length: 178 }, (_, i) => i + 3) // 3 ~ 180

interface PaymentScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

const dateFnsLocales: Record<Language, Locale> = {
  en: enUS,
  ko: ko,
  my: enUS, // Myanmar - fallback to English
  si: enUS, // Sinhala - fallback to English
  id: idLocale,
  km: enUS, // Khmer - fallback to English
  ne: enUS, // Nepali - fallback to English (ne locale not available in date-fns)
  bn: bn,
  th: th,
  uz: enUS, // Uzbek - fallback to English
  vi: vi,
  zh: zhCN,
  hi: hi,
  mn: enUS, // Mongolian - fallback to English
  ru: ru,
  ur: enUS, // Urdu - fallback to English
  us: enUS  // United States
}

// 전화번호 자동 포맷팅 (01012345678 → 010-1234-5678)
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '') // 숫자만 추출
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

export default function LoanCalculator() {
  const searchParams = useSearchParams()
  const { t, language, languageLocales } = useTranslation()

  // 마운트 상태
  const [mounted, setMounted] = useState(false)

  // 비자/대출 입력
  const [visaExpiry, setVisaExpiry] = useState("")
  const [visaExpiryDate, setVisaExpiryDate] = useState<Date>()
  const [selectedLoanAmount, setSelectedLoanAmount] = useState<number | null>(null)
  const [loanDuration, setLoanDuration] = useState("")

  // 고객 정보 (그룹화)
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: ""
  })

  // 담당자 정보 (그룹화)
  const [manager, setManager] = useState({
    name: "",
    contact: "",
    corridor: ""  // 담당자 국적
  })

  // UI 상태 (그룹화)
  const [uiState, setUiState] = useState({
    isCalendarOpen: false,
    showTable: false,
    isTableUnlocked: false,
    showSchedule: true,
    showWarning: false
  })

  // 계산 결과
  const [loanResult, setLoanResult] = useState({
    maxDuration: 0,
    contractEnd: "",
    maxLoanAmount: 0,
    maxLoanEMI: 0
  })

  // 테이블 데이터
  const [tableData, setTableData] = useState<any[]>([])
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])

  useEffect(() => {
    setMounted(true)

    // 로그인한 사용자의 corridor 가져오기
    const fetchUserCorridor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log("Current user:", user?.id)

      if (user) {
        // Microsoft OAuth로 가입한 경우 localStorage에서 pending_corridor 확인
        const pendingCorridor = localStorage.getItem("pending_corridor")
        if (pendingCorridor) {
          console.log("Found pending corridor:", pendingCorridor)

          // user_metadata 업데이트
          await supabase.auth.updateUser({
            data: { corridor: pendingCorridor }
          })

          // profiles 테이블 업데이트
          await supabase
            .from("profiles")
            .update({ corridor: pendingCorridor })
            .eq("id", user.id)

          // localStorage에서 삭제
          localStorage.removeItem("pending_corridor")

          setManager(prev => ({ ...prev, corridor: pendingCorridor }))
          return
        }

        // 먼저 profiles 테이블에서 corridor 확인
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("corridor")
          .eq("id", user.id)
          .single()

        console.log("Profile data:", profile)
        console.log("Profile error:", error)

        if (profile?.corridor) {
          console.log("Setting corridor from profile:", profile.corridor)
          setManager(prev => ({ ...prev, corridor: profile.corridor }))
        } else if (user.user_metadata?.corridor) {
          // profiles에 없으면 user_metadata에서 가져오기
          console.log("Setting corridor from user_metadata:", user.user_metadata.corridor)
          setManager(prev => ({ ...prev, corridor: user.user_metadata.corridor }))
        } else {
          console.log("No corridor found in profile or user_metadata!")
        }
      }
    }
    fetchUserCorridor()

    // Read URL parameters and set initial values
    const visaParam = searchParams.get('visa')
    const durationParam = searchParams.get('duration')
    const nameParam = searchParams.get('name')
    const contactParam = searchParams.get('contact')

    if (visaParam) {
      setVisaExpiry(visaParam)
      const date = new Date(visaParam)
      if (!isNaN(date.getTime())) {
        setVisaExpiryDate(date)
      }
    }

    if (durationParam) {
      setLoanDuration(durationParam)
    }

    if (nameParam) {
      setManager(prev => ({ ...prev, name: decodeURIComponent(nameParam) }))
    }

    if (contactParam) {
      setManager(prev => ({ ...prev, contact: decodeURIComponent(contactParam) }))
    }

  }, [])

  useEffect(() => {
    if (visaExpiry) {
      updateCalculations()
      generateTableData()
    }
  }, [visaExpiry, selectedLoanAmount, loanDuration, language])

  useEffect(() => {
    if (selectedLoanAmount && loanDuration) {
      generatePaymentSchedule()
    }
  }, [selectedLoanAmount, loanDuration])


  const formatDate = (date: Date): string => {
    const locale = languageLocales[language] || 'en-US'
    try {
      // Check if locale is supported by creating a formatter
      const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Get the resolved locale
      const resolvedLocale = formatter.resolvedOptions().locale

      // If resolved locale is different from requested (except language variants), fallback to English
      const requestedLang = locale.split('-')[0]
      const resolvedLang = resolvedLocale.split('-')[0]

      if (requestedLang === resolvedLang) {
        return formatter.format(date)
      }

      // Fallback to English
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      // Fallback to English if locale is not supported
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatCurrency = (amount: number): string => {
    const locale = languageLocales[language] || 'en-US'
    try {
      const formatter = new Intl.NumberFormat(locale)
      const resolvedLocale = formatter.resolvedOptions().locale

      const requestedLang = locale.split('-')[0]
      const resolvedLang = resolvedLocale.split('-')[0]

      if (requestedLang === resolvedLang) {
        return formatter.format(amount)
      }

      // Fallback to English
      return new Intl.NumberFormat('en-US').format(amount)
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.NumberFormat('en-US').format(amount)
    }
  }

  const PMT = (rate: number, nper: number, pv: number): number => {
    if (rate === 0) return -pv / nper
    const pvif = Math.pow(1 + rate, nper)
    const pmt = rate * pv * pvif / (pvif - 1)
    return pmt
  }

  const calculateEMI = (loanAmount: number, duration: number): number => {
    const emi = PMT(INTEREST_RATE, duration, loanAmount)
    return Math.ceil(emi / 1000) * 1000
  }

  const getMonthsDifference = (date1: Date, date2: Date): number => {
    let months = (date2.getFullYear() - date1.getFullYear()) * 12
    months += date2.getMonth() - date1.getMonth()
    if (date2.getDate() < date1.getDate()) {
      months--
    }
    return months
  }

  const getThresholdByAmount = (amount: number, type: 'yellow' | 'blue'): number => {
    if (type === 'yellow') {
      const m = amount / 1000000
      if (m <= 8) return 650000
      if (m <= 9) return 670000
      if (m <= 11) return 700000
      if (m <= 12) return 730000
      if (m <= 13) return 730000
      if (m <= 14) return 790000
      if (m <= 15) return 800000
      if (m <= 16) return 820000
      if (m <= 17) return 840000
      if (m <= 18) return 840000
      if (m <= 19) return 860000
      if (m <= 20) return 880000
      if (m <= 25) return 880000
      if (m <= 27) return 890000
      if (m <= 28) return 891000
      if (m <= 29) return 900000
      if (m <= 30) return 905000
      if (m <= 31) return 910000
      if (m <= 32) return 920000
      if (m <= 33) return 925000
      if (m <= 34) return 930000
      if (m <= 35) return 938000
      if (m <= 36) return 950000
      if (m <= 37) return 955000
      if (m <= 38) return 970000
      if (m <= 39) return 975000
      if (m <= 40) return 984000
      return 1000000
    } else {
      const yellowThreshold = getThresholdByAmount(amount, 'yellow')
      return yellowThreshold * 1.2
    }
  }

  const updateCalculations = () => {
    if (!visaExpiry) return

    const today = new Date()
    const visa = new Date(visaExpiry)
    const monthsDiff = getMonthsDifference(today, visa)
    const maxDur = Math.max(0, monthsDiff - 3)

    if (selectedLoanAmount && loanDuration) {
      const duration = parseInt(loanDuration)
      const end = new Date(today)
      end.setMonth(end.getMonth() + duration)

      const emi = calculateEMI(selectedLoanAmount, duration)

      setLoanResult({
        maxDuration: maxDur,
        contractEnd: formatDate(end),
        maxLoanAmount: selectedLoanAmount,
        maxLoanEMI: emi
      })
      setUiState(prev => ({ ...prev, showWarning: duration > maxDur }))
    } else {
      setLoanResult(prev => ({
        ...prev,
        maxDuration: maxDur,
        maxLoanAmount: selectedLoanAmount || 0,
        maxLoanEMI: 0,
        contractEnd: ""
      }))
    }
  }

  const generateTableData = () => {
    const data = LOAN_DURATIONS.map(duration => {
      const row: any = { duration }
      LOAN_AMOUNTS.forEach(amount => {
        const emi = calculateEMI(amount, duration)
        const capacityRatio = Math.round(emi / CAPACITY)
        const yellowThreshold = getThresholdByAmount(amount, 'yellow')
        const blueThreshold = getThresholdByAmount(amount, 'blue')

        let highlight = ''
        if (capacityRatio <= duration) {
          if (emi < yellowThreshold) {
            highlight = 'yellow'
          } else if (emi < blueThreshold) {
            highlight = 'blue'
          }
        }

        row[amount] = { emi, highlight }
      })
      return row
    })
    setTableData(data)
  }

  const generatePaymentSchedule = () => {
    if (!selectedLoanAmount || !loanDuration) return

    const duration = parseInt(loanDuration)
    const monthlyPayment = calculateEMI(selectedLoanAmount, duration)
    let balance = selectedLoanAmount
    const schedule: PaymentScheduleItem[] = []

    for (let month = 1; month <= duration; month++) {
      const interestPayment = balance * INTEREST_RATE
      const principalPayment = monthlyPayment - interestPayment
      balance = balance - principalPayment

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      })
    }

    setPaymentSchedule(schedule)
  }

  const toggleTable = () => {
    if (uiState.showTable) {
      setUiState(prev => ({ ...prev, showTable: false }))
    } else {
      if (!uiState.isTableUnlocked) {
        const password = prompt('상세 대출표를 보려면 비밀번호를 입력하세요:', '')
        if (password === '1234') {
          setUiState(prev => ({ ...prev, isTableUnlocked: true, showTable: true }))
        } else if (password !== null) {
          alert('❌ 비밀번호가 틀렸습니다')
        }
      } else {
        setUiState(prev => ({ ...prev, showTable: true }))
      }
    }
  }

  const getAvailableDurations = () => {
    if (!visaExpiry) return []
    const today = new Date()
    const visa = new Date(visaExpiry)
    const monthsDiff = getMonthsDifference(today, visa)
    const maxDur = Math.max(3, monthsDiff - 3)

    const durations = []
    for (let i = 3; i <= maxDur; i++) {
      durations.push(i)
    }
    return durations
  }

  // 선택 가능한 금액 목록 (비자 만료일 기준)
  const getAvailableLoanAmounts = () => {
    if (!visaExpiry) return []
    const maxDur = loanResult.maxDuration
    if (maxDur < 3) return []

    // 각 금액에 대해 최소 기간(3개월)으로 EMI 계산하여 가능한 금액만 필터링
    return LOAN_AMOUNTS.filter(amount => {
      // 최대 기간으로 EMI 계산 (가장 낮은 EMI)
      const emi = calculateEMI(amount, maxDur)
      const yellowThreshold = getThresholdByAmount(amount, 'yellow')
      const blueThreshold = getThresholdByAmount(amount, 'blue')
      const capacityRatio = Math.round(emi / CAPACITY)

      // 추천(yellow) 또는 중위험(blue) 범위에 들어가는 금액만
      return capacityRatio <= maxDur && emi < blueThreshold
    })
  }

  // 선택한 금액에 대해 가능한 기간 목록
  const getAvailableDurationsForAmount = () => {
    if (!visaExpiry || !selectedLoanAmount) return []
    const today = new Date()
    const visa = new Date(visaExpiry)
    const monthsDiff = getMonthsDifference(today, visa)
    const maxDur = Math.max(3, monthsDiff - 3)

    const durations = []
    for (let i = 3; i <= maxDur; i++) {
      const emi = calculateEMI(selectedLoanAmount, i)
      const yellowThreshold = getThresholdByAmount(selectedLoanAmount, 'yellow')
      const blueThreshold = getThresholdByAmount(selectedLoanAmount, 'blue')
      const capacityRatio = Math.round(emi / CAPACITY)

      // 해당 기간이 유효한 경우만 추가
      if (capacityRatio <= i && emi < blueThreshold) {
        durations.push({
          duration: i,
          emi,
          isRecommended: emi < yellowThreshold
        })
      }
    }
    return durations
  }

  const handleShare = async () => {
    if (!visaExpiry || !loanDuration) {
      alert(t("selectLoanDuration"))
      return
    }

    const params = new URLSearchParams()
    params.set('visa', visaExpiry)
    params.set('duration', loanDuration)
    params.set('lang', language)

    if (manager.name) {
      params.set('name', encodeURIComponent(manager.name))
    }

    if (manager.contact) {
      params.set('contact', encodeURIComponent(manager.contact))
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      alert(t("linkCopied"))
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(t("linkCopied"))
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="space-y-5">

          {/* Main Card */}
          <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b pb-5">
              <CardTitle className="text-xl font-bold text-gray-900">{t("loanInfo")}</CardTitle>
              <CardDescription className="text-gray-500">{t("loanInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Input Fields */}
              <div className="grid gap-5 md:grid-cols-3">
                {/* 1. 비자 만료일 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">{t("visaExpiry")}</Label>
                  <Popover open={uiState.isCalendarOpen} onOpenChange={(open) => setUiState(prev => ({ ...prev, isCalendarOpen: open }))}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal border-gray-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl",
                          !visaExpiryDate && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 text-red-500" />
                        {visaExpiryDate ? (
                          <span className="font-medium text-gray-900">{format(visaExpiryDate, "PPP", { locale: dateFnsLocales[language] })}</span>
                        ) : (
                          <span>{t("pickDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={visaExpiryDate}
                        onSelect={(date) => {
                          setVisaExpiryDate(date)
                          if (date) {
                            setVisaExpiry(format(date, "yyyy-MM-dd"))
                            setSelectedLoanAmount(null) // 비자 변경시 금액/기간 초기화
                            setLoanDuration("")
                            setUiState(prev => ({ ...prev, isCalendarOpen: false }))
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 10}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 2. 대출 금액 (비자 선택 후 활성화) */}
                <div className="space-y-2">
                  <Label htmlFor="loanAmount" className="text-sm font-semibold text-gray-700">{t("loanAmount")}</Label>
                  <Select
                    value={selectedLoanAmount?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedLoanAmount(Number(value))
                      setLoanDuration("") // 금액 변경 시 기간 초기화
                    }}
                    disabled={!visaExpiry || getAvailableLoanAmounts().length === 0}
                  >
                    <SelectTrigger id="loanAmount" className="w-full !h-12 border-gray-200 hover:border-red-300 rounded-xl">
                      <SelectValue placeholder={t("loanAmount")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl min-w-[var(--radix-select-trigger-width)] max-h-48">
                      {getAvailableLoanAmounts().map(amount => (
                        <SelectItem key={amount} value={amount.toString()} className="rounded-lg">
                          {formatCurrency(amount)}{t("won")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. 대출 기간 (금액 선택 후 활성화) */}
                <div className="space-y-2">
                  <Label htmlFor="loanDuration" className="text-sm font-semibold text-gray-700">{t("loanDuration")}</Label>
                  <Select
                    value={loanDuration}
                    onValueChange={setLoanDuration}
                    disabled={!selectedLoanAmount || getAvailableDurationsForAmount().length === 0}
                  >
                    <SelectTrigger id="loanDuration" className="!h-12 border-gray-200 hover:border-red-300 rounded-xl">
                      <SelectValue placeholder={t("selectLoanDuration")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl min-w-[var(--radix-select-trigger-width)] max-h-48">
                      {getAvailableDurationsForAmount().map(({ duration }) => (
                        <SelectItem key={duration} value={duration.toString()} className="rounded-lg">
                          {duration}{t("months")}
                          {duration >= 12 && duration % 12 === 0 ? ` (${duration / 12}${duration / 12 === 1 ? t("year") : t("years")})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <Label className="text-sm font-semibold text-gray-700">{t("customerInfo")}</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-xs text-gray-500">{t("customerName")}</Label>
                    <Input
                      id="customerName"
                      type="text"
                      placeholder={t("customerName")}
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="h-11 bg-white border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-xs text-gray-500">{t("customerPhone")}</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                      maxLength={13}
                      className="h-11 bg-white border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-xs text-gray-500">{t("customerEmail")}</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder={t("customerEmail")}
                      value={customer.email}
                      onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11 bg-white border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Manager Information */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <Label className="text-sm font-semibold text-gray-700">{t("managerInfo")}</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="managerName" className="text-xs text-gray-500">{t("managerName")}</Label>
                    <Input
                      id="managerName"
                      type="text"
                      placeholder={t("managerName")}
                      value={manager.name}
                      onChange={(e) => setManager(prev => ({ ...prev, name: e.target.value }))}
                      className="h-11 bg-white border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerContact" className="text-xs text-gray-500">{t("managerContact")}</Label>
                    <Input
                      id="managerContact"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={manager.contact}
                      onChange={(e) => setManager(prev => ({ ...prev, contact: formatPhoneNumber(e.target.value) }))}
                      maxLength={13}
                      className="h-11 bg-white border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">{t("todayDate")}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(new Date())}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">{t("maxLoanPeriod")}</span>
                  <span className="text-sm font-semibold text-red-600">{loanResult.maxDuration}{t("months")}</span>
                </div>
                {loanResult.contractEnd && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t("loanEndDate")}</span>
                    <span className="text-sm font-semibold text-gray-900">{loanResult.contractEnd}</span>
                  </div>
                )}
              </div>

              {/* Warning Alert */}
              {uiState.showWarning && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 text-sm">{t("loanExceedsWarning")}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {t("loanExceedsDesc").replace('{applied}', loanDuration).replace('{max}', loanResult.maxDuration.toString())}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Max Loan Card - 금액과 기간이 모두 선택된 경우에만 표시 */}
          {selectedLoanAmount && loanDuration && (
            <LoanResultCard
              maxLoanAmount={loanResult.maxLoanAmount}
              maxLoanEMI={loanResult.maxLoanEMI}
              loanDuration={loanDuration}
              managerName={manager.name}
              managerContact={manager.contact}
              customerName={customer.name}
              customerPhone={customer.phone}
              customerEmail={customer.email}
              corridor={manager.corridor}
              showSchedule={uiState.showSchedule}
              setShowSchedule={(show: boolean) => setUiState(prev => ({ ...prev, showSchedule: show }))}
              paymentSchedule={paymentSchedule}
              handleShare={handleShare}
              formatCurrency={formatCurrency}
              t={t}
            />
          )}

        </div>
      </div>
    </div>
  )
}

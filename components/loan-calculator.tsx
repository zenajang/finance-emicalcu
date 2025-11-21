"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, TrendingUp, Calendar as CalendarIcon, Percent, Clock, ChevronDown, ChevronUp, Globe } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { translations, languages, type Language } from "@/lib/i18n/translations"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const INTEREST_RATE = 0.2 / 12
const CAPACITY = 550000

interface PaymentScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export default function LoanCalculator() {
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [visaExpiry, setVisaExpiry] = useState<string>("")
  const [visaExpiryDate, setVisaExpiryDate] = useState<Date>()
  const [loanDuration, setLoanDuration] = useState<string>("")
  const [maxDuration, setMaxDuration] = useState<number>(0)
  const [contractEnd, setContractEnd] = useState<string>("")
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(0)
  const [maxLoanEMI, setMaxLoanEMI] = useState<number>(0)
  const [showTable, setShowTable] = useState<boolean>(false)
  const [isTableUnlocked, setIsTableUnlocked] = useState<boolean>(false)
  const [tableData, setTableData] = useState<any[]>([])
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [showSchedule, setShowSchedule] = useState<boolean>(true)
  const [loanAmounts] = useState<number[]>(() => {
    const amounts = []
    for (let i = 2000000; i <= 40000000; i += 1000000) {
      amounts.push(i)
    }
    return amounts
  })
  const [loanDurations] = useState<number[]>(() => {
    const durations = []
    for (let i = 3; i <= 180; i++) {
      durations.push(i)
    }
    return durations
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = translations[language]

  useEffect(() => {
    if (visaExpiry) {
      updateCalculations()
      generateTableData()
    }
  }, [visaExpiry, loanDuration])

  useEffect(() => {
    if (maxLoanAmount > 0 && loanDuration) {
      generatePaymentSchedule()
    }
  }, [maxLoanAmount, loanDuration])

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount)
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
    setMaxDuration(maxDur)

    if (loanDuration) {
      const duration = parseInt(loanDuration)
      const end = new Date(today)
      end.setMonth(end.getMonth() + duration)
      setContractEnd(formatDate(end))
      setShowWarning(duration > maxDur)

      let maxYellowAmount = 0
      let maxYellowEMI = 0
      let maxBlueAmount = 0
      let maxBlueEMI = 0

      loanAmounts.forEach(amount => {
        const emi = calculateEMI(amount, duration)
        const capacityRatio = Math.round(emi / CAPACITY)
        const yellowThreshold = getThresholdByAmount(amount, 'yellow')
        const blueThreshold = getThresholdByAmount(amount, 'blue')

        if (capacityRatio <= duration) {
          if (emi < yellowThreshold) {
            if (amount > maxYellowAmount) {
              maxYellowAmount = amount
              maxYellowEMI = emi
            }
          } else if (emi < blueThreshold) {
            if (amount > maxBlueAmount) {
              maxBlueAmount = amount
              maxBlueEMI = emi
            }
          }
        }
      })

      if (maxYellowAmount > 0) {
        setMaxLoanAmount(maxYellowAmount)
        setMaxLoanEMI(maxYellowEMI)
      } else if (maxBlueAmount > 0) {
        setMaxLoanAmount(maxBlueAmount)
        setMaxLoanEMI(maxBlueEMI)
      } else {
        setMaxLoanAmount(0)
        setMaxLoanEMI(0)
      }
    }
  }

  const generateTableData = () => {
    const data = loanDurations.map(duration => {
      const row: any = { duration }
      loanAmounts.forEach(amount => {
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
    if (!maxLoanAmount || !loanDuration) return

    const duration = parseInt(loanDuration)
    const monthlyPayment = maxLoanEMI
    let balance = maxLoanAmount
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
    if (showTable) {
      setShowTable(false)
    } else {
      if (!isTableUnlocked) {
        const password = prompt('상세 대출표를 보려면 비밀번호를 입력하세요:', '')
        if (password === '1234') {
          setIsTableUnlocked(true)
          setShowTable(true)
        } else if (password !== null) {
          alert('❌ 비밀번호가 틀렸습니다')
        }
      } else {
        setShowTable(true)
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

  if (!mounted) {
    return (
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
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
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center flex-1">
              <img
                src="/gme-logo.png"
                alt="GME Finance"
                className="h-8 w-auto"
              />
            </div>
            <div className="flex-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{languages.find(l => l.code === language)?.nativeName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={language === lang.code ? 'bg-accent' : ''}
                    >
                      {lang.nativeName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="space-y-2 text-center px-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.loanInfo}</CardTitle>
            <CardDescription>{t.loanInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.visaExpiry}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !visaExpiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {visaExpiryDate ? format(visaExpiryDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={visaExpiryDate}
                      onSelect={(date) => {
                        setVisaExpiryDate(date)
                        if (date) {
                          setVisaExpiry(format(date, "yyyy-MM-dd"))
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

              <div className="space-y-2">
                <Label htmlFor="loanDuration">{t.loanDuration}</Label>
                <Select value={loanDuration} onValueChange={setLoanDuration} disabled={!visaExpiry}>
                  <SelectTrigger id="loanDuration">
                    <SelectValue placeholder={t.selectLoanDuration} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDurations().map(duration => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration}{t.months}
                        {duration >= 12 && duration % 12 === 0 ? ` (${duration / 12}${duration / 12 === 1 ? t.year : t.years})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Info List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">{t.todayDate}</span>
                </div>
                <div className="font-semibold">{formatDate(new Date())}</div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{t.maxLoanPeriod}</span>
                </div>
                <div className="font-semibold">{maxDuration}{t.months}</div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm">{t.interestRate}</span>
                </div>
                <div className="font-semibold">20%</div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">{t.loanEndDate}</span>
                </div>
                <div className="font-semibold">{contractEnd || '-'}</div>
              </div>
            </div>

            {/* Warning Alert */}
            {showWarning && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t.loanExceedsWarning}</AlertTitle>
                  <AlertDescription>
                    {t.loanExceedsDesc.replace('{applied}', loanDuration).replace('{max}', maxDuration.toString())}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        {/* Max Loan Card */}
        {maxLoanAmount > 0 && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.maxRecommendedLoan}
                </CardTitle>
                <Badge>{t.recommended}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.loanAmount}</p>
                  <p className="text-2xl sm:text-3xl font-bold break-all">{formatCurrency(maxLoanAmount)}{t.won}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.monthlyPayment}</p>
                  <p className="text-2xl sm:text-3xl font-bold break-all">{formatCurrency(maxLoanEMI)}{t.won}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.totalPayment}</p>
                  <p className="text-lg sm:text-xl font-semibold break-all">
                    {formatCurrency(maxLoanEMI * parseInt(loanDuration))}{t.won}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.totalInterest}</p>
                  <p className="text-lg sm:text-xl font-semibold text-orange-600 break-all">
                    {formatCurrency(maxLoanEMI * parseInt(loanDuration) - maxLoanAmount)}{t.won}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.principal}</p>
                  <p className="text-lg sm:text-xl font-semibold text-green-600 break-all">
                    {formatCurrency(maxLoanAmount)}{t.won}
                  </p>
                </div>
              </div>
              <Separator />
              <Button
                onClick={() => setShowSchedule(!showSchedule)}
                variant="outline"
                className="w-full"
              >
                {showSchedule ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    {t.hideSchedule}
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {t.showSchedule}
                  </>
                )}
              </Button>
              {showSchedule && paymentSchedule.length > 0 && (
                <div className="mt-4 rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-16 sm:w-20">{t.installment}</TableHead>
                        <TableHead className="text-right whitespace-nowrap">{t.monthlyPayment}</TableHead>
                        <TableHead className="text-right whitespace-nowrap">{t.principal}</TableHead>
                        <TableHead className="text-right whitespace-nowrap">{t.interest}</TableHead>
                        <TableHead className="text-right whitespace-nowrap">{t.balance}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSchedule.map((item) => (
                        <TableRow key={item.month}>
                          <TableCell className="text-center font-medium">
                            {item.month}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                            {formatCurrency(Math.round(item.payment))}{t.won}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm text-green-600 whitespace-nowrap">
                            {formatCurrency(Math.round(item.principal))}{t.won}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm text-orange-600 whitespace-nowrap">
                            {formatCurrency(Math.round(item.interest))}{t.won}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm font-medium whitespace-nowrap">
                            {formatCurrency(Math.round(item.balance))}{t.won}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t.detailedLoanTable}</CardTitle>
            <CardDescription>{t.detailedLoanTableDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={toggleTable}
              variant={showTable ? "outline" : "default"}
              className="w-full"
            >
              {showTable ? t.hideLoanTable : t.showLoanTable}
            </Button>

            {showTable && (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-yellow-400 text-black">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {t.recommendedLoan}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-400 text-white">
                    {t.mediumRisk}
                  </Badge>
                </div>

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">{t.period}</th>
                          {loanAmounts.map(amount => (
                            <th key={amount} className="h-12 px-4 text-right align-middle font-medium whitespace-nowrap">
                              {formatCurrency(amount)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map(row => (
                          <tr
                            key={row.duration}
                            className={`border-b ${
                              row.duration === parseInt(loanDuration)
                                ? 'bg-muted'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <td className="p-4 align-middle font-medium whitespace-nowrap">
                              {row.duration}{t.months}
                            </td>
                            {loanAmounts.map(amount => {
                              const cell = row[amount]
                              return (
                                <td
                                  key={amount}
                                  className={`p-4 align-middle text-right whitespace-nowrap ${
                                    cell.highlight === 'yellow'
                                      ? 'bg-yellow-100 font-semibold'
                                      : cell.highlight === 'blue'
                                      ? 'bg-blue-100 font-semibold'
                                      : ''
                                  }`}
                                >
                                  {formatCurrency(cell.emi)}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

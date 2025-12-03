"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, ChevronDown, ChevronUp, Mail } from "lucide-react"

interface PaymentScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

interface LoanResultCardProps {
  maxLoanAmount: number
  maxLoanEMI: number
  loanDuration: string
  managerName: string
  managerContact: string
  customerName: string
  customerPhone: string
  customerEmail: string
  corridor: string  // 담당자 국적
  showSchedule: boolean
  setShowSchedule: (show: boolean) => void
  paymentSchedule: PaymentScheduleItem[]
  handleShare: () => void
  formatCurrency: (num: number) => string
  t: (key: string) => string
}

export default function LoanResultCard({
  maxLoanAmount,
  maxLoanEMI,
  loanDuration,
  managerName,
  managerContact,
  customerName,
  customerPhone,
  customerEmail,
  corridor,
  showSchedule,
  setShowSchedule,
  paymentSchedule,
  handleShare,
  formatCurrency,
  t,
}: LoanResultCardProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const handleSendEmail = async () => {
    if (!customerEmail) {
      alert(t("emailRequired"))
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          loanAmount: maxLoanAmount,
          monthlyPayment: maxLoanEMI,
          loanDuration: parseInt(loanDuration),
          totalPayment: maxLoanEMI * parseInt(loanDuration),
          totalInterest: maxLoanEMI * parseInt(loanDuration) - maxLoanAmount,
          managerName,
          managerContact,
          corridor,  // 담당자 국적 전달
        }),
      })

      if (response.ok) {
        alert(t("emailSent"))
      } else {
        alert(t("emailFailed"))
      }
    } catch (error) {
      console.error('Email send error:', error)
      alert(t("emailFailed"))
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (maxLoanAmount <= 0) return null

  return (
    <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b pb-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <TrendingUp className="h-5 w-5 text-red-500" />
            {t("maxRecommendedLoan")}
          </CardTitle>
          <Badge className="bg-red-500 text-white border-0">{t("recommended")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {/* Customer & Manager Info Display */}
        {(customerName || customerPhone || managerName || managerContact) && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {(customerName || customerPhone) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("customerInfo")}</span>
                  <span className="font-medium text-gray-900">
                    {customerName}{customerName && customerPhone && ' · '}{customerPhone}
                  </span>
                </div>
              )}
              {(managerName || managerContact) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("managerInfo")}</span>
                  <span className="font-medium text-gray-900">
                    {managerName}{managerName && managerContact && ' · '}{managerContact}
                  </span>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Main Amount Display */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">{t("loanAmount")}</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 break-all">
              {formatCurrency(maxLoanAmount)}<span className="text-base font-medium text-gray-500">{t("won")}</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">{t("monthlyPayment")}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 break-all">
              {formatCurrency(maxLoanEMI)}<span className="text-base font-medium text-gray-500">{t("won")}</span>
            </p>
          </div>
        </div>

        {/* Detail Stats */}
        <div className="grid gap-3 grid-cols-3">
          <div className="text-center p-3">
            <p className="text-xs text-gray-500 mb-1">{t("totalPayment")}</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
              {formatCurrency(maxLoanEMI * parseInt(loanDuration))}{t("won")}
            </p>
          </div>
          <div className="text-center p-3 border-x border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{t("totalInterest")}</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
              {formatCurrency(maxLoanEMI * parseInt(loanDuration) - maxLoanAmount)}{t("won")}
            </p>
          </div>
          <div className="text-center p-3">
            <p className="text-xs text-gray-500 mb-1">{t("principal")}</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
              {formatCurrency(maxLoanAmount)}{t("won")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/*<Button
              onClick={handleShare}
              className="h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-md"
            >
              <Share2 className="mr-2 h-5 w-5" />
              {t("shareCalculation")}
            </Button> */}

            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50"
            >
              <Mail className="mr-2 h-5 w-5" />
              {isSendingEmail ? t("sendingEmail") : t("sendEmail")}
            </Button>
          </div>

          <Button
            onClick={() => setShowSchedule(!showSchedule)}
            variant="outline"
            className="w-full h-11 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
          >
            {showSchedule ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                {t("hideSchedule")}
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                {t("showSchedule")}
              </>
            )}
          </Button>
        </div>

        {showSchedule && paymentSchedule.length > 0 && (
          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-16 sm:w-20">{t("installment")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("monthlyPayment")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("principal")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("interest")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("balance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSchedule.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell className="text-center font-medium">
                      {item.month}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(Math.round(item.payment))}{t("won")}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm text-green-600 whitespace-nowrap">
                      {formatCurrency(Math.round(item.principal))}{t("won")}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm text-orange-600 whitespace-nowrap">
                      {formatCurrency(Math.round(item.interest))}{t("won")}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm font-medium whitespace-nowrap">
                      {formatCurrency(Math.round(item.balance))}{t("won")}
                    </TableCell>
                  </TableRow>
                ))}
                
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

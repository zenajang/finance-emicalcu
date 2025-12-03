"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter } from "lucide-react"
import { useTranslation } from "@/lib/hooks/useTranslation"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  manager_name: string
  manager_contact: string
  corridor?: string
  created_at: string
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [corridorFilter, setCorridorFilter] = useState<string>("all")
  const [corridors, setCorridors] = useState<string[]>([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)

    // 모든 고객 데이터 가져오기
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customers:", error)
    } else {
      setCustomers(data || [])
      // 고유한 corridor(담당자 국적) 목록 추출
      const uniqueCorridors = [...new Set((data || []).map(c => c.corridor).filter(Boolean))]
      setCorridors(uniqueCorridors as string[])
    }

    setLoading(false)
  }

  // 필터링된 고객 목록
  const filteredCustomers = corridorFilter === "all"
    ? customers
    : customers.filter(c => c.corridor === corridorFilter)

  const todayCustomers = filteredCustomers.filter(c => {
    const today = new Date()
    const created = new Date(c.created_at)
    return created.toDateString() === today.toDateString()
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="space-y-5">
          {/* Main Card - 계산기와 동일한 스타일 */}
          <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">{t("dashboard") || "대시보드"}</CardTitle>
                  <CardDescription className="text-gray-500">{t("customerManagement") || "고객 관리"}</CardDescription>
                </div>
                {/* 담당자 국적 필터 */}
                {corridors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={corridorFilter} onValueChange={setCorridorFilter}>
                      <SelectTrigger className="w-[180px] border-gray-200 hover:border-red-300 rounded-xl">
                        <SelectValue placeholder={t("allCorridors") || "전체 국가"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">{t("allCorridors") || "전체 국가"}</SelectItem>
                        {corridors.map((corridor) => (
                          <SelectItem key={corridor} value={corridor}>
                            {corridor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500 mb-1">{t("totalCustomers") || "총 고객 수"}</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500 mb-1">{t("totalCorridors") || "국가 수"}</p>
                  <p className="text-2xl font-bold text-gray-900">{corridors.length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500 mb-1">{t("todayCustomers") || "오늘 등록"}</p>
                  <p className="text-2xl font-bold text-red-600">{todayCustomers.length}</p>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>{t("noCustomers") || "등록된 고객이 없습니다."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>{t("customerName")}</TableHead>
                        <TableHead>{t("customerPhone")}</TableHead>
                        <TableHead>{t("customerEmail")}</TableHead>
                        <TableHead>{t("managerName")}</TableHead>
                        <TableHead>{t("corridor")}</TableHead>
                        <TableHead>{t("createdAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name || "-"}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>{customer.email || "-"}</TableCell>
                          <TableCell>{customer.manager_name || "-"}</TableCell>
                          <TableCell>
                            {customer.corridor ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                                {customer.corridor}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {formatDate(customer.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

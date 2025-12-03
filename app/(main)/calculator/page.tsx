import { Suspense } from "react"
import LoanCalculator from "@/components/Loan/LoanCalculator"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function LoadingSkeleton() {
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
        </CardContent>
      </Card>
    </div>
  )
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LoanCalculator />
    </Suspense>
  )
}
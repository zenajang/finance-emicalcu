import { CalculatorIcon } from "lucide-react"

export default function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-8 py-12 lg:px-16 bg-gradient-to-br from-red-500 via-red-500 to-orange-400 relative">
      <div className="max-w-md mx-auto w-full text-white">
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            GME Finance
          </h1>
          <div className="w-20 h-1 bg-white mb-6" />
          <div className="flex items-center gap-2">
            <CalculatorIcon className="w-6 h-6" />
            <span className="text-xl">Loan Interest Calculator</span>
          </div>
        </div>
        {/* 하단 정보 */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-sm text-white/70">
            © 2025 GME Finance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

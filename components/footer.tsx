export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Company Information */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">주식회사 지엠이대부 (GME Loan)</p>
            <p>사업자등록번호: 646-88-01104 | 대부등록번호: 2019-금감원-1801</p>
            <p>대표: 성종화</p>
            <p>주소: 서울특별시 영등포구 영등포로 150, 비동 202호, 203호, 204호 (07292)</p>
            <p>전화: <a href="tel:02-765-5555" className="hover:text-foreground transition-colors">02-765-5555</a></p>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>연이율: 최고 20% | 연체이자율: 대출금리 + 연 최고 3%</p>
              <p>대출기간: 4~60개월</p>
            </div>
          </div>

          {/* Links */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <a href="https://gmefinance.com/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                이용약관
              </a>
              <a href="https://gmefinance.com/loan-terms" className="text-muted-foreground hover:text-foreground transition-colors">
                대출 기본 약관
              </a>
              <a href="https://gmefinance.com/policy-updates" className="text-muted-foreground hover:text-foreground transition-colors">
                정책 업데이트 안내
              </a>
              <a href="https://gmefinance.com/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                개인정보처리방침
              </a>
              <a href="https://gmefinance.com/credit-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                신용정보 활용 정책
              </a>
              <a href="https://gmefinance.com/customer-rights" className="text-muted-foreground hover:text-foreground transition-colors">
                고객권리 안내
              </a>
              <a href="https://gmefinance.com/third-party" className="text-muted-foreground hover:text-foreground transition-colors">
                제3자 제공 현황
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              © 2025 GME Finance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

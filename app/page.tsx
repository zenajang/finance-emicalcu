import { redirect } from "next/navigation"

export default function Home() {
  // 비로그인 사용자도 계산기 접근 가능
  redirect("/calculator")
}

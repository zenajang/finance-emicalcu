import { redirect } from "next/navigation"

export default function Home() {
  // TODO: 나중에 비회원 접근 허용 시 여기서 분기 처리
  redirect("/auth/signin")
}

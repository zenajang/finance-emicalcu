import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID
const MONDAY_COLUMNS = {
  customerPhone: process.env.MONDAY_COL_CUSTOMER_PHONE || 'contact_phone',
  customerEmail: process.env.MONDAY_COL_CUSTOMER_EMAIL || 'contact_email',
  managerName: process.env.MONDAY_COL_MANAGER_NAME || 'text_mky46msd',
  managerPhone: process.env.MONDAY_COL_MANAGER_PHONE || 'phone_mky4e40s',
}

function formatPhoneToInternational(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('010')) {
    return '+82' + digits.substring(1)
  }
  if (digits.startsWith('82')) {
    return '+' + digits
  }
  return '+82' + digits
}

async function createMondayItem(data: {
  customerName: string
  customerPhone: string
  customerEmail: string
  managerName: string
  managerContact: string
}) {
  if (!MONDAY_API_TOKEN || !MONDAY_BOARD_ID || MONDAY_API_TOKEN === 'your_api_token_here') {
    return null
  }

  const customerPhoneIntl = formatPhoneToInternational(data.customerPhone)
  const managerPhoneIntl = formatPhoneToInternational(data.managerContact)

  const columnValues = {
    [MONDAY_COLUMNS.customerPhone]: { phone: customerPhoneIntl, countryShortName: 'KR' },
    [MONDAY_COLUMNS.customerEmail]: { email: data.customerEmail, text: data.customerEmail },
    [MONDAY_COLUMNS.managerName]: data.managerName || '',
    [MONDAY_COLUMNS.managerPhone]: { phone: managerPhoneIntl, countryShortName: 'KR' },
  }

  const query = `
    mutation {
      create_item (
        board_id: ${MONDAY_BOARD_ID},
        item_name: "${(data.customerName || '신규 고객').replace(/"/g, '\\"')}",
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
      }
    }
  `

  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_TOKEN,
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error('Monday.com API error:', result.errors)
      return null
    }

    return result.data?.create_item?.id
  } catch (error) {
    console.error('Monday.com request failed:', error)
    return null
  }
}

interface EmailRequestBody {
  customerName: string
  customerPhone: string
  customerEmail: string
  loanAmount: number
  monthlyPayment: number
  loanDuration: number
  totalPayment: number
  totalInterest: number
  managerName?: string
  managerContact?: string
  corridor?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequestBody = await request.json()

    const {
      customerName,
      customerPhone,
      customerEmail,
      loanAmount,
      monthlyPayment,
      loanDuration,
      totalPayment,
      totalInterest,
      managerName,
      managerContact,
      corridor,
    } = body

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      )
    }

    const formatCurrency = (num: number) =>
      new Intl.NumberFormat('ko-KR').format(num)

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('name', customerName || '')
      .eq('phone', customerPhone || '')
      .eq('email', customerEmail)
      .single()

    if (!existingCustomer) {
      const { error: dbError } = await supabase
        .from('customers')
        .insert({
          name: customerName || null,
          phone: customerPhone || null,
          email: customerEmail,
          manager_name: managerName || null,
          manager_contact: managerContact || null,
          corridor: corridor || null,
          created_at: new Date().toISOString(),
        })

      if (dbError) {
        console.error('Supabase error:', dbError)
      } else {
        await createMondayItem({
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          customerEmail: customerEmail || '',
          managerName: managerName || '',
          managerContact: managerContact || '',
        })
      }
    } else {
      console.log('Existing customer (name+phone+email match), skipping save')
    }

    const { data, error: emailError } = await resend.emails.send({
      from: 'GME Finance <noreply@gmefinance.com>',
      to: customerEmail,
      subject: 'GME Finance - 대출 계산 결과',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .info-box { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; color: #111827; }
            .highlight { color: #dc2626; font-size: 24px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GME Finance</h1>
              <p>대출 계산 결과</p>
            </div>
            <div class="content">
              ${customerName ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #374151;">고객 정보</h3>
                <div class="info-row">
                  <span class="label">이름</span>
                  <span class="value">${customerName}</span>
                </div>
                ${customerPhone ? `
                <div class="info-row">
                  <span class="label">연락처</span>
                  <span class="value">${customerPhone}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <div class="info-box">
                <h3 style="margin-top: 0; color: #374151;">대출 정보</h3>
                <div class="info-row">
                  <span class="label">대출 금액</span>
                  <span class="value highlight">${formatCurrency(loanAmount)}원</span>
                </div>
                <div class="info-row">
                  <span class="label">월 상환액</span>
                  <span class="value">${formatCurrency(monthlyPayment)}원</span>
                </div>
                <div class="info-row">
                  <span class="label">대출 기간</span>
                  <span class="value">${loanDuration}개월</span>
                </div>
                <div class="info-row">
                  <span class="label">총 상환액</span>
                  <span class="value">${formatCurrency(totalPayment)}원</span>
                </div>
                <div class="info-row">
                  <span class="label">총 이자</span>
                  <span class="value">${formatCurrency(totalInterest)}원</span>
                </div>
              </div>

              ${managerName || managerContact ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #374151;">담당자 정보</h3>
                ${managerName ? `
                <div class="info-row">
                  <span class="label">담당자</span>
                  <span class="value">${managerName}</span>
                </div>
                ` : ''}
                ${managerContact ? `
                <div class="info-row">
                  <span class="label">연락처</span>
                  <span class="value">${managerContact}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>본 이메일은 GME Finance에서 발송되었습니다.</p>
              <p>© 2025 GME Finance. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

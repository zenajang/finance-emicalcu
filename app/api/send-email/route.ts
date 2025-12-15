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
      subject: 'GME Finance - Your Loan Calculation Result',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 41px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">GME Finance</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Loan Calculation Result</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">

                      <!-- Highlight Box - Monthly Payment -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Monthly Payment</p>
                            <p style="margin: 0; color: #dc2626; font-size: 36px; font-weight: bold;">${formatCurrency(monthlyPayment)} KRW</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Loan Details Grid -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 20px; background-color: #f9fafb; border-radius: 12px 0 0 12px; text-align: center; width: 50%;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Loan Amount</p>
                            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formatCurrency(loanAmount)} KRW</p>
                          </td>
                          <td style="padding: 20px; background-color: #f9fafb; border-radius: 0 12px 12px 0; text-align: center; width: 50%; border-left: 2px solid #e5e7eb;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Loan Period</p>
                            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${loanDuration} months</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Summary Section -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="background-color: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #374151; font-weight: 600; font-size: 14px;">Payment Summary</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 15px 20px; border-bottom: 1px solid #f3f4f6;">
                                  <span style="color: #6b7280;">Total Payment</span>
                                </td>
                                <td style="padding: 15px 20px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                  <span style="color: #111827; font-weight: 600;">${formatCurrency(totalPayment)} KRW</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 15px 20px;">
                                  <span style="color: #6b7280;">Total Interest</span>
                                </td>
                                <td style="padding: 15px 20px; text-align: right;">
                                  <span style="color: #dc2626; font-weight: 600;">${formatCurrency(totalInterest)} KRW</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${customerName || customerPhone ? `
                      <!-- Customer Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="background-color: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #374151; font-weight: 600; font-size: 14px;">Customer Information</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 15px 20px;">
                            ${customerName ? `<p style="margin: 0 0 8px; color: #374151;"><strong>Name:</strong> ${customerName}</p>` : ''}
                            ${customerPhone ? `<p style="margin: 0; color: #374151;"><strong>Phone:</strong> ${customerPhone}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      ` : ''}

                      ${managerName || managerContact ? `
                      <!-- Manager Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; background-color: #eff6ff; border-radius: 12px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 10px; color: #1e40af; font-weight: 600; font-size: 14px;">Your Loan Manager</p>
                            ${managerName ? `<p style="margin: 0 0 5px; color: #1e3a8a;"><strong>${managerName}</strong></p>` : ''}
                            ${managerContact ? `<p style="margin: 0; color: #3b82f6;">${managerContact}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      ` : ''}

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for choosing GME Finance</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; 2025 GME Finance. All rights reserved.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
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

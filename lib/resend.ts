import { Resend } from 'resend'

// Sender identity. In production set RESEND_FROM to a verified-domain address,
// e.g. "UptimeWatch <alerts@uptimewatchhq.com>". The resend.dev fallback only
// delivers to the Resend account owner, so it is dev-only.
const FROM = process.env.RESEND_FROM ?? 'UptimeWatch <onboarding@resend.dev>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendDownAlert(params: {
  to: string
  monitorName: string
  url: string
  statusCode?: number
  checkedAt: string
}) {
  const { to, monitorName, url, statusCode, checkedAt } = params
  const resend = getResend()

  return resend.emails.send({
    from: FROM,
    to,
    subject: `[DOWN] ${monitorName} is not responding`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: #ef4444; padding: 24px 32px;">
              <h1 style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;">Site Down Alert</h1>
            </div>
            <div style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">
                <strong>${monitorName}</strong> is currently <strong style="color: #ef4444;">DOWN</strong>.
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Details</p>
                <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>URL:</strong> <a href="${url}" style="color: #3b82f6;">${url}</a></p>
                ${statusCode ? `<p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>Status Code:</strong> ${statusCode}</p>` : ''}
                <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Detected at:</strong> ${new Date(checkedAt).toUTCString()}</p>
              </div>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
                We will notify you as soon as the site recovers.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #1f2937; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                View Dashboard
              </a>
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; background: #f9fafb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You received this alert from <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #6b7280;">UptimeWatch</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendRecoveryAlert(params: {
  to: string
  monitorName: string
  url: string
  downtimeDuration: string
  checkedAt: string
}) {
  const { to, monitorName, url, downtimeDuration, checkedAt } = params
  const resend = getResend()

  return resend.emails.send({
    from: FROM,
    to,
    subject: `[RECOVERED] ${monitorName} is back online`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: #22c55e; padding: 24px 32px;">
              <h1 style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;">Site Recovered</h1>
            </div>
            <div style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">
                <strong>${monitorName}</strong> is back <strong style="color: #22c55e;">ONLINE</strong>.
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Details</p>
                <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>URL:</strong> <a href="${url}" style="color: #3b82f6;">${url}</a></p>
                <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>Downtime duration:</strong> ${downtimeDuration}</p>
                <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Recovered at:</strong> ${new Date(checkedAt).toUTCString()}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #1f2937; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                View Dashboard
              </a>
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; background: #f9fafb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You received this alert from <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #6b7280;">UptimeWatch</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

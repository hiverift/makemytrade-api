// src/notifications/templates.ts
export function userTemplateHtml({ bookingId, serviceName, date, slotLabel, amount, user, consultant }) {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333; margin:0; padding:0;">
      <div style="max-width:600px;margin:20px auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#7c3aed,#0ea5a0);padding:24px;color:#fff;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Booking Confirmed</h1>
        </div>
        <div style="padding:20px;">
          <p>Hi ${user?.name ?? 'Customer'},</p>
          <p>Thanks for booking <strong>${serviceName}</strong>. Your appointment is confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:10px;">
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Booking ID</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Date</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${date}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Time</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${slotLabel}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Amount</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">₹${amount}</td>
            </tr>
          </table>

          <p style="margin-top:16px;">
            You can view and manage this booking in your dashboard:
          </p>
          <p style="text-align:center;margin:20px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://your-frontend.example.com'}/dashboard" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Go to My Dashboard</a>
          </p>

          <p>If you have any questions, reply to this email or contact support.</p>
          <p>Thanks,<br/>Team</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

export function consultantTemplateHtml({ bookingId, serviceName, date, slotLabel, amount, user, consultant }) {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; color:#333; margin:0; padding:0;">
      <div style="max-width:600px;margin:20px auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <div style="background:#0ea5a0;padding:24px;color:#fff;text-align:center;">
          <h1 style="margin:0;font-size:20px;">New Booking Received</h1>
        </div>
        <div style="padding:20px;">
          <p>Hi ${consultant?.name ?? 'Consultant'},</p>
          <p>You have a new booking for <strong>${serviceName}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:10px;">
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Booking ID</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Client</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${user?.name ?? user?.email}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Date</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${date}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #f1f1f1;"><strong>Time</strong></td>
              <td style="padding:8px;border:1px solid #f1f1f1;">${slotLabel}</td>
            </tr>
          </table>

          <p style="margin-top:16px;">
            Please log in to your consultant dashboard to view details and confirm.
          </p>
          <p style="text-align:center;margin:20px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://your-frontend.example.com'}/consultant/dashboard" style="background:#0ea5a0;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Open Dashboard</a>
          </p>

          <p>Thanks,<br/>Team</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, first_name, ticket_number, event_title, guest_name, date, time, question } =
      await request.json();

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.2);">
          <!-- Header -->
          <tr>
            <td style="padding:30px 30px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
              <table width="100%">
                <tr>
                  <td>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:0.2em;">DOAC</h1>
                    <p style="margin:4px 0 0;color:#AAAAAA;font-size:10px;letter-spacing:0.3em;">PRIVATE SCREENING</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;color:#AAAAAA;font-size:10px;">NO.</p>
                    <p style="margin:0;color:#ffffff;font-size:24px;">#{ticket_number}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:25px 30px;">
              <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">GUEST</p>
              <p style="color:#ffffff;font-size:18px;margin:0 0 20px;">${first_name}</p>

              <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">SCREENING</p>
              <p style="color:#ffffff;font-size:16px;margin:0;">${event_title}</p>
              <p style="color:#AAAAAA;font-size:13px;margin:4px 0 20px;">with ${guest_name}</p>

              <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">DATE & TIME</p>
              <p style="color:#ffffff;font-size:13px;margin:0 0 20px;">${date} at ${time}</p>

              ${question ? `
              <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">YOUR QUESTION</p>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;font-style:italic;margin:0;">"${question}"</p>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.1);">
              <p style="color:#AAAAAA;font-size:11px;margin:0;text-align:center;">
                Keep this ticket. See you at the screening.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "DOAC <tickets@doac.com>",
        to: email,
        subject: `Your ticket to ${event_title} — #${ticket_number}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Email send error:", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

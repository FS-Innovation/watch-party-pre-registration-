import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/email/preview?name=John&ticket=0042&question=What+inspires+you
 *
 * Returns the confirmation email as rendered HTML so anyone on the team
 * can preview it in a browser — no Resend account or email verification needed.
 *
 * Only available in development.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const first_name = params.get("name") || "Test User";
  const ticket_number = params.get("ticket") || "0042";
  const guest_question = params.get("question") || "";

  const html = buildConfirmationHtml({ first_name, ticket_number, guest_question });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function buildConfirmationHtml(params: {
  first_name: string;
  ticket_number: string;
  guest_question?: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.2);">
        <tr>
          <td style="padding:30px 30px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
            <table width="100%"><tr>
              <td>
                <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:0.2em;">DOAC</h1>
                <p style="margin:4px 0 0;color:#AAAAAA;font-size:10px;letter-spacing:0.3em;">PRIVATE SCREENING</p>
              </td>
              <td align="right">
                <p style="margin:0;color:#AAAAAA;font-size:10px;">NO.</p>
                <p style="margin:0;color:#ffffff;font-size:24px;">#${params.ticket_number}</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:25px 30px;">
            <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">GUEST</p>
            <p style="color:#ffffff;font-size:18px;margin:0 0 20px;">${params.first_name}</p>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 20px;">
              You're registered. We'll send your private screening link before the event starts.
            </p>
            ${params.guest_question ? `
            <p style="color:#AAAAAA;font-size:10px;letter-spacing:0.3em;margin:0 0 4px;">YOUR QUESTION</p>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;font-style:italic;margin:0;">"${params.guest_question}"</p>
            ` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.1);">
            <p style="color:#AAAAAA;font-size:11px;margin:0;text-align:center;">
              Keep this ticket. See you at the screening.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

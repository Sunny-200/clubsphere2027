import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = "no-reply@clubsphere.app",
} = process.env ?? {};

let transporterPromise;

function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] SMTP env vars missing – emails will be logged only");
    transporterPromise = Promise.resolve(null);
    return transporterPromise;
  }

  transporterPromise = Promise.resolve(
    nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  );

  return transporterPromise;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to || !subject) {
    throw new Error("sendMail requires `to` and `subject`");
  }

  const transporter = await getTransporter();
  if (!transporter) {
    console.info("[mailer] Mock email:", { to, subject, text, html });
    return { mocked: true };
  }

  return transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

export function buildEventConfirmationTemplate({
  attendeeName,
  eventTitle,
  eventDate,
  clubName,
  location,
  liveEventLink,
}) {
  const dateString = new Date(eventDate).toLocaleString();
  const venue = location || "Venue to be announced";

  const textLines = [
    `Hi ${attendeeName},`,
    `You are officially booked for ${eventTitle}.`,
    `Hosted by: ${clubName}`,
    `When: ${dateString}`,
    `Where: ${venue}`,
    liveEventLink ? `Live link: ${liveEventLink}` : null,
    "You reserved a seat, so please show up or release it so another student can join.",
    "We cannot wait to see you there!",
    "- ClubSphere",
  ].filter(Boolean);

  return {
    subject: `Your RSVP is confirmed: ${eventTitle}`,
    text: textLines.join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hi ${attendeeName},</h2>
        <p>Your RSVP is confirmed for <strong>${eventTitle}</strong>. Here is everything you need to know:</p>
        <ul>
          <li><strong>Organizing club:</strong> ${clubName}</li>
          <li><strong>Date & time:</strong> ${dateString}</li>
          <li><strong>Venue:</strong> ${venue}</li>
          ${liveEventLink ? `<li><strong>Live link:</strong> <a href="${liveEventLink}">${liveEventLink}</a></li>` : ""}
        </ul>
        <p style="margin-top:16px;">You reserved a seat, so please make sure to attend so the spot does not go empty.</p>
        <p>If plans change, let the club know so someone on the waitlist can jump in.</p>
        <p style="margin-top:24px;">See you soon!<br />- ClubSphere</p>
      </div>
    `,
  };
}

export function buildEventCancellationTemplate({
  attendeeName,
  eventTitle,
  eventDate,
  clubName,
  location,
}) {
  const dateString = new Date(eventDate).toLocaleString();
  const venue = location || "Venue to be announced";

  const textLines = [
    `Hi ${attendeeName},`,
    `Your RSVP for ${eventTitle} has been canceled successfully.`,
    `Hosted by: ${clubName}`,
    `Scheduled for: ${dateString}`,
    `Venue: ${venue}`,
    "Your seat has been opened up for the next person in line.",
    "If this was a mistake, feel free to RSVP again while seats remain.",
    "- ClubSphere",
  ].filter(Boolean);

  return {
    subject: `Your RSVP was canceled: ${eventTitle}`,
    text: textLines.join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hi ${attendeeName},</h2>
        <p>Your RSVP for <strong>${eventTitle}</strong> has been canceled per your request. Here are the details we released:</p>
        <ul>
          <li><strong>Organizing club:</strong> ${clubName}</li>
          <li><strong>Date & time:</strong> ${dateString}</li>
          <li><strong>Venue:</strong> ${venue}</li>
        </ul>
        <p>The seat is now available for someone else. If this was a mistake, feel free to RSVP again while space remains.</p>
        <p style="margin-top:24px;">Thanks for keeping us in the loop!<br />- ClubSphere</p>
      </div>
    `,
  };
}

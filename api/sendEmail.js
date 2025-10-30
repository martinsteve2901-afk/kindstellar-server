// api/sendEmail.js
import { Resend } from "resend";

// NOTE: Vercel serverless functions run with Node ESM. Use environment variables configured in Vercel dashboard.
const resend = new Resend(process.env.RESEND_API_KEY);

const questions = [
  "How many custom objects do you have in Salesforce?",
  "How many automated processes (workflows/flows) run daily?",
  "How many user licenses/seats are there?",
  "How many active integrations (real-time) do you have?",
  "How many fields have been created beyond default?",
  "How many user-profiles/roles combinations are active?",
  "How many reports/dashboards in use (active) for business users?",
  "How many business units / org-branches using Salesforce?",
];

const options = [
  ["Less than 10", "10–25", "26–50", "More than 50"],
  ["Less than 10", "10–50", "51–200", "More than 200"],
  ["Less than 50", "50–200", "201–1000", "More than 1000"],
  ["None", "1–5", "6–15", "More than 15"],
  ["Less than 100", "100–500", "501–2000", "More than 2000"],
  ["Less than 5", "5–10", "11–20", "More than 20"],
  ["Less than 20", "20–100", "101–500", "More than 500"],
  ["1", "2–3", "4–10", "More than 10"],
];

export default async function handler(req, res) {
  // Allow CORS from anywhere (or restrict to your domain)
  res.setHeader("Access-Control-Allow-Origin", "*"); // change "*" to "https://kindstellar.com" in production
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { formData, scores = [], totalScore } = req.body || {};

    // Map scores numbers to readable answers
    const selectedAnswers = scores.map((s, i) => {
      const answer = (options[i] && options[i][s - 1]) || "Not answered";
      return { question: questions[i] || `Q${i + 1}`, answer };
    });

    // Build HTML payload
    const htmlContent = `
      <h2>New ROI Calculator Submission</h2>
      <p><b>Name:</b> ${formData?.firstName || ""} ${formData?.lastName || ""}</p>
      <p><b>Email:</b> ${formData?.email || ""}</p>
      <p><b>Phone:</b> ${formData?.countryCode || ""} ${formData?.phone || ""}</p>
      <p><b>Comments:</b> ${formData?.comments || "None"}</p>
      <hr/>
      <h3>Selected Answers:</h3>
      ${selectedAnswers
        .map(
          (it, idx) =>
            `<p><b>${idx + 1}. ${it.question}</b><br/>Answer: ${it.answer}</p>`
        )
        .join("")}
      <hr/>
      <p><b>Total Score:</b> ${totalScore || selectedAnswers.reduce((a, _, i) => a + (scores[i] || 0), 0)}</p>
    `;

    // Send email using Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `ROI Submission - ${formData?.firstName || ""} ${formData?.lastName || ""}`,
      html: htmlContent,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("sendEmail error:", err);
    return res.status(500).json({ message: "Error sending email", error: String(err) });
  }
}

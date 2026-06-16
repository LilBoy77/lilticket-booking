import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5055;
const publicBackendUrl = process.env.PUBLIC_BACKEND_URL?.trim();
const isPublicBackendUrlConfigured =
  publicBackendUrl && publicBackendUrl !== "https://your-static-ngrok-domain.ngrok-free.app";

app.listen(PORT, () => {
  console.log(`LilTicket API running on http://localhost:${PORT}`);

  if (!isPublicBackendUrlConfigured) {
    console.warn(
      "PUBLIC_BACKEND_URL is not configured or still placeholder. Set it to your static ngrok URL for Xendit webhooks.",
    );
  } else {
    console.log(`Xendit webhook URL: ${publicBackendUrl}/api/payments/xendit/webhook`);
  }
});

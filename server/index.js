import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RealtimeRelay } from './lib/relay.js';
import { ServerClient } from 'postmark';

dotenv.config({ override: true });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;

if (!OPENAI_API_KEY) {
  console.error(
    `Environment variable "OPENAI_API_KEY" is required.\n` +
      `Please set it in your .env file.`
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 8081;
const app = express();

app.use(cors());
app.use(express.json());

// Initialize Postmark client
const postmarkClient = new ServerClient(POSTMARK_API_KEY);

// Endpoint to send invitations
app.post('/send-invites', async (req, res) => {
  const { recipients, googleSheetLink, roleName, companyName, recruiterName } = req.body;
  try {
    const sendEmailPromises = recipients.map((recipient) => {
      const emailBody = `
        Dear ${recipient.firstName} ${recipient.lastName},

        ${recruiterName} from ${companyName} has invited you to complete a technical interview for the role of ${roleName}.

        Please use the following link to access the test: ${googleSheetLink}

        Best regards,
        ${companyName} Recruitment Team
      `;
      return postmarkClient.sendEmail({
        From: 'yuenler@gbstem.org',
        To: recipient.email,
        Subject: `${companyName} Technical Interview for ${roleName}`,
        TextBody: emailBody,
      });
    });
    await Promise.all(sendEmailPromises);
    res.status(200).send({ message: 'Invitations sent successfully.' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send({ error: 'Failed to send invitations.' });
  }
});

// RealtimeRelay setup
const relay = new RealtimeRelay(OPENAI_API_KEY);
relay.listen(PORT); // Start the RealtimeRelay server and print the listening message

app.listen(PORT + 1, () => {
  console.log(`Server is running on port ${PORT + 1}`);
});

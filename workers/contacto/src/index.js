// Contact form endpoint: POST https://forms.victoresteban.com/contacto.
// Checks the submission, emails it to env.TO through the Email Routing
// binding with Reply-To set to the sender, and redirects to the thank-you
// page in the sender's language. Nothing is stored.
import { EmailMessage } from 'cloudflare:email';
import { ALLOWED_ORIGINS, buildEmail, errorPage, pageUrl, parseSubmission, thanks } from './message.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/contacto' || request.method !== 'POST') {
      return Response.redirect(pageUrl('es'), 303);
    }

    const origin = request.headers.get('Origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return errorPage('es', 403);

    let form;
    try {
      form = await request.formData();
    } catch {
      return errorPage('es', 400);
    }

    const submission = parseSubmission(form);
    // Bots that fill the honeypot see the same success as people.
    if (submission.spam) return thanks(submission.lang);
    if (!submission.ok) return errorPage(submission.lang, 400);

    const raw = buildEmail({
      data: submission.data,
      lang: submission.lang,
      from: env.FROM,
      to: env.TO,
      now: new Date(),
      id: crypto.randomUUID(),
    });
    try {
      await env.MAIL.send(new EmailMessage(env.FROM, env.TO, raw));
    } catch (err) {
      console.error('send failed', err);
      return errorPage(submission.lang, 502);
    }
    return thanks(submission.lang);
  },
};

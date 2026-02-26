import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

export function initMailTransporter() {
  if (!config.smtp.user || !config.smtp.pass) return;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#4f5bd5 0%,#6366f1 100%);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Comic Universe</h1>
</td></tr>
<tr><td style="padding:36px 40px 20px;">
<h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:700;">${title}</h2>
${content}
</td></tr>
<tr><td style="padding:0 40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;">
<p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
&copy; ${new Date().getFullYear()} Comic Universe &mdash; платформа интерактивных комиксов<br/>
Это автоматическое сообщение, отвечать на него не нужно.
</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">${text}</p>`;
}

function buttonBlock(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:linear-gradient(135deg,#4f5bd5 0%,#6366f1 100%);border-radius:10px;padding:14px 36px;">
<a href="${url}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">${text}</a>
</td></tr>
</table>`;
}

function codeBlock(code: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:20px auto;text-align:center;" width="100%">
<tr><td style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;">
<span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#4f5bd5;font-family:monospace;">${code}</span>
</td></tr>
</table>`;
}

function infoBox(text: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
<tr><td style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;">
<p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">${text}</p>
</td></tr>
</table>`;
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export async function sendVerificationCode(to: string, code: string, displayName: string): Promise<boolean> {
  const html = baseLayout('Подтверждение почты', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph('Для завершения регистрации на платформе Comic Universe введите код подтверждения:'),
    codeBlock(code),
    paragraph('Код действителен в течение <strong>15 минут</strong>.'),
    infoBox('Если вы не регистрировались на нашей платформе, просто проигнорируйте это письмо.'),
  ].join(''));
  return sendMail(to, `${code} — код подтверждения Comic Universe`, html);
}

export async function sendPasswordResetLink(to: string, resetUrl: string, displayName: string): Promise<boolean> {
  const html = baseLayout('Сброс пароля', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph('Мы получили запрос на сброс пароля для вашего аккаунта на Comic Universe.'),
    buttonBlock('Сбросить пароль', resetUrl),
    paragraph('Ссылка действительна в течение <strong>1 часа</strong>.'),
    infoBox('Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ваш пароль останется прежним.'),
  ].join(''));
  return sendMail(to, 'Сброс пароля — Comic Universe', html);
}

export async function sendComicApprovedEmail(to: string, displayName: string, comicTitle: string, comicId: string): Promise<boolean> {
  const url = `${config.appUrl}/comic/${comicId}`;
  const html = baseLayout('Комикс одобрен', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph(`Ваш комикс <strong>«${comicTitle}»</strong> успешно прошёл модерацию и теперь доступен всем читателям платформы.`),
    buttonBlock('Открыть комикс', url),
    paragraph('Спасибо за вклад в мир интерактивных историй!'),
  ].join(''));
  return sendMail(to, `Комикс «${comicTitle}» одобрен — Comic Universe`, html);
}

export async function sendComicRejectedEmail(to: string, displayName: string, comicTitle: string, reason?: string): Promise<boolean> {
  const html = baseLayout('Комикс отклонён', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph(`К сожалению, ваш комикс <strong>«${comicTitle}»</strong> не прошёл модерацию.`),
    reason ? infoBox(`<strong>Причина:</strong> ${reason}`) : '',
    paragraph('Вы можете отредактировать комикс и отправить его на повторную проверку.'),
    buttonBlock('Перейти в Студию', `${config.appUrl}/creator/studio`),
  ].join(''));
  return sendMail(to, `Комикс «${comicTitle}» отклонён — Comic Universe`, html);
}

export async function sendBanEmail(to: string, displayName: string, reason: string, until?: string): Promise<boolean> {
  const untilText = until || 'бессрочно';
  const html = baseLayout('Аккаунт заблокирован', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>.`),
    paragraph('Ваш аккаунт на платформе Comic Universe был заблокирован администрацией.'),
    infoBox(`<strong>Причина:</strong> ${reason}<br/><strong>Срок:</strong> до ${untilText}`),
    paragraph('Если вы считаете, что блокировка ошибочна, свяжитесь с администрацией по почте.'),
  ].join(''));
  return sendMail(to, 'Аккаунт заблокирован — Comic Universe', html);
}

export async function sendUnbanEmail(to: string, displayName: string): Promise<boolean> {
  const html = baseLayout('Аккаунт разблокирован', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph('Ваш аккаунт на платформе Comic Universe был разблокирован.'),
    paragraph('Вы снова можете пользоваться всеми функциями платформы.'),
    buttonBlock('Перейти на сайт', config.appUrl),
  ].join(''));
  return sendMail(to, 'Аккаунт разблокирован — Comic Universe', html);
}

export async function sendCreatorApprovedEmail(to: string, displayName: string): Promise<boolean> {
  const html = baseLayout('Заявка на создателя одобрена', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph('Поздравляем! Ваша заявка на получение статуса создателя была <strong>одобрена</strong>.'),
    paragraph('Теперь вам доступна Студия — создавайте свои интерактивные истории и публикуйте их для читателей.'),
    buttonBlock('Открыть Студию', `${config.appUrl}/creator/studio`),
  ].join(''));
  return sendMail(to, 'Вы стали создателем — Comic Universe', html);
}

export async function sendCreatorRejectedEmail(to: string, displayName: string, reason?: string): Promise<boolean> {
  const html = baseLayout('Заявка на создателя отклонена', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>.`),
    paragraph('К сожалению, ваша заявка на получение статуса создателя была <strong>отклонена</strong>.'),
    reason ? infoBox(`<strong>Причина:</strong> ${reason}`) : '',
    paragraph('Вы можете подать новую заявку из профиля.'),
  ].join(''));
  return sendMail(to, 'Заявка отклонена — Comic Universe', html);
}

export async function sendNewCommentEmail(to: string, displayName: string, comicTitle: string, commenterName: string, comicId: string): Promise<boolean> {
  const url = `${config.appUrl}/comic/${comicId}`;
  const html = baseLayout('Новый комментарий', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph(`<strong>${commenterName}</strong> оставил комментарий к вашему комиксу <strong>«${comicTitle}»</strong>.`),
    buttonBlock('Посмотреть', url),
  ].join(''));
  return sendMail(to, `Новый комментарий к «${comicTitle}» — Comic Universe`, html);
}

export async function sendReportResolvedEmail(to: string, displayName: string, comicTitle: string): Promise<boolean> {
  const html = baseLayout('Жалоба рассмотрена', [
    paragraph(`Здравствуйте, <strong>${displayName}</strong>!`),
    paragraph(`Ваша жалоба на комикс <strong>«${comicTitle}»</strong> была рассмотрена администрацией.`),
    paragraph('Благодарим за то, что помогаете поддерживать качество контента на платформе.'),
  ].join(''));
  return sendMail(to, 'Жалоба рассмотрена — Comic Universe', html);
}

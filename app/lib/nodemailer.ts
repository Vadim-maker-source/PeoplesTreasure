import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
})

export const sendSupportEmail = async (
  fromName: string,
  subject: string,
  message: string,
  userEmail: string
) => {
  try {
    const mailOptions = {
      from: `"Поддержка сайта" <${process.env.GMAIL_USER}>`,
      replyTo: userEmail,
      to: process.env.GMAIL_USER,
      subject: `Поддержка: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; border-bottom: 2px solid #FF7340; padding-bottom: 10px;">
            Новое обращение в поддержку
          </h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Отправитель:</strong> ${fromName}</p>
            ${userEmail ? `<p><strong>Email для ответа:</strong> ${userEmail}</p>` : ''}
            <p><strong>Тема:</strong> ${subject}</p>
            <p><strong>Дата отправки:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Сообщение:</h3>
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
            <p>Это письмо было отправлено через форму обратной связи на сайте.</p>
          </div>
        </div>
      `,
      text: `
Новое обращение в поддержку

Отправитель: ${fromName}
${userEmail ? `Email для ответа: ${userEmail}\n` : ''}
Тема: ${subject}
Дата отправки: ${new Date().toLocaleString('ru-RU')}

Сообщение:
${message}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Письмо отправлено успешно:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
};

export default transporter;
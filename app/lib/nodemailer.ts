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

export const sendModerationEmail = async ({
  postId,
  postTitle,
  authorName,
  authorEmail,
}: {
  postId: string;
  postTitle: string;
  authorName: string;
  authorEmail: string;
}) => {
  try {
      const adminEmail = process.env.GMAIL_USER;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const moderationLink = `${baseUrl}/admin/moderate?post=${postId}`;

      const mailOptions = {
          from: `"Народное Достояние" <${process.env.GMAIL_USER}>`,
          to: adminEmail,
          subject: `🔔 Новый пост на модерацию: ${postTitle}`,
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                  <h2 style="color: #FF7340; border-bottom: 2px solid #FF7340; padding-bottom: 10px;">
                      Новый пост требует модерации
                  </h2>
                  
                  <div style="margin: 20px 0;">
                      <p><strong>Автор:</strong> ${authorName}</p>
                      <p><strong>Email автора:</strong> ${authorEmail}</p>
                      <p><strong>Название поста:</strong> ${postTitle}</p>
                      <p><strong>Дата отправки:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                  </div>
                  
                  <div style="margin: 30px 0; text-align: center;">
                      <a href="${moderationLink}" 
                         style="background-color: #FF7340; color: white; padding: 12px 24px; 
                                text-decoration: none; border-radius: 5px; font-weight: bold;
                                display: inline-block;">
                          Перейти к модерации
                      </a>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                      <p>Это письмо отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
                  </div>
              </div>
          `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Письмо админу отправлено успешно:', info.messageId);
      return { success: true, messageId: info.messageId };
  } catch (error) {
      console.error('Ошибка отправки письма админу:', error);
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
  }
};

export const sendModerationResultEmail = async (
  userEmail: string,
  postTitle: string,
  action: 'approve' | 'reject'
) => {
  try {
      const subject = action === 'approve' 
          ? '✅ Ваш пост одобрен' 
          : '❌ Ваш пост отклонен';
      
      const message = action === 'approve'
          ? 'Ваш пост прошел модерацию и теперь опубликован на сайте.'
          : 'К сожалению, ваш пост не прошел модерацию. Пожалуйста, ознакомьтесь с правилами публикации и попробуйте снова.';

      const mailOptions = {
          from: `"Народное Достояние" <${process.env.GMAIL_USER}>`,
          to: userEmail,
          subject: subject,
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                  <h2 style="color: ${action === 'approve' ? '#4CAF50' : '#f44336'}; border-bottom: 2px solid ${action === 'approve' ? '#4CAF50' : '#f44336'}; padding-bottom: 10px;">
                      ${subject}
                  </h2>
                  
                  <div style="margin: 20px 0;">
                      <p>Здравствуйте!</p>
                      <p>${message}</p>
                      <p><strong>Название поста:</strong> ${postTitle}</p>
                  </div>
                  
                  ${action === 'approve' ? `
                      <div style="margin: 30px 0; text-align: center;">
                          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/forum" 
                             style="background-color: #FF7340; color: white; padding: 12px 24px; 
                                    text-decoration: none; border-radius: 5px; font-weight: bold;
                                    display: inline-block;">
                              Перейти к постам
                          </a>
                      </div>
                  ` : ''}
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                      <p>С уважением, команда "Народное Достояние"</p>
                  </div>
              </div>
          `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Письмо пользователю отправлено успешно:', info.messageId);
      return { success: true, messageId: info.messageId };
  } catch (error) {
      console.error('Ошибка отправки письма пользователю:', error);
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
  }
};

export default transporter;

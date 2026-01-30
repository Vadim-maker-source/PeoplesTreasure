'use server';

import { sendSupportEmail } from '@/app/lib/nodemailer';

export async function submitSupportForm(formData: FormData) {
  try {
    const fromName = formData.get('fromName') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const userEmail = formData.get('userEmail') as string

    if (!subject) {
      return { success: false, error: 'Пожалуйста, укажите тему сообщения' };
    }

    if (!message) {
      return { success: false, error: 'Пожалуйста, напишите сообщение' };
    }

    const result = await sendSupportEmail(
      fromName,
      subject,
      message,
      userEmail
    );

    if (result.success) {
      return { 
        success: true, 
        message: 'Ваше сообщение успешно отправлено! Мы ответим вам в ближайшее время.' 
      };
    } else {
      return { 
        success: false, 
        error: `Ошибка при отправке: ${result.error || 'Попробуйте позже'}` 
      };
    }
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: 'Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.' 
    };
  }
}
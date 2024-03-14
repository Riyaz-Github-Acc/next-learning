import nodemailer, { Transporter } from 'nodemailer'
import ejs from 'ejs'
import path from 'path'

require('dotenv').config()

const sendMail = async (emailOptions: EmailOptionsProps): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const { email, subject, template, data } = emailOptions
  const templatePath = path.join(__dirname, '../mails', template)
  const html: string = await ejs.renderFile(templatePath, data)
  console.log(html, 'html')
  console.log(templatePath, 'templatePath')
  console.log(emailOptions, 'emailOptions')

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  }

  await transporter.sendMail(mailOptions)
}

export default sendMail

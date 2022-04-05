import email from 'emailjs'
import jade from 'jade'

exports.sendEmail = (data) => {
  const forgotTemplate = jade.renderFile(data.file, data.reservation)
  const user = process.env.CREDENTIALS_EMAIL_USER
  const password = process.env.CREDENTIALS_EMAIL_PASSWORD
  const host = process.env.CREDENTIALS_EMAIL_SERVER

  if (user && password && host) {
    const server = email.server.connect({ user, password, host, ssl: true })
    const message = {
      text: 'travel deluxe',
      from: `Reservación ${data.client.first_name} ${data.client.last_name} <agenciatraveldeluxe0104@gmail.com>`,
      to: data.email,
      cc: '',
      subject: data.subject,
      attachment: [{
        data: forgotTemplate,
        alternative: true
      }]
    }

    server.send(message, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log('Mensaje Enviado')
        return message
      }
    })
  }
}

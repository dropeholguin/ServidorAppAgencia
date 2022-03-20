import email from 'emailjs'
import jade from 'jade'

exports.sendEmail = (data) => {
  const forgotTemplate = jade.renderFile(data.file, data.body)
  const user = process.env.CREDENTIALS_EMAIL_USER
  const password = process.env.CREDENTIALS_EMAIL_PASSWORD
  const host = process.env.CREDENTIALS_EMAIL_SERVER
  if (user && password && host) {
    const server = email.server.connect({ user, password, host, ssl: true })
    const message = {
      text: 'codytion',
      from: `Reserva ${data.nameCompany} <notifications@codytion.com>`,
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

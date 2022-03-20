import { validateToken } from './general'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jade from 'jade'
import email from 'emailjs'
import moment from 'moment'

exports.recoveryPasswordFirstSession = async (req, res, jwt, secret) => {
  const body = req.body
  try {
    if (body) {
      const {
        password,
        token,
        email: dataEmail
      } = body.password
      if (dataEmail) {
        const {
          id
        } = jwt.verify(token, secret)
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)
        const hashRadius = await crypto.createHash('md5').update(password).digest('hex')
        const result = await req.app.db.models.user.updateOne({
          '_id': id
        }, {
          $set: {
            email: dataEmail,
            password: hash,
            passwordRadius: hashRadius
          }
        })
        if (result) {
          res.send('ok')
        }
      } else {
        res.status(404).send({
          isCreate: false,
          msj: 'no existe campo correo!'
        })
      }
    } else {
      res.status(404).send({
        isCreate: false,
        msj: 'no hay body!'
      })
    }
  } catch (err) {
    console.log('salida ->' + err)
  }
}
/**
 * Funcion para enviar el correo de recuperacion de contraseña
 */
exports.recoveryPassword = async (req, res, jwt, secret) => {
  const body = req.body
  try {
    if (body) {
      const {
        email: dataEmail
      } = body
      if (dataEmail) {
        const user = await req.app.db.models.user.findOne({
          '$or': [{
            'email': String(dataEmail)
          }, {
            'username': String(dataEmail)
          }]
        }, {
          '_id': 1,
          'email': 1,
          'company': 1
        })

        if (user) {
          const token = jwt.sign({
            id: user._id,
            company: user.company
          }, secret, {
            expiresIn: '7d'
          })
          const anio = moment().format('YYYY')
          const forgotTemplate = jade.renderFile('./views/email/recovery.jade', {
            projectName: 'codytion',
            token,
            server: '',
            email: user.email,
            anio
          })
          const message = {
            text: 'codytion',
            from: 'booking@codytion.com',
            to: user.email ? user.email : '',
            cc: '',
            subject: 'Recuperar contraseña',
            attachment: [{
              data: forgotTemplate,
              alternative: true
            }]
          }

          const server = email.server.connect({
            user: 'booking@codytion.com',
            password: 'BookingsTk',
            host: 'smtp.gmail.com',
            ssl: true
          })

          server.send(message, (err) => {
            if (err) {
              console.log('Ocurrio un error al enviar')
            } else {
              console.log('Mensaje Enviado')
              res.send('ok')
            }
          })
        } else {
          res.status(404).send({
            isCreate: false,
            msj: 'El correo no existe!'
          })
        }
      } else {
        res.status(404).send({
          isCreate: false,
          msj: 'no existe campo correo!'
        })
      }
    } else {
      res.status(404).send({
        isCreate: false,
        msj: 'no hay body!'
      })
    }
  } catch (err) {
    console.log('salida ->' + err)
  }
}

/** se cambia la contraseña de un usuario */
exports.changePassword = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    if (body) {
      const {
        password,
        token
      } = body.password

      const {
        id
      } = jwt.verify(token, secret)
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(password, salt)
      const hashRadius = await crypto.createHash('md5').update(password).digest('hex')
      await req.app.db.models.user.updateOne({
        '_id': id
      }, {
        $set: {
          password: hash,
          passwordRadius: hashRadius
        }
      })
      res.send('ok')
    } else {
      res.status(404).send({
        isCreate: false,
        msj: 'no hay body!'
      })
    }
  } catch (error) {
    console.log(error)
    res.status(404).send({
      isCreate: false,
      msj: 'Error en el servidor!'
    })
  }
}

exports.validateSession = async (req, res, jwt, secret) => {
  try {
    const { id } = await validateToken(req, jwt, secret)
    const {
      email,
      document,
      first_name: firstName,
      last_name: lastName,
      rol,
      image
    } = await req.app.db.models.user.findById(id, {
      'first_name': 1,
      'last_name': 1,
      'email': 1,
      'rol': 1,
      'image': 1
    })
    /**  genero un token con el id del usuario, luego lo anido al secreto, luego declaro cuando expira */
    res.send({
      user: {
        first_name: firstName,
        last_name: lastName,
        document,
        email,
        rol,
        image
      }
    })
  } catch (error) {
    res.status(404).send(error.message)
  }
}

/** borra la sesion de los servidores */
exports.actionLogout = (_req, res) => {
  res.status(200).send({
    result: true,
    message: 'Salió exitosamente!'
  })
}

/** se usa para validar el usuario y asignar un token */
exports.userLogin = async (req, res, jwt, secret) => {
  // confirm that user typed same password twice
  try {
    if (req.body.email && req.body.password) {
      req.app.db.models.user.authenticate(req.body.email, req.body.password, async function (error, user) {
        if (error || !user) {
          res.status(200).send({
            result: false,
            error: 'La contraseña o el usuario no es válida.'
          })
        } else {
          /**  genero un token con el id del usuario, luego lo anido al secreto, luego declaro cuando expira */
          const token = jwt.sign({
            id: user._id,
            company: user.company
          }, secret, {
            expiresIn: '7d'
          })
          let {
            email,
            document,
            first_name: firstName,
            last_name: lastName,
            rol,
            image
          } = user
          /** envia el token */
          return res.send({
            result: true,
            token: { access_token: token },
            user: {
              first_name: firstName,
              last_name: lastName,
              document,
              email,
              rol,
              image
            }
          })
        }
      })
    } else {
      res.status(200).send({ result: false, error: 'Agrega usuario y contraseña.' })
    }
  } catch (error) {
    res.status(404).send({ result: false, error: error.message })
  }
}

exports.confirmAccount = async (req, res, jwt, secret) => {
  // confirm that user typed same password twice
  try {
    let idUser = req.body.idUser
    idUser = idUser.replace('se285', '')
    if (idUser) {
      const result = await req.app.db.models.user.updateOne({
        '_id': idUser
      }, {
        $set: {
          ultimate_session: new Date()
        }
      })
      if (result) {
        res.status(200).send('ok')
      }
    } else {
      res.status(404).send('Datos Vacios!')
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

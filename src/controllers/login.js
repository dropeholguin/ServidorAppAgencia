import { validateToken } from './general'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

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
            rol: user.rol
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

import { validateToken } from './general'
import _ from 'lodash'
import { ROL_CLIENT, ROL_EMPLOYEE } from './general/roles'
import uploadImage from '../util/uploadImage'

exports.createUser = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    const { id, company } = validateToken(req, jwt, secret)
    const userData = {
      first_name: body.first_name,
      last_name: body.last_name,
      document: body.document,
      email: body.email,
      gender: body.gender,
      username: body.document,
      password: body.password ? body.password : '',
      phone: body.phone,
      rol: body.rol,
      address: body.address
    }
    const base64Image = body.file ? body.file.image : null
    const imageName = body.file ? body.file.imageName : null

    userData.usuario_creador = id
    userData.company = body.company ? body.company.value : company

    delete body._id
    delete body.fecha_creacion
    delete body.fecha_actualizacion
    delete body.usuario_actualiza
    // valida si es nulo por defecto en javascrip si no colocas nada el entiende que si es nulo no entra
    if (body) {
      const result = await req.app.db.models.user.create(userData)
      if (result) {
        if (base64Image) {
          await uploadImage(imageName, base64Image, req, result._id, 'user')
        }
        res.send('ok')
      }
    } else {
      // errores personalizados
      res.status(404).send({
        msj: 'Contenido Invalido!'
      })
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

exports.updateUser = async (req, res, jwt, secret) => {
  try {
    const user = req.body
    const { id } = validateToken(req, jwt, secret)

    user.usuario_actualiza = id
    user.fecha_actualizacion = new Date()
    const base64Image = user.file ? user.file.image : null
    const imageName = user.file ? user.file.imageName : null

    if (!user.password) {
      delete user.password
    }
    delete user.usuario_creador
    if (user) {
      const result = await req.app.db.models.user.updateOne({_id: user._id}, user)
      if (result) {
        if (base64Image) {
          await uploadImage(imageName, base64Image, req, user._id)
        }
        res.send('ok')
      }
    } else {
      // errores personalizados
      throw new Error('Agrega los datos correspondientes')
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

exports.deleteUser = async (req, res, jwt, secret) => {
  try {
    /** valido el token */
    validateToken(req, jwt, secret)
    const user = req.body
    if (user && user._id) {
      const result = await req.app.db.models.user.updateOne({
        _id: user._id
      }, {
        $set: {
          stateDelete: true
        }
      })
      if (result) {
        res.send('borrado')
      }
    } else {
      // errores personalizados
      throw new Error('Agrega los datos correspondientes')
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listUsers = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const { rol } = req.params
    // se listan los dispositivos
    let resultUsers = await req.app.db.models.user.find({ rol: rol, stateDelete: false })
      .populate('usuario_actualiza')
      .populate('usuario_creador')

    resultUsers = await Promise.all(resultUsers.map(async u => {
      let user = u.toJSON()
      return { ...user }
    }))

    if (resultUsers) {
      res.status(200).send(resultUsers)
    }
  } catch (error) {
    console.log(error)
    res.status(404).send(error.message)
  }
}

exports.listByIdUser = async (req, res, jwt, secret) => {
  try {
    /** valido el token */
    validateToken(req, jwt, secret)
    const { id } = req.params
    /** se busca el registro por id */
    let user = await req.app.db.models.user
      .findById(id)
      .populate('company')
      .populate('services')
      .populate('locations')

    if (user) {
      const newUser = {
        ...user.toJSON(),
        password: ''
      }
      res.send(newUser)
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

exports.findUserByIdentification = async (req, res, jwt, secret) => {
  try {
    /** valido el token */
    await validateToken(req, jwt, secret)
    const { document } = req.body
    /** se busca el registro por id */

    const user = await req.app.db.models.user.find(
      { document, rol: ROL_CLIENT },
      {
        estado: 1,
        _id: 1,
        first_name: 1,
        last_name: 1,
        document: 1,
        email: 1,
        gender: 1,
        username: 1,
        phone: 1,
        address: 1,
        fecha_creacion: 1
      }
    )

    const result = user && user.length > 0 ? user.shift() : {}
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
}

exports.listClientSelect = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    let clients = await req.app.db.models.user.find({rol: ROL_CLIENT, stateDelete: false})
    let newClients = clients.map(client => {
      return {
        label: `${client.first_name} ${client.last_name}`,
        value: client._id
      }
    })

    if (newClients) {
      res.status(200).send(newClients)
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

exports.listEmployeeSelect = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    let employees = await req.app.db.models.user.find({rol: ROL_EMPLOYEE, stateDelete: false})
    let newEmployees = employees.map(employee => {
      return {
        label: `${employee.first_name} ${employee.last_name}`,
        value: employee._id
      }
    })

    if (newEmployees) {
      res.status(200).send(newEmployees)
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
}

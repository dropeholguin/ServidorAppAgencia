// eslint-disable-next-line standard/object-curly-even-spacing
import { validateToken } from './general'
import _ from 'lodash'
import 'jspdf-autotable'

exports.createMinorBox = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    const {
      id
    } = validateToken(req, jwt, secret)
    body.usuario_creador = id

    delete body._id
    delete body.fecha_creacion
    delete body.fecha_actualizacion
    delete body.usuario_actualiza

    // valida si es nulo por defecto en javascrip si no colocas nada el entiende que si es nulo no entra
    if (body) {
      const result = await req.app.db.models.minorbox.create(body)
      if (result) {
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

exports.updateMinorBox = async (req, res, jwt, secret) => {
  try {
    const minorbox = req.body
    const { id } = validateToken(req, jwt, secret)
    minorbox.usuario_actualiza = id
    minorbox.fecha_actualizacion = new Date()
    delete minorbox.usuario_creador

    if (minorbox) {
      const result = await req.app.db.models.minorbox.updateOne({
        '_id': minorbox._id
      }, minorbox)
      if (result) {
        res.send('ok')
      }
    } else {
      throw new Error('Ingrese los datos')
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listMinorBox = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    let minorboxs = await req.app.db.models.minorbox.find({}).sort({creation_date: -1}).populate('usuario_actualiza').populate('usuario_creador')
    if (minorboxs) {
      res.status(200).send(minorboxs)
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listByIdMinorBox = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    let minorbox = await req.app.db.models.minorbox.findById(id)
    res.send(minorbox)
  } catch (error) {
    res.status(404).send(error)
  }
}

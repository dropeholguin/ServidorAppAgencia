// eslint-disable-next-line standard/object-curly-even-spacing
import { validateToken } from './general'
import _ from 'lodash'
import 'jspdf-autotable'
import uploadImage from '../util/uploadImage'

exports.createPromotion = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    const {
      id
    } = validateToken(req, jwt, secret)
    body.usuario_creador = id
    const base64Image = body.file ? body.file.image : null
    const imageName = body.file ? body.file.imageName : null

    delete body._id
    delete body.fecha_creacion
    delete body.fecha_actualizacion
    delete body.usuario_actualiza

    // valida si es nulo por defecto en javascrip si no colocas nada el entiende que si es nulo no entra
    if (body) {
      const result = await req.app.db.models.promotion.create(body)
      if (result) {
        if (base64Image) {
          await uploadImage(imageName, base64Image, req, result._id, 'promotion')
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

exports.updatePromotion = async (req, res, jwt, secret) => {
  try {
    const promotion = req.body
    const { id } = validateToken(req, jwt, secret)
    promotion.usuario_actualiza = id
    promotion.fecha_actualizacion = new Date()
    delete promotion.usuario_creador

    if (promotion) {
      const result = await req.app.db.models.promotion.updateOne({
        '_id': promotion._id
      }, promotion)
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

exports.listPromotion = async (req, res, jwt, secret) => {
  try {
    let promotions = await req.app.db.models.promotion.find({}).sort({creation_date: -1}).populate('usuario_actualiza').populate('usuario_creador')
    if (promotions) {
      res.status(200).send(promotions)
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listByIdPromotion = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    let promotion = await req.app.db.models.promotion.findById(id)
    res.send(promotion)
  } catch (error) {
    res.status(404).send(error)
  }
}

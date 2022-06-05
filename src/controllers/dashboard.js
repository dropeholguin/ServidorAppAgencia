import { validateToken } from './general'
import { ROL_CLIENT } from './general/roles'
import 'moment/locale/es.js'
import _ from 'lodash'

exports.stadisticsDasboard = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)

    let contacts = await req.app.db.models.user
      .find({ rol: ROL_CLIENT, stateDelete: false }).sort({ fecha_creacion: -1 })

    let reservations = await req.app.db.models.reservation
      .find({}, ['uid', 'client', 'fecha_creacion', 'price'])
      .sort({ fecha_creacion: -1 })
      .populate('client', { first_name: 1, last_name: 1 })

    let cotizations = await req.app.db.models.cotization
      .find({}, ['uid', 'client', 'fecha_creacion', 'price'])
      .sort({ fecha_creacion: -1 })
      .populate('client', { first_name: 1, last_name: 1 })

    let stadistics = {
      totalClients: contacts.length,
      totalReservations: reservations.length,
      totalCotizations: cotizations.length
    }
    res.status(200).send(stadistics)
  } catch (error) {
    console.log(error)
    res.status(404).send(error)
  }
}

exports.filterReservation = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const body = req.body
    let filter = {}
    let reservations = []

    if (body.status) {
      filter.statusPayment = body.status
    }
    if (body.client && body.client.value) {
      filter.client = body.client.value
    }
    if (body.employee && body.employee.value) {
      filter.usuario_creador = body.employee.value
    }
    if (body.startDate && body.endDate) {
      filter.creation_date = {
        $gte: new Date(body.startDate),
        $lt: new Date(body.endDate)
      }
    }

    if (!_.isEmpty(filter)) {
      reservations = await req.app.db.models.reservation.find(filter)
        .sort({creation_date: -1})
        .populate('client')
        .populate('usuario_actualiza')
        .populate('usuario_creador')
    }

    res.status(200).send(reservations)
  } catch (error) {
    console.log(error)
    res.status(404).send(error)
  }
}

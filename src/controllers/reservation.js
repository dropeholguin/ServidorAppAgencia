// eslint-disable-next-line standard/object-curly-even-spacing
import { validateToken, logo, getImagesDestination} from './general'
import _ from 'lodash'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import moment from 'moment'
import crypto from 'crypto'
import randomColor from 'randomcolor'
import { STATUS_DEBE, STATUS_PAGADA } from './general/status'
import { ROL_EMPLOYEE } from './general/roles'
import { sendEmail } from '../util/sendEmail'
import cryptoRandomInt from 'crypto-random-int'

exports.createReservation = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    const {
      id
    } = validateToken(req, jwt, secret)
    let uid = crypto.randomBytes(4).toString('hex').toUpperCase()
    body.usuario_creador = id
    body.client = body.client[0].value
    body.uid = uid
    body.statusPayment = body.isTotal ? STATUS_PAGADA : STATUS_DEBE
    if (body.payment) {
      body.payments = [{price: parseInt(body.payment), date: moment().format('DD-MM-YYYY hh:mm a')}]
    }
    delete body._id
    delete body.fecha_creacion
    delete body.fecha_actualizacion
    delete body.usuario_actualiza
    // valida si es nulo por defecto en javascrip si no colocas nada el entiende que si es nulo no entra
    if (body) {
      const result = await req.app.db.models.reservation.create(body)
      if (result) {
        const client = await req.app.db.models.user.findById(result.client)
        sendEmail({
          email: client.email,
          subject: `Notificación ${client.first_name} ${client.last_name}`,
          client,
          body: {
            uid: result.uid,
            client: `${client.first_name} ${client.last_name}`,
            date: moment(result.creation_date).format('DD-MM-YYYY hh:mm'),
            email: client.email,
            document: client.document,
            phone: client.phone,
            destination: result.destination,
            hotel: result.hotel,
            numPeople: result.numPeople,
            airline: result.airline,
            dateReservation: result.date,
            price: `$ ${Math.round(result.price).toLocaleString('es-CO')}`
          },
          file: './src/views/email/reservation.jade'
        })
        res.send('ok')
      }
    } else {
      // errores personalizados
      res.status(404).send({
        msj: 'Contenido Invalido!'
      })
    }
  } catch (error) {
    console.log(error)
    res.status(404).send(error.message)
  }
}

exports.updateReservation = async (req, res, jwt, secret) => {
  try {
    const reservation = req.body
    const { id } = validateToken(req, jwt, secret)
    reservation.usuario_actualiza = id
    reservation.fecha_actualizacion = new Date()
    reservation.client = reservation.client[0].value
    delete reservation.usuario_creador

    if (reservation) {
      const result = await req.app.db.models.reservation.updateOne({
        '_id': reservation._id
      }, reservation)
      if (result) {
        res.send('ok')
      }
    } else {
      throw new Error('el body no tiene datos')
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listReservation = async (req, res, jwt, secret) => {
  try {
    const { id, rol } = validateToken(req, jwt, secret)
    let reservations = rol === ROL_EMPLOYEE
      ? await req.app.db.models.reservation.find({usuario_creador: id}).sort({creation_date: -1}).populate('client').populate('usuario_actualiza').populate('usuario_creador')
      : await req.app.db.models.reservation.find({}).sort({creation_date: -1}).populate('client').populate('usuario_actualiza').populate('usuario_creador')
    if (reservations) {
      res.status(200).send(reservations)
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listByIdReservation = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    let reservation = await req.app.db.models.reservation.findById(id).populate('client')
    let client = [{
      label: `${reservation.client.first_name} ${reservation.client.last_name}`,
      value: reservation.client._id
    }]
    delete reservation.client
    const newReservation = {
      ...reservation.toJSON(),
      client
    }
    res.send(newReservation)
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listReservationCalendar = async (req, res, jwt, secret) => {
  try {
    const { id, rol } = validateToken(req, jwt, secret)
    let reservations = rol === ROL_EMPLOYEE
      ? await req.app.db.models.reservation.find({usuario_creador: id}).sort({creation_date: -1}).populate('client').populate('usuario_actualiza').populate('usuario_creador')
      : await req.app.db.models.reservation.find({}).sort({creation_date: -1}).populate('client').populate('usuario_actualiza').populate('usuario_creador')
    let eventsReservation = []
    for (const reservation of reservations) {
      let dateStart = reservation.date.split(' - ')[0]
      let dateEnd = reservation.date.split(' - ')[1]
      eventsReservation.push({
        id: reservation._id,
        title: `Reserva: #${reservation.uid} - Cliente: ${reservation.client.first_name} ${reservation.client.last_name}`,
        allDay: true,
        start: moment(dateStart, 'DD/MM/YYYY hh:mm A').toDate(),
        end: dateEnd !== 'Fecha inválida' ? moment(dateEnd, 'DD/MM/YYYY hh:mm A').toDate() : moment(dateStart, 'DD/MM/YYYY hh:mm A').toDate(),
        color: randomColor({
          luminosity: 'light',
          hue: 'random',
          format: 'rgb'
        }),
        reservation
      })
    }
    if (eventsReservation) {
      res.status(200).send(eventsReservation)
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.addPaymentReservation = async (req, res, jwt, secret) => {
  try {
    const data = req.body
    const { id } = validateToken(req, jwt, secret)
    let reservation = await req.app.db.models.reservation.findById(data._id)
    let total = 0
    data.payments.payments.map(p => (total += p.price))
    let status = total === reservation.price ? STATUS_PAGADA : STATUS_DEBE

    if (data) {
      const result = await req.app.db.models.reservation.updateOne({
        '_id': data._id
      }, {
        $set: {
          statusPayment: status,
          payments: data.payments.payments,
          usuario_actualiza: id,
          fecha_actualizacion: new Date()
        }
      })
      if (result) {
        res.send('ok')
      }
    } else {
      throw new Error('el body no tiene datos')
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.generatePdfReservation = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({orientation: 'p', unit: 'mm', format: 'a4'})
    const reservation = await req.app.db.models.reservation.findById(id).populate('client')
    let bodyTable = []
    let images = await getImagesDestination(reservation.destination)
    for (const attr of reservation.attributesPlan) {
      bodyTable.push([attr.key + 1, attr.name])
    }
    doc.addImage(logo, 'image/png', 150, 4, 50, 70)
    doc.setFontSize(45)
    doc.setFont('helvetica', 'bold')
    doc.text('RESERVACIÓN', 15, 15)
    doc.setFontSize(13)
    doc.setFont('times', 'normal')
    doc.text('TRAVEL DELUXE', 15, 30)
    doc.text('NIT. 94357933-1', 15, 35)
    doc.text('CRA 18 No. 6 - 03 Roldanillo Valle del Cauca - Colombia', 15, 45)
    doc.text('Tel: +57 315 4720982 | 22 99710', 15, 50)
    doc.setFont('courier', 'bold')
    doc.text('¡SIEMPRE HAY ALGUN LUGAR', 100, 30, null, null, 'center')
    doc.text('NUEVO POR DESCUBRIR!', 100, 35, null, null, 'center')
    doc.setFont('times', 'bold')
    doc.text('Datos del Cliente', 15, 70)
    doc.text('N° Reservación', 120, 70)
    doc.text(reservation.uid, 120, 77)
    doc.text('Fecha Reservación', 120, 88)
    doc.text(moment(reservation.creation_date).format('DD-MM-YYYY'), 120, 95)
    doc.setFont('times', 'normal')
    doc.text(reservation.client.first_name.toUpperCase() + ' ' + reservation.client.last_name.toUpperCase(), 15, 77)
    doc.text(`CC. ${reservation.client.document}`, 15, 82)
    doc.text(reservation.client.address, 15, 90)
    doc.text(reservation.client.email, 15, 95)
    doc.setFont('times', 'bold')
    doc.text('DESCRIPCIÓN DEL PRODUCTO', 15, 110)
    doc.text('DESTINO: ', 20, 120)
    doc.text('HOTEL: ', 20, 125)
    doc.text('FECHA DEL VIAJE: ', 20, 130)
    doc.text('AEROLINEA: ', 20, 135)
    doc.setFont('times', 'normal')
    doc.text(reservation.destination, 75, 120)
    doc.text(reservation.hotel, 75, 125)
    doc.text(reservation.date, 75, 130)
    doc.text(reservation.airline, 75, 135)
    if (images && images.length > 0) {
      if (images.length === 1) {
        doc.addImage(images[0], 15, 145, 180, 90)
      } else if (images.length === 2) {
        doc.addImage(images[0], 15, 145, 180, 90)
        doc.addImage(images[1], 15, 240, 85, 55)
      } else {
        doc.addImage(images[0], 15, 145, 180, 90)
        doc.addImage(images[1], 15, 240, 85, 55)
        doc.addImage(images[2], 110, 240, 85, 55)
      }
    }
    doc.insertPage(2)
    doc.autoTable({
      theme: 'grid',
      styles: {
        fontSize: 13,
        font: 'times'
      },
      margin: { top: 10 },
      head: [['', 'SERVICIOS QUE INCLUYE TU PLAN']],
      body: bodyTable,
      foot: [['VALOR RESEVACIÓN', `$ ${Math.round(reservation.price).toLocaleString('es-CO')}`]]
    })
    doc.autoTable({
      theme: 'plain',
      styles: {
        fontSize: 13,
        font: 'times'
      },
      margin: { top: 0 },
      head: [['NOTAS IMPORTANTES']],
      body: [[reservation.notes]]
    })

    const invoicePDF = Buffer.from(new Uint8Array(doc.output('arraybuffer'))).toString('base64')
    if (invoicePDF) {
      res.status(200).send(invoicePDF)
    }
  } catch (error) {
    console.log(error)
    res.status(404).send(error)
  }
}

exports.generateInvoice = async (req, res, jwt, secret) => {
  try {
    const { id } = validateToken(req, jwt, secret)
    const {
      id: reservationId
    } = req.params
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({orientation: 'p', unit: 'mm', format: 'a4'})
    const reservation = await req.app.db.models.reservation.findById(reservationId).populate('client')
    let invoice = await req.app.db.models.invoice.findOne({reservation: reservation.id})
    if (!invoice) {
      invoice = await req.app.db.models.invoice.create({
        reservation: reservation.id,
        client: reservation.client.id,
        uid: await cryptoRandomInt(0, 1000000),
        total: reservation.price,
        usuario_creador: id
      })
    }
    doc.addImage(logo, 'image/png', 150, 4, 50, 70)
    doc.setFontSize(45)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURA', 15, 15)
    doc.setFontSize(13)
    doc.setFont('times', 'normal')
    doc.text('TRAVEL DELUXE', 15, 30)
    doc.text('NIT. 94357933-1', 15, 35)
    doc.text('CRA 18 No. 6 - 03 Roldanillo Valle del Cauca - Colombia', 15, 45)
    doc.text('Tel: +57 315 4720982 | 22 99710', 15, 50)
    doc.setFont('courier', 'bold')
    doc.text('¡LA MEJOR EXPERIENCIA EN VIAJES!', 100, 30, null, null, 'center')
    doc.setFont('times', 'bold')
    doc.text('Datos del Cliente', 15, 70)
    doc.text('N° Factura', 120, 70)
    doc.text(invoice.uid, 120, 77)
    doc.text('Fecha Factura', 120, 88)
    doc.text(moment(invoice.creation_date).format('DD-MM-YYYY'), 120, 95)
    doc.setFont('times', 'normal')
    doc.text(reservation.client.first_name.toUpperCase() + ' ' + reservation.client.last_name.toUpperCase(), 15, 77)
    doc.text(`CC. ${reservation.client.document}`, 15, 82)
    doc.text(reservation.client.address, 15, 90)
    doc.text(reservation.client.email, 15, 95)
    doc.autoTable({
      theme: 'striped',
      styles: {
        fontSize: 13,
        font: 'times'
      },
      margin: { top: 110 },
      head: [['Descripción', 'Cant.', 'Valor']],
      body: [
        [`Reservación a ${reservation.destination} en el hotel ${reservation.hotel}, para ${reservation.numPeople} personas.`, '1', `$ ${Math.round(invoice.total).toLocaleString('es-CO')}`],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ],
      foot: [['', 'Total Factura', `$ ${Math.round(invoice.total).toLocaleString('es-CO')}`]]
    })

    doc.autoTable({
      theme: 'plain',
      styles: {
        fontSize: 10,
        font: 'times'
      },
      margin: { top: 0 },
      head: [['NOTA IMPORTANTE']],
      body: [['El cumplimiento con ley de 679 de 2011 y la resolución 3840 de 2009, la Agencia de viajes Travel Deluxe se acoge al código de conducta con el fin de prevenir y contrarrestar la explotación la pornografía y el turismo sexual con niños, niñas y adolescentes. El turno con fines de la pornografía y turismo sexual con niños y niñas. El turismo con fines de explotación sexual de menores es una conducta prohibida en Colombia y sancionada por la ley.']]
    })

    const invoicePDF = Buffer.from(new Uint8Array(doc.output('arraybuffer'))).toString('base64')
    if (invoicePDF) {
      res.status(200).send(invoicePDF)
    }
  } catch (error) {
    console.log(error)
    res.status(404).send(error)
  }
}

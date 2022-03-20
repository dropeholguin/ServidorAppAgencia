// eslint-disable-next-line standard/object-curly-even-spacing
import { validateToken, logo, getImagesDestination} from './general'
import _ from 'lodash'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import moment from 'moment'
import crypto from 'crypto'

exports.createCotization = async (req, res, jwt, secret) => {
  try {
    const body = req.body
    const {
      id
    } = validateToken(req, jwt, secret)
    let uid = crypto.randomBytes(4).toString('hex').toUpperCase()
    body.usuario_creador = id
    body.client = body.client[0].value
    body.uid = uid
    delete body._id
    delete body.fecha_creacion
    delete body.fecha_actualizacion
    delete body.usuario_actualiza
    // valida si es nulo por defecto en javascrip si no colocas nada el entiende que si es nulo no entra
    if (body) {
      const result = await req.app.db.models.cotization.create(body)
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
    console.log(error)
    res.status(404).send(error.message)
  }
}

exports.updateCotization = async (req, res, jwt, secret) => {
  try {
    const cotization = req.body
    const { id } = validateToken(req, jwt, secret)
    cotization.usuario_actualiza = id
    cotization.fecha_actualizacion = new Date()
    cotization.client = cotization.client[0].value
    delete cotization.usuario_creador

    if (cotization) {
      const result = await req.app.db.models.cotization.updateOne({
        '_id': cotization._id
      }, cotization)
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

exports.listCotization = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    let cotizations = await req.app.db.models.cotization.find({}).sort({creation_date: -1}).populate('client').populate('usuario_actualiza').populate('usuario_creador')
    if (cotizations) {
      res.status(200).send(cotizations)
    }
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.listByIdCotization = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    let cotization = await req.app.db.models.cotization.findById(id).populate('client')
    let client = [{
      label: `${cotization.client.first_name} ${cotization.client.last_name}`,
      value: cotization.client._id
    }]
    delete cotization.client
    const newCotization = {
      ...cotization.toJSON(),
      client
    }
    res.send(newCotization)
  } catch (error) {
    res.status(404).send(error)
  }
}

exports.generatePdf = async (req, res, jwt, secret) => {
  try {
    validateToken(req, jwt, secret)
    const {
      id
    } = req.params
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({orientation: 'p', unit: 'mm', format: 'a4'})
    const cotization = await req.app.db.models.cotization.findById(id).populate('client')
    let bodyTable = []
    let images = await getImagesDestination(cotization.destination)
    for (const attr of cotization.attributesPlan) {
      bodyTable.push([attr.key + 1, attr.name])
    }
    doc.addImage(logo, 'image/png', 150, 4, 50, 70)
    doc.setFontSize(45)
    doc.setFont('helvetica', 'bold')
    doc.text('COTIZACIÓN', 15, 15)
    doc.setFontSize(13)
    doc.setFont('times', 'normal')
    doc.text('TRAVEL DELUXE', 15, 30)
    doc.text('NIT. 94357933-1', 15, 35)
    doc.text('CRA 18 No. 6 - 03 Roldanillo Valle del Cauca - Colombia', 15, 45)
    doc.text('Tel: +57 315 4720982 | 22 99710', 15, 50)
    doc.setFont('times', 'bold')
    doc.text('Datos del Cliente', 15, 70)
    doc.text('N° Cotización', 120, 70)
    doc.text(cotization.uid, 120, 77)
    doc.text('Fecha Cotización', 120, 88)
    doc.text(moment(cotization.creation_date).format('DD-MM-YYYY'), 120, 95)
    doc.setFont('times', 'normal')
    doc.text(cotization.client.first_name.toUpperCase() + ' ' + cotization.client.last_name.toUpperCase(), 15, 77)
    doc.text(`CC. ${cotization.client.document}`, 15, 82)
    doc.text(cotization.client.address, 15, 90)
    doc.text(cotization.client.email, 15, 95)
    doc.setFont('times', 'bold')
    doc.text('DESCRIPCIÓN DEL PRODUCTO', 15, 110)
    doc.text('DESTINO: ', 20, 120)
    doc.text('HOTEL: ', 20, 125)
    doc.text('FECHA DEL VIAJE: ', 20, 130)
    doc.text('AEROLINEA: ', 20, 135)
    doc.setFont('times', 'normal')
    doc.text(cotization.destination, 75, 120)
    doc.text(cotization.hotel, 75, 125)
    doc.text(cotization.date, 75, 130)
    doc.text(cotization.airline, 75, 135)
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
      foot: [['VALOR COTIZACIÓN', `$ ${Math.round(cotization.price).toLocaleString('es-CO')}`]]
    })
    doc.autoTable({
      theme: 'plain',
      styles: {
        fontSize: 13,
        font: 'times'
      },
      margin: { top: 0 },
      head: [['NOTAS IMPORTANTES']],
      body: [[cotization.notes]]
    })
    doc.autoTable({
      theme: 'plain',
      styles: {
        fontSize: 13,
        font: 'times'
      },
      margin: { top: 0 },
      head: [['OBSERVACIONES']],
      body: [[cotization.observation]]
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

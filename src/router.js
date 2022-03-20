import createError from 'http-errors'

import {
  changePassword,
  recoveryPassword,
  userLogin,
  actionLogout,
  validateSession,
  recoveryPasswordFirstSession,
  confirmAccount,
  acceptTerms
} from './controllers/login'

import {
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  listByIdUser,
  findUserByIdentification,
  listClientSelect
} from './controllers/user'

import {
  createCotization,
  listCotization,
  listByIdCotization,
  generatePdf,
  updateCotization
} from './controllers/cotization'

import {
  createReservation,
  listReservation,
  listByIdReservation,
  listReservationCalendar,
  updateReservation,
  addPaymentReservation,
  generatePdfReservation
} from './controllers/reservation'

import {
  stadisticsDasboard
} from './controllers/dashboard'

exports = module.exports = (app, jwt, secret) => {
  app.get('/', async (req, res) => {
    try {
      await req.app.db.models.user.find({ username: 'agenciatraveldeluxe' })
      res.json({ status: 'UP' })
    } catch (error) {
      res.json({ status: 'DOWN' })
      process.exit(0)
    }
  })

  app.get('/api/', (_req, res) => res.send('Welcome to API'))

  // restaurar contraseña
  app.post('/api/user/recovery/', (req, res) => recoveryPassword(req, res, jwt, secret))
  app.post('/api/user/recoveryfirstsession/', (req, res) => recoveryPasswordFirstSession(req, res, jwt, secret))

  // sistema de usuario
  app.post('/api/login', (req, res) => userLogin(req, res, jwt, secret))
  app.post('/api/user/reset', (req, res) => changePassword(req, res, jwt, secret))
  app.post('/api/logout', actionLogout)
  app.post('/api/user/check-sesion', (req, res) => validateSession(req, res, jwt, secret))
  app.post('/api/confirmAccount', (req, res) => confirmAccount(req, res, jwt, secret))
  app.post('/api/acceptTerms', (req, res) => acceptTerms(req, res, jwt, secret))

  // usuarios
  app.post('/api/user/info', (req, res) => findUserByIdentification(req, res, jwt, secret))
  app.post('/api/user', (req, res) => createUser(req, res, jwt, secret))
  app.put('/api/user', (req, res) => updateUser(req, res, jwt, secret))
  app.delete('/api/user', (req, res) => deleteUser(req, res, jwt, secret))
  app.get('/api/user/:rol', (req, res) => listUsers(req, res, jwt, secret))
  app.post('/api/user/:id/', (req, res) => listByIdUser(req, res, jwt, secret))
  app.get('/api/clientsselect', (req, res) => listClientSelect(req, res, jwt, secret))

  // cotizaciones
  app.post('/api/cotization', (req, res) => createCotization(req, res, jwt, secret))
  app.post('/api/cotization/:id', (req, res) => listByIdCotization(req, res, jwt, secret))
  app.get('/api/cotizations', (req, res) => listCotization(req, res, jwt, secret))
  app.post('/api/cotization/generatepdf/:id', (req, res) => generatePdf(req, res, jwt, secret))
  app.put('/api/cotization', (req, res) => updateCotization(req, res, jwt, secret))

  // reservaciones
  app.post('/api/reservation', (req, res) => createReservation(req, res, jwt, secret))
  app.post('/api/reservation/:id', (req, res) => listByIdReservation(req, res, jwt, secret))
  app.get('/api/reservations', (req, res) => listReservation(req, res, jwt, secret))
  app.get('/api/reservations/calendar', (req, res) => listReservationCalendar(req, res, jwt, secret))
  app.post('/api/reservation/generatepdf/:id', (req, res) => generatePdfReservation(req, res, jwt, secret))
  app.put('/api/reservation', (req, res) => updateReservation(req, res, jwt, secret))
  app.put('/api/addpayment/reservation', (req, res) => addPaymentReservation(req, res, jwt, secret))

  // dashboard
  app.get('/api/stadistics/dashboard', (req, res) => stadisticsDasboard(req, res, jwt, secret))

  // catch 404 and forward to error handler
  app.use(function (_req, _res, next) {
    next(createError(404))
  })
}

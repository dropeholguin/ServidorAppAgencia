import userModel from './schema/User'
import cotizationModel from './schema/Cotization'
import reservationModel from './schema/Reservation'

exports = module.exports = (app, mongoose) => {
  userModel(app, mongoose)
  cotizationModel(app, mongoose)
  reservationModel(app, mongoose)
}

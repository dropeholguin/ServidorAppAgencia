import userModel from './schema/User'
import cotizationModel from './schema/Cotization'
import reservationModel from './schema/Reservation'
import invoiceModel from './schema/Invoice'
import promotionModel from './schema/Promotion'
import minorboxModel from './schema/Minorbox'

exports = module.exports = (app, mongoose) => {
  userModel(app, mongoose)
  cotizationModel(app, mongoose)
  reservationModel(app, mongoose)
  invoiceModel(app, mongoose)
  promotionModel(app, mongoose)
  minorboxModel(app, mongoose)
}

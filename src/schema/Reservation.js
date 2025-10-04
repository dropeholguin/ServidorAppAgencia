exports = module.exports = (app, mongoose) => {
  const ReservationSchema = new mongoose.Schema({
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    uid: { type: String, required: true },
    price: { type: Number, required: true },
    destination: { type: String, required: true },
    wholesaler: { type: String, required: true },
    numPeople: { type: Number, required: true },
    date: { type: String, required: true },
    hotel: { type: String, required: true },
    airline: { type: String, required: true },
    attributesPlan: { type: Array, required: true },
    payments: { type: Array },
    notes: { type: String },
    isTotal: { type: Boolean, default: false },
    statusPayment: { type: String },
    status: { type: Boolean, default: false },
    account: { type: String },
    usuario_creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    usuario_actualiza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    creation_date: {
      type: Date,
      default: Date.now
    },
    date_update: {
      type: Date
    }
  })

  ReservationSchema.pre('update', function () {
    this.update({}, {
      $set: {
        date_update: new Date()
      }
    })
  })

  app.db.model('reservation', ReservationSchema)
}

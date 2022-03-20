exports = module.exports = (app, mongoose) => {
  const CotizationSchema = new mongoose.Schema({
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    uid: {type: String, required: true},
    destination: {type: String, required: true},
    date: {type: String, required: true},
    price: {type: Number, required: true},
    hotel: {type: String, required: true},
    airline: {type: String, required: true},
    attributesPlan: {type: Array, required: true},
    observation: {type: String},
    notes: {type: String},
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

  CotizationSchema.pre('update', function () {
    this.update({}, { $set: {
      date_update: new Date()
    }})
  })

  app.db.model('cotization', CotizationSchema)
}

exports = module.exports = (app, mongoose) => {
  const InvoiceSchema = new mongoose.Schema({
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'reservation'
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    uid: {type: String, required: true},
    total: {type: Number, required: true},
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

  InvoiceSchema.pre('update', function () {
    this.update({}, { $set: {
      date_update: new Date()
    }})
  })

  app.db.model('invoice', InvoiceSchema)
}

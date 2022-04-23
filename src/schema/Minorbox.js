exports = module.exports = (app, mongoose) => {
  const MinorBoxSchema = new mongoose.Schema({
    concept: {type: String, required: true},
    paymentType: {type: String, required: true},
    type: {type: String, required: true},
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

  MinorBoxSchema.pre('update', function () {
    this.update({}, { $set: {
      date_update: new Date()
    }})
  })

  app.db.model('minorbox', MinorBoxSchema)
}

exports = module.exports = (app, mongoose) => {
  const PromotionSchema = new mongoose.Schema({
    title: {type: String, required: true},
    address: {type: String, required: true},
    dates: {type: String, required: true},
    visible: {type: Boolean, default: false},
    image: {type: String, default: ''},
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

  PromotionSchema.pre('update', function () {
    this.update({}, { $set: {
      date_update: new Date()
    }})
  })

  app.db.model('promotion', PromotionSchema)
}

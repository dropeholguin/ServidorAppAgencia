// se usa para conectarme con mongodb
import mongoose from 'mongoose'
import compression from 'compression'
// se usa para el solicitudes http de origenes externos como otros puertos
import cors from 'cors'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import jwt from 'jsonwebtoken'
import http from 'http'
import io from 'socket.io'
import dotenv from 'dotenv'
import models from './models'
import initData from './initData'
import router from './router'

const secret = 'traveldeluxe'
const app = express()
const httperver = http.createServer(app)
let serverIo = io(httperver)
dotenv.config()

const {
  MONGO_URL,
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_ROOT_PASSWORD,
  MONGO_SERVER,
  MONGO_INITDB_DATABASE
} = process.env

const PORT = process.env.PORT || 4000

app.use(function (req, _res, next) {
  req.io = serverIo
  next()
})

app.disable('x-powered-by')
app.use(compression())
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
// reconoce los archivos en json
app.use(express.json({ limit: '400mb' }))
app.use(express.urlencoded({
  limit: '400mb',
  extended: false
})
)

app.use(cors())
app.options('*', cors())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, *')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  next()
})

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(require('body-parser').urlencoded({extended: false}))
app.use(require('body-parser').json())

// declaro global mongo para que maneje promesas
mongoose.Promise = global.Promise
mongoose.set('useCreateIndex', true)

const url = MONGO_URL || 'mongodb://' + MONGO_INITDB_ROOT_USERNAME + ':' + MONGO_INITDB_ROOT_PASSWORD + '@' + MONGO_SERVER + ':27017/' + MONGO_INITDB_DATABASE
// + '?authSource=admin'

app.db = mongoose.createConnection(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

app.db.on('error', console.error.bind(console, 'error conexion mongodb'))

models(app, mongoose)
initData(app)
router(app, jwt, secret)

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error')
  next()
})

httperver.listen(PORT, () => {
  console.log(`Servidor corriendo por el puerto ${PORT}`)
})

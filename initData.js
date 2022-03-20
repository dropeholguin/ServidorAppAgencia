import { rootUser } from './initialData/userRoot'

exports = module.exports = app => {
  insertData(app, rootUser, { document: rootUser.document }, 'user')
}

const insertData = (app, data, selector, schema) => {
  app.db.models[schema].updateOne(selector, data, {
    upsert: true
  }).then(res => {
    console.log('Se agrega data inicial')
  }).catch(err => {
    console.log(err)
  })
}

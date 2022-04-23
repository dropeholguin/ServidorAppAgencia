import AWS from 'aws-sdk'

const uploadImage = (imageName, base64Image, req, id, model) => {
  const { BUCKET_NAME, AWS_SECRET_ACCESS, AWS_ACCESS_KEY } = process.env
  AWS.config.update({
    secretAccessKey: AWS_SECRET_ACCESS,
    accessKeyId: AWS_ACCESS_KEY,
    region: 'us-east-1'
  })
  const s3 = new AWS.S3()

  let buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  s3.upload({
    Bucket: BUCKET_NAME,
    Key: `${id}${imageName}`,
    Body: buffer,
    ACL: 'public-read'
  }, async function (err, data) {
    if (err) {
      console.log('Error al subir imagen')
    } else {
      if (model === 'user') {
        await req.app.db.models.user.updateOne({'_id': id}, {
          $set: {
            image: data.key
          }
        })
      } else if (model === 'promotion') {
        await req.app.db.models.promotion.updateOne({'_id': id}, {
          $set: {
            image: data.key
          }
        })
      }
    }
  })
}

module.exports = uploadImage

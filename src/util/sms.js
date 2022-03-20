import AWS from 'aws-sdk'

exports.sendSms = async (celular, mej) => {
  try {
    // loads config.json which we created earlier which contains aws security credentials.
    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env
    // se valida celular
    var expresion = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
    if (isNaN(celular) || expresion.test(celular)) {
      if (celular && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
        AWS.config.update({
          region: AWS_REGION || '',
          accessKeyId: AWS_ACCESS_KEY_ID || '',
          secretAccessKey: AWS_SECRET_ACCESS_KEY || ''
        })
        var sns = new AWS.SNS()

        // subscribing a mobile number to a topic
        sns.subscribe({
          Protocol: 'sms',
          TopicArn: process.env.SNS_TOPIC_ARN,
          Endpoint: '+57' + celular // escribe el número de móvil a quien quieres enviar un mensaje.
        }, function (error, data) {
          if (error) {
            console.log('error when subscribe', error)
          }
          var SubscriptionArn = data.SubscriptionArn
          var params = {
            TargetArn: process.env.SNS_TOPIC_ARN,
            Message: mej,
            Subject: 'Ticket' // type your subject
          }

          // publish a message.
          sns.publish(params, function (error2, data) {
            if (error2) {
              console.log('Error sending a message', error2)
            } else {
              console.log('Sent message:', data.MessageId)
            }
            var params = {
              SubscriptionArn: SubscriptionArn
            }
            if (params.SubscriptionArn !== null) {
              // unsubscribing the topic
              sns.unsubscribe(params, function (err, data) {
                if (err) {
                  console.log('err when unsubscribe', err)
                }
              })
            }
          })
        })
      }
    } else {
      console.log('Numero de celular Invalido')
    }
  } catch (error) {
    console.log('No se envia SMS')
  }
}

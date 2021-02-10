const SQS = require('aws-sdk/clients/sqs')
const { ReplaySubject } = require("rxjs")

const messages = new ReplaySubject(100)
const messageIds = new Set()
let pollingLoop

const startListening = () => {
  if (pollingLoop) {
    return
  }

  const sqs = new SQS()
  const queueUrl = process.env.E_2_E_TEST_QUEUE_URL
  const loop = async () => {
    const resp = await sqs.receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20
    }).promise()
    // console.info('resp', resp);

    if (!resp.Messages) {
      return await loop()
    }

    resp.Messages.forEach(msg => {
      // console.info('resp.Messages[x]', msg);
      if (messageIds.has(msg.MessageId)) {
        // seen this message already, ignore
        return
      }

      messageIds.add(msg.MessageId)

      const body = JSON.parse(msg.Body)
      if (body.TopicArn) {
        messages.next({
          sourceType: 'sns',
          source: body.TopicArn,
          message: body.Message
        })
      } else if (body.eventBusName) {
        messages.next({
          sourceType: 'eventbridge',
          source: body.eventBusName,
          message: JSON.stringify(body.event)
        })
      }
    })

    await loop()
  }

  pollingLoop = loop()
}

const waitForMessage = (sourceType, source, message) => {
  console.log('waiting for', {sourceType, source, message})
  let subscription
  return new Promise((resolve) => {
    subscription = messages.subscribe(incomingMessage => {
      if (incomingMessage.sourceType === sourceType && incomingMessage.source === source) {
        if (message === incomingMessage.message) {
          resolve();
        } else if (sourceType === 'eventbridge') {
          if (typeof message === 'string') message = JSON.parse(message); // in the first event 'restaurant_notified', message is string, while for the next are objects
          incomingMessage.message = JSON.parse(incomingMessage.message);
           if ( message.source === incomingMessage.message.source &&
                message['detail-type'] === incomingMessage.message['detail-type'] &&
                message.detail.orderId === incomingMessage.message.detail.orderId &&
                message.detail.restaurantName === incomingMessage.message.detail.restaurantName) {
                  resolve();
          }
        }
      }
    })
  }).then(() => subscription.unsubscribe())
}

module.exports = {
  startListening,
  waitForMessage
}

### Production-Ready Serverless 

Place orders and accept/reject them done with Serverless Framework using AWS Lambda, API Gateway, DynamoDB, EventBridge, SNS, Cognito, SSM & SQS
<br /><br />

<p align="center">
  <img src="doc/flow.jpg" />
</p> 

[▶️ Demo site](https://mvkvss4x1f.execute-api.us-east-1.amazonaws.com/prod)

1. Sign in
1. Place orders clicking in restaurants
1. Simulate restaurant response accepting or rejecting them curling like this:

    ```shell script
    URL=https://mvkvss4x1f.execute-api.us-east-1.amazonaws.com/prod/order/acceptance
    ORDER=<your order>
    ACCEPTANCE=<order_accepted || order_rejected> 
    curl -d '{"orderId":"'"${ORDER}"'", "acceptance":"'"${ACCEPTANCE}"'"}' -H "Content-Type: application/json" -X POST $URL
    ```
1. In the case you accepted the order you can complete it
1. Once you complete or reject the order you can delete it curling like this:
   ```shell script
   ENDPOINT=https://mvkvss4x1f.execute-api.us-east-1.amazonaws.com/prod/order/delete
   ORDER=<your order>
   curl --request GET \
     --url $ENDPOINT/$ORDER
   ```

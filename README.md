### Production-Ready Serverless 

Place orders and accept/reject them done with Serverless Framework using AWS Lambda, API Gateway, DynamoDB, EventBridge, SNS, Cognito, SSM & SQS
<br /><br />

<p align="center">
  <img src="doc/flow.jpg" />
</p> 

[▶️ Demo site](https://8k6h.short.gy/prsls)

1. Register
1. Place orders clicking in restaurants
1. Simulate restaurant response accepting or rejecting them curling like this:

    ```shell script
    API=https://lrmnkd5aj8.execute-api.us-east-1.amazonaws.com/prod/order
    ACCEPTANCE_URL=${API}/acceptance
    ORDER=<your order>
    ACCEPTANCE=order_accepted
    # or
    ACCEPTANCE=order_rejected 
    curl -d '{"orderId":"'"${ORDER}"'", "acceptance":"'"${ACCEPTANCE}"'"}' -H "Content-Type: application/json" -X POST $ACCEPTANCE_URL
    ```
1. In the case you accepted the order you can complete it
1. Once you complete or reject the order you can delete it curling like this:
   ```shell script
   DELETE_URL=${API}/delete
   ORDER=<your order>
   curl --request GET \
     --url $DELETE_URL/$ORDER
   ```
   
#### Deployment instructions

1. Use Node 20 version, using [nvm](https://github.com/nvm-sh/nvm) you can:

    ```
    # set Node 20 in current terminal
    nvm use 20
    # set Node 20 as default (new terminals will use 20)
    nvm alias default 20
    ```
   
1. Install dependencies and deploy on your stage (provided you configured your AWS credentials)

    ```shell script
    npm i
    # deploy on dev stage
    npm run sls -- deploy
    # ...to deploy on prod stage
    npm run sls -- deploy -s prod
    ```

1. Configure these parameters in `AWS Systems Manager > Parameter Store`:

    `/prsls/${stage}/get-restaurants/config`: 
    ```json
    {
       "defaultResults": 8
    }
    ```
    `/prsls/${stage}/search-restaurants/config`:
    ```json
    {
       "defaultResults": 8
    }
    ```

1. Populate the database with restaurants:

    ```shell script
    export restaurants_table=<DynamoDB table for the stage>
    node -e 'require("./tests/steps/given.js").eight_initial_restaurants()'
    ```
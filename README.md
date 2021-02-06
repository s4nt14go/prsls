### Production-Ready Serverless 

1. [Place orders in restaurants](https://4pa10h0ae2.execute-api.us-east-1.amazonaws.com/dev)
1. Simulate the restaurant response accepting or rejecting them curling like this:

    ```shell script
    URL=https://4pa10h0ae2.execute-api.us-east-1.amazonaws.com/dev/order/acceptance
    ORDER=<your order>
    ACCEPTANCE=<order_accepted || order_rejected> 
    curl -d '{"orderId":"${ORDER}", "acccurl -d '{"orderId":"'"${ORDER}"'", "acceptance":"'"${ACCEPTANCE}"'"}' -H "Content-Type: application/json" -X POST $URL
    ```
1. In the case you accepted the order you can complete it

class StripeService:
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def create_checkout_session(self, order, success_url, cancel_url):
        raise NotImplementedError("Stripe is not enabled")

    async def get_checkout_status(self, session_id: str):
        raise NotImplementedError("Stripe is not enabled")

    async def handle_webhook(self, payload, signature):
        raise NotImplementedError("Stripe is not enabled")

# import stripe

# class StripeService:
#     def __init__(self, api_key: str):
#         stripe.api_key = api_key

#     async def create_checkout_session(self, order, success_url, cancel_url):
#         session = stripe.checkout.Session.create(
#             payment_method_types=["card"],
#             line_items=[{
#                 "price_data": {
#                     "currency": "inr",
#                     "product_data": {
#                         "name": f"Order {order['order_id']}"
#                     },
#                     "unit_amount": int(order["total"] * 100)
#                 },
#                 "quantity": 1
#             }],
#             mode="payment",
#             success_url=success_url,
#             cancel_url=cancel_url,
#             metadata={"order_id": order["order_id"]}
#         )
#         return session

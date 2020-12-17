import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import CurrencyFormat from "react-currency-format";

import { useStateValue } from "../../StateProvider";
import { getBasketTotal } from "../../reducer";
import axios from "../../axios";
import { db } from "../../firebase";
import CheckoutProduct from "../checkout/checkoutProduct/CheckoutProduct";
import "./Payment.css";

function Payment() {
    const [{ basket, user }, dispatch] = useStateValue();

    const history = useHistory();

    const stripe = useStripe();
    const elements = useElements();

    const [succeeded, setSucceeded] = useState(false);
    const [processing, setProcessing] = useState("");
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(true);
    const [clientSecret, setClientSecret] = useState(true);

    useEffect(() => {
        // generate the stripe secret allow us to charge a customer
        const getClientSecret = async () => {
            const response = await axios({
                method: "post",
                // stripe excepts the total in a currencies subunits eg: if rupees then subunit - paisa
                url: `/payments/create?total=${getBasketTotal(basket) * 100}`,
            });

            setClientSecret(response.data.clientSecret);
        };

        getClientSecret();
    }, [basket]);

    const handleSubmit = async (event) => {
        // do all the fancy stripe stuff...
        event.preventDefault();
        setProcessing(true);

        const payload = await stripe
            .confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            })
            .then((paymentResult) => {
                // paymentIntent = payment confirmation
                if (paymentResult.error) {
                    setError(`Payment failed: ${paymentResult.error.message}`);
                    setProcessing(false);
                } else {
                    if (paymentResult.paymentIntent.status === "succeeded") {
                        db.collection("users")
                            .doc(user?.uid)
                            .collection("orders")
                            .doc(paymentResult.paymentIntent.id)
                            .set({
                                basket: basket,
                                amount: paymentResult.paymentIntent.amount,
                                created: paymentResult.paymentIntent.created,
                            });

                        setSucceeded(true);
                        setError(null);
                        setProcessing(false);

                        dispatch({
                            type: "EMPTY_BASKET",
                        });

                        history.replace("/orders");
                    }
                }
            });
    };

    const handleChange = (event) => {
        // listen for changes in the CardElement
        // and display any errors as the customer types their card details
        setDisabled(event.empty);
        setError(event.error ? event.error.message : "");
    };

    return (
        <div className="payment">
            <div className="payment__container">
                <h1>
                    Checkout (<Link to="/checkout">{basket?.length} items</Link>
                    )
                </h1>

                {/* payment section- delivery address */}
                <div className="payment__section">
                    <div className="payment__title">
                        <h3>Delivery Address</h3>
                    </div>
                    <div className="payment__address">
                        <p>{user?.email}</p>
                        <p>123 React Lane</p>
                        <p>West Bengal, India</p>
                    </div>
                </div>

                {/* payment section- Review items */}
                <div className="payment__section">
                    <div className="payment__title">
                        <h3>Review items and delivery</h3>
                    </div>
                    <div className="payment__items">
                        {basket.map((item) => (
                            <CheckoutProduct
                                id={item.id}
                                image={item.image}
                                title={item.title}
                                price={item.price}
                                rating={item.rating}
                            />
                        ))}
                    </div>
                </div>

                {/* payment section- Payment method */}
                <div className="payment__section">
                    <div className="payment__title">
                        <h3>Payment Method</h3>
                    </div>
                    <div className="payment__details">
                        {/* here stripe magic will go */}
                        <form onSubmit={handleSubmit}>
                            <CardElement onChange={handleChange} />

                            <div className="payment__priceContainer">
                                <CurrencyFormat
                                    renderText={(value) => (
                                        <h3>Order Total: {value}</h3>
                                    )}
                                    decimalScale={2}
                                    value={getBasketTotal(basket)}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"₹"}
                                />

                                <button
                                    disabled={
                                        processing || disabled || succeeded
                                    }
                                >
                                    <span>
                                        {processing ? (
                                            <p>Processing</p>
                                        ) : (
                                            "Buy Now"
                                        )}
                                    </span>
                                </button>
                            </div>

                            {error && <div>{error}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Payment;

import React from "react";
import { useStateValue } from "../../../StateProvider";
import CurrencyFormat from "react-currency-format";

import "./Product.css";

function product({ id, title, price, rating, image }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, dispatch] = useStateValue();

    const addToBasket = () => {
        // dispatch item into data layer
        dispatch({
            type: "ADD_TO_BASKET",
            item: {
                id: id,
                title: title,
                image: image,
                price: price,
                rating: rating,
            },
        });
    };

    return (
        <div className="product">
            <div className="product__info">
                <p>{title}</p>

                <CurrencyFormat
                    renderText={(value) => (
                        <p className="product__price">
                            <strong>{value}</strong>
                        </p>
                    )}
                    decimalScale={2}
                    value={price}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"₹"}
                />

                <div className="product__rating">
                    {Array(rating)
                        .fill()
                        .map((_, i) => {
                            return <p>⭐</p>;
                        })}
                </div>
            </div>

            <img src={image} alt="" />

            <button onClick={addToBasket}>Add to Basket</button>
        </div>
    );
}

export default product;

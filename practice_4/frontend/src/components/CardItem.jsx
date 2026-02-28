import React from 'react';
import ProductModal from "./ProductModal.jsx";

const CardItem = (props) => {
  const {
    product,
    onEdit,
    onDelete
  } = props;

  return (
    <>
      <div className="product-card">
        <div className="product-card__image-wrapper">
          <img className="product-card__image" src={product.image} alt="product_image"/>
        </div>
        <div className="product-card__content">
          <h3 className="product-card__title">{product.name}</h3>
          <span className="product-card__id">Цена: {product.price}р</span>
          <span className="product-card__category">{product.category}</span>
          <span className="product-card__rating">Оценка: {product.rating}/5</span>
          <span className="product-card__stock">Наличие: {product.stock ? product.stock : "Нет в наличии"}</span>
          <div className="product-card__button-container">
            <button className="product-card__button" onClick={onEdit}>Изменить</button>
            <button className="product-card__button delete-btn" onClick={onDelete}>Удалить</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CardItem;
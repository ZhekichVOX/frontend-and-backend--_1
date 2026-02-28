import React, { useEffect, useState } from 'react';

const ProductModal = (props) => {
  const {
    isOpen,
    onSave,
    onClose,
    title,
    initialData,
  } = props;

  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        category: initialData.category || '',
        rating: initialData.rating || '',
        stock: initialData.stock || '',
        image: initialData.image || '',
      });
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        rating: '',
        stock: '',
        image: '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}))
  }

  if (!isOpen) return null;

  return (
    <div className="modal-background">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title-wrapper">
          <h2 className="modal__title">{title}</h2>
        </div>
        <div className="modal__input-area">
          <label className="modal__input-label">Название</ label>
          <input
            name="name"
            className="modal__input"
            value={formData.name}
            onChange={handleChange}
            type="text"
            placeholder="Название"
          />
          <label className="modal__input-label">Цена</ label>
          <input
            name="price"
            className="modal__input"
            value={formData.price}
            onChange={handleChange}
            type="text"
            placeholder="Цена"
          />
          <label className="modal__input-label">Категория</ label>
          <input
            name="category"
            className="modal__input"
            value={formData.category}
            onChange={handleChange}
            type="text"
            placeholder="Категория"
          />
          <label className="modal__input-label">Оценка</ label>
          <input
            name="rating"
            className="modal__input"
            value={formData.rating}
            onChange={handleChange}
            type="text"
            placeholder="Оценка"
          />
          <label className="modal__input-label">Наличие</ label>
          <input
            name="stock"
            className="modal__input"
            value={formData.stock}
            onChange={handleChange}
            type="text"
            placeholder="Наличие"
          />
          <label className="modal__input-label">Изображение</ label>
          <input
            name="image"
            className="modal__input"
            value={formData.image}
            onChange={handleChange}
            type="text"
            placeholder="URL на изображение"
          />
        </div>
        <div className="modal__buttons">
          <button className="modal__btn modal__save-btn" onClick={() => onSave(initialData?.id, formData)}>Сохранить</button>
          <button className="modal__btn modal__close-btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )

};

export default ProductModal;
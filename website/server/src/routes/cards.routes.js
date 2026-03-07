const express = require('express');
const router = express.Router();
const { getCards, getCardById, createCard, updateCard, moveCard, deleteCard } = require('../controllers/cards.controller');

router.route('/')
    .get(getCards)
    .post(createCard);

router.route('/:id')
    .get(getCardById)
    .patch(updateCard)
    .delete(deleteCard);

router.patch('/:id/move', moveCard);

module.exports = router;

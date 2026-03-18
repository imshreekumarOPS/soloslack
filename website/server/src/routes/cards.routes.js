const express = require('express');
const router = express.Router();
const { getCards, getCardById, createCard, updateCard, moveCard, deleteCard, getUpcomingCards } = require('../controllers/cards.controller');

router.route('/')
    .get(getCards)
    .post(createCard);

// Must be before /:id to avoid 'upcoming' being treated as an id
router.get('/upcoming', getUpcomingCards);

router.route('/:id')
    .get(getCardById)
    .patch(updateCard)
    .delete(deleteCard);

router.patch('/:id/move', moveCard);

module.exports = router;

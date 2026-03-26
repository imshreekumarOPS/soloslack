const express = require('express');
const router = express.Router();
const { getCards, getCardById, createCard, updateCard, moveCard, deleteCard, getUpcomingCards, bulkDeleteCards, bulkMoveCards, bulkArchiveCards, bulkUnarchiveCards } = require('../controllers/cards.controller');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/comments.controller');

router.route('/')
    .get(getCards)
    .post(createCard);

// Must be before /:id to avoid being treated as an id
router.get('/upcoming', getUpcomingCards);
router.post('/bulk-delete', bulkDeleteCards);
router.post('/bulk-move', bulkMoveCards);
router.post('/bulk-archive', bulkArchiveCards);
router.post('/bulk-unarchive', bulkUnarchiveCards);

router.route('/:id')
    .get(getCardById)
    .patch(updateCard)
    .delete(deleteCard);

router.patch('/:id/move', moveCard);

// Comments nested under cards
router.route('/:cardId/comments')
    .get(getComments)
    .post(createComment);

router.route('/:cardId/comments/:commentId')
    .patch(updateComment)
    .delete(deleteComment);

module.exports = router;

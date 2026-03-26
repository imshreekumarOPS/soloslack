const express = require('express');
const router = express.Router();
const {
    getWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    reorderWorkspaces,
} = require('../controllers/workspaces.controller');

router.route('/')
    .get(getWorkspaces)
    .post(createWorkspace);

router.patch('/reorder', reorderWorkspaces);

router.route('/:id')
    .get(getWorkspaceById)
    .patch(updateWorkspace)
    .delete(deleteWorkspace);

module.exports = router;

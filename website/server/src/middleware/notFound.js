const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
        statusCode: 404,
    });
};

module.exports = notFound;

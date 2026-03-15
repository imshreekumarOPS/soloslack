const fs = require('fs');
const path = require('path');

// Helper to read and parse .env file
const getEnvFilePath = () => path.join(process.cwd(), '.env');

const readEnv = () => {
    const filePath = getEnvFilePath();
    if (!fs.existsSync(filePath)) return {};
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });
    
    return env;
};

const writeEnv = (newEnv) => {
    const filePath = getEnvFilePath();
    const currentEnv = readEnv();
    const updatedEnv = { ...currentEnv, ...newEnv };
    
    const content = Object.entries(updatedEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
};

// @desc    Get environment variables
// @route   GET /api/settings/env
exports.getEnv = async (req, res, next) => {
    try {
        const env = readEnv();
        // Only return non-sensitive or requested keys
        // For this app, we return MONGODB_URI and PORT
        res.status(200).json({
            success: true,
            data: {
                MONGODB_URI: env.MONGODB_URI || '',
                PORT: env.PORT || '5000',
                NODE_ENV: env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update environment variables
// @route   POST /api/settings/env
exports.updateEnv = async (req, res, next) => {
    try {
        const { MONGODB_URI, PORT } = req.body;
        
        const updates = {};
        if (MONGODB_URI) updates.MONGODB_URI = MONGODB_URI;
        if (PORT) updates.PORT = PORT;
        
        if (Object.keys(updates).length > 0) {
            writeEnv(updates);
        }
        
        res.status(200).json({
            success: true,
            message: 'Environment variables updated. Server will restart shortly.',
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

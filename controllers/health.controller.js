import { getDBStatus } from '../database/db.js';
import { AppError } from '../middleware/error.middleware.js';

export const checkHealth = async (req, res) => {
    // TODO: Implement health check functionality
    try {
        const dbStatus = await getDBStatus()
        if (dbStatus?.isConnected) {
            res.status(200).json({
                status: 'ok',
                message: 'Server and database are healthy',
                dbStatus,
            })
        } else {
            return res.status(503).json({
                status: 'fail',
                message: 'Database is not connected',
                dbStatus,
            });
        }
    } catch (error) {
console.log(error);
  return new AppError("Internal server error",500)
    }
};


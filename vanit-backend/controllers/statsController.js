const Bus = require('../models/Bus');
const Captain = require('../models/Captain');
const Route = require('../models/Route');

const getStats = async (req, res) => {
    try {
        const busesStats = await Bus.getStats();
        const captainsStats = await Captain.getStats();
        const routesStats = await Route.getStats();

        res.json({
            totalBuses: busesStats.total_buses,
            activeBuses: busesStats.active_buses,
            totalCaptains: captainsStats.total_captains,
            activeCaptains: captainsStats.active_captains,
            totalRoutes: routesStats.total_routes,
            activeRoutes: routesStats.active_routes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getStats };

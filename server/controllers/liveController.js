const Live = require("../models/liveModel");

const getAllLiveRooms = async (req, res) => {
    try {
        const liveRooms = await Live.find().populate("user", "name email").lean();
        const roomsWithCount = liveRooms.map(room => ({
            ...room,
            viewerCount: room.viewers ? room.viewers.length : 0
        }));
        res.status(200).json({ liveRooms: roomsWithCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {getAllLiveRooms}
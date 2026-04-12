const { Socket } = require("socket.io");
const Live = require("../models/liveModel");
const User = require("../models/userModel");
const mediasoup = require("mediasoup");


let worker;
let router;

const mediaCodecs = [
    { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
    { kind: 'video', mimeType: 'video/VP8', clockRate: 90000, parameters: { 'x-google-start-bitrate': 1000 } }
];

mediasoup.createWorker({ rtcMinPort: 10000, rtcMaxPort: 10100 }).then(w => {
    worker = w;
    console.log(`Mediasoup worker started on pid ${worker.pid}`);
    worker.on('died', () => {
        console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });
    worker.createRouter({ mediaCodecs }).then(r => router = r);
});


// roomProducers[roomId] = { audio: producer, video: producer }
const roomProducers = {};
const viewerTransports = {};
// viewerConsumers[socketId] = { audio: consumer, video: consumer }
const viewerConsumers = {};
const creatorTransports = {};
// roomViewerSockets[roomId] = Set of socketIds currently watching
const roomViewerSockets = {};

const handleConnection = (socket, io) => {
    // Utility for safe callback calls
    const safeCb = (cb, ...args) => {
        if (typeof cb === 'function') {
            cb(...args);
        }
    };


    socket.on("create-room", async (data, cb) => {
        const { Id, title } = data;
        try {
            const user = await User.findOne({ _id: Id });
            if (!user) {
                socket.emit("error", { message: "Unauthorized: User not found" });
                return;
            }
            const email = user.email;
            const roomId = String(Math.floor(Math.random() * 10000));
            socket.data = { email, roomId, Id };
            socket.join(roomId);

            const live = new Live({
                email: email,
                roomId,
                title,
                user: Id
            });
            await live.save();

            const populated = await Live.findById(live._id).populate('user', 'name email');
            io.emit('live-created', {
                _id: live._id,
                roomId,
                title,
                email,
                viewers: [],
                user: populated?.user || { name: email }
            });

            socket.emit('viewer-count', { count: 0 });
            socket.emit('room-created', { roomId });
            safeCb(cb, true);
        } catch (err) {
            safeCb(cb, false);
        }
    });

    socket.on("join-creator", async (data, cb) => {
        try {
            const { roomId, userId } = data;

            const live = await Live.findOne({ roomId: String(roomId) });
            if (!live) {
                socket.emit("room-not-found");
                return;
            }

            if (String(live.user) !== String(userId)) {
                socket.emit("error", { message: "Unauthorized creator join" });
                return;
            }

            const user = await User.findById(userId);
            socket.data = { email: user?.email, roomId: String(roomId), Id: userId };
            socket.join(String(roomId));

            const count = roomViewerSockets[roomId] ? roomViewerSockets[roomId].size : 0;
            socket.emit("viewer-count", { count });
            const livePop = await Live.findOne({ roomId: String(roomId) }).populate("viewers", "name email profilePic");
            if (livePop) {
                socket.emit("viewers-update", { viewers: livePop.viewers });
                safeCb(cb, livePop.viewers);
            }
        } catch (err) {
            safeCb(cb, []);
        }
    });

    socket.on("join-room", async (data, cb) => {
        try {
            const { email, userId } = data;
            const roomId = String(data.roomId);

            const live = await Live.findOne({ roomId });
            if (!live) {
                socket.emit("room-not-found");
                return;
            }

            if (userId && !live.viewers.map(v => String(v)).includes(String(userId))) {
                live.viewers.push(userId);
                await live.save();
            }

            if (!roomViewerSockets[roomId]) roomViewerSockets[roomId] = new Set();
            roomViewerSockets[roomId].add(socket.id);

            socket.data = { email, roomId, userId, isViewer: true };
            socket.join(roomId);
            socket.emit("room-joined", { roomId });

            const viewerCount = roomViewerSockets[roomId].size;
            socket.to(String(roomId)).emit('viewer-count', { count: viewerCount });
            socket.emit('viewer-count', { count: viewerCount });
            
            const livePop = await Live.findOne({ roomId }).populate("viewers", "name email profilePic");
            if (livePop) {
                socket.to(String(roomId)).emit("viewers-update", { viewers: livePop.viewers });
                socket.emit("viewers-update", { viewers: livePop.viewers });
                safeCb(cb, { success: true, viewers: livePop.viewers });
            }

            io.emit('live-viewer-count', { roomId, count: viewerCount });

            if (roomProducers[roomId]) {
                const producers = roomProducers[roomId];
                if (producers.video) {
                    socket.emit("new-producer", { producerId: producers.video.id, kind: 'video' });
                }
                if (producers.audio) {
                    socket.emit("new-producer", { producerId: producers.audio.id, kind: 'audio' });
                }
            }
        } catch (err) {
            console.error("join-room error:", err);
            safeCb(cb, { success: false });
        }
    });

    socket.on("end-room", async () => {
        const { roomId } = socket.data || {};
        if (!roomId) return;

        await Live.deleteOne({ roomId: String(roomId) });

        if (roomProducers[roomId]) {
            const producers = roomProducers[roomId];
            if (producers.audio) producers.audio.close();
            if (producers.video) producers.video.close();
            delete roomProducers[roomId];
        }

        delete roomViewerSockets[roomId];

        if (creatorTransports[socket.id]) {
            creatorTransports[socket.id].close();
            delete creatorTransports[socket.id];
        }

        socket.to(String(roomId)).emit('room-ended');
        io.emit('live-ended', { roomId });
    });

    socket.on("creator-muted", ({ muted }) => {
        const { roomId } = socket.data || {};
        if (roomId) socket.to(String(roomId)).emit("creator-muted", { muted });
    });

    socket.on("creator-video-off", ({ videoOff }) => {
        const { roomId } = socket.data || {};
        if (roomId) socket.to(String(roomId)).emit("creator-video-off", { videoOff });
    });

    socket.on("leave-room", async () => {
        try {
            const { roomId, userId, isViewer } = socket.data || {};
            if (isViewer && roomId) {
                socket.leave(String(roomId));
                
                if (roomViewerSockets[roomId]) {
                    roomViewerSockets[roomId].delete(socket.id);
                    const newCount = roomViewerSockets[roomId].size;
                    socket.to(String(roomId)).emit('viewer-count', { count: newCount });
                    io.emit('live-viewer-count', { roomId, count: newCount });
                    if (roomViewerSockets[roomId].size === 0) delete roomViewerSockets[roomId];
                }

                if (userId) {
                    await Live.findOneAndUpdate(
                        { roomId: String(roomId) },
                        { $pull: { viewers: userId } }
                    );
                    const livePop = await Live.findOne({ roomId: String(roomId) }).populate("viewers", "name email profilePic");
                    if (livePop) {
                            socket.to(String(roomId)).emit("viewers-update", { viewers: livePop.viewers });
                    }
                }
                socket.data.roomId = null;
                socket.data.isViewer = false;
            }
        } catch (err) {}
    });

    socket.on("disconnect", async () => {
        if (socket.data) {
            const { roomId, userId, isViewer } = socket.data;

            if (isViewer && roomId) {
                if (roomViewerSockets[roomId]) {
                    roomViewerSockets[roomId].delete(socket.id);
                    const newCount = roomViewerSockets[roomId].size;
                    socket.to(String(roomId)).emit('viewer-count', { count: newCount });
                    io.emit('live-viewer-count', { roomId, count: newCount });
                    if (roomViewerSockets[roomId].size === 0) delete roomViewerSockets[roomId];
                }

                if (userId) {
                    await Live.findOneAndUpdate(
                        { roomId: String(roomId) },
                        { $pull: { viewers: userId } }
                    );
                    
                    const livePop = await Live.findOne({ roomId: String(roomId) }).populate("viewers", "name email profilePic");
                    if (livePop) {
                            socket.to(String(roomId)).emit("viewers-update", { viewers: livePop.viewers });
                    }
                }
            }

            if (creatorTransports[socket.id] && roomId) {
                await Live.deleteOne({ roomId: String(roomId) });

                if (roomProducers[roomId]) {
                    const producers = roomProducers[roomId];
                    if (producers.audio) producers.audio.close();
                    if (producers.video) producers.video.close();
                    delete roomProducers[roomId];
                }

                delete roomViewerSockets[roomId];

                io.emit('live-ended', { roomId });

                socket.to(String(roomId)).emit('room-ended');
            }
        }

        if (creatorTransports[socket.id]) {
            creatorTransports[socket.id].close();
            delete creatorTransports[socket.id];
        }
        if (viewerTransports[socket.id]) {
            viewerTransports[socket.id].close();
            delete viewerTransports[socket.id];
        }
        if (viewerConsumers[socket.id]) {
            const consumers = viewerConsumers[socket.id];
            if (consumers.audio) consumers.audio.close();
            if (consumers.video) consumers.video.close();
            delete viewerConsumers[socket.id];
        }
    });



    socket.on("getRouterRtpCapabilities", (callback) => {
        if (!router) return;
        safeCb(callback, router.rtpCapabilities);
    });


    socket.on("createProducerTransport", async (callback) => {
        try {
            const transport = await router.createWebRtcTransport({
                listenIps: [{ 
                    ip: "0.0.0.0", 
                    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1" 
                }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });
            creatorTransports[socket.id] = transport;
            safeCb(callback, {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            });
        } catch (err) { safeCb(callback, { error: err.message }); }
    });

    socket.on("connectProducerTransport", async ({ dtlsParameters }, callback) => {
        try {
            await creatorTransports[socket.id].connect({ dtlsParameters });
            safeCb(callback);
        } catch (err) { }
    });

    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
        try {
            const roomId = socket.data?.roomId;
            if (!roomId) {
                return;
            }
            const producer = await creatorTransports[socket.id].produce({ kind, rtpParameters });
            console.log(` ✅ [Server] Producer Created: ${kind} (id=${producer.id}) for socket=${socket.id} in room=${roomId}`);

            if (!roomProducers[String(roomId)]) roomProducers[String(roomId)] = {};
            roomProducers[String(roomId)][kind] = producer;

            producer.on('transportclose', () => {
                console.log(` 🛑 [Server] Producer Transport closed: ${kind} (id=${producer.id})`);
                if (roomProducers[String(roomId)]) delete roomProducers[String(roomId)][kind];
            });

            socket.broadcast.to(String(roomId)).emit("new-producer", { producerId: producer.id, kind });
            safeCb(callback, { id: producer.id });
        } catch (err) {
            console.error(" ❌ [Server] Produce error:", err);
        }
    });


    socket.on("createConsumerTransport", async (callback) => {
        try {
            const transport = await router.createWebRtcTransport({
                listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });
            viewerTransports[socket.id] = transport;
            safeCb(callback, {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            });
        } catch (err) { }
    });

    socket.on("connectConsumerTransport", async ({ dtlsParameters }, callback) => {
        try {
            console.log(` [Server] Connecting Consumer Transport for socket=${socket.id}`);
            await viewerTransports[socket.id].connect({ dtlsParameters });
            safeCb(callback);
        } catch (err) { 
            console.error(' connectConsumerTransport error:', err);
        }
    });

    socket.on("consume", async ({ rtpCapabilities, producerId, kind }, callback) => {
        try {
            if (router.canConsume({ producerId, rtpCapabilities })) {
                console.log(` [Server] Router CAN consume producerId=${producerId} (kind=${kind || 'unknown'})`);
                const consumer = await viewerTransports[socket.id].consume({
                    producerId,
                    rtpCapabilities,
                    paused: true
                });

                // Store per-kind so audio and video don't overwrite each other
                if (!viewerConsumers[socket.id]) viewerConsumers[socket.id] = {};
                viewerConsumers[socket.id][consumer.kind] = consumer;

                console.log(` [Server] Consumer created for ${consumer.kind} (producer=${producerId}) for socket=${socket.id}`);

                safeCb(callback, {
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters
                });
            } else {
                console.warn(` [Server] Cannot consume producerId=${producerId} for rtpCapabilities`);
                safeCb(callback, { error: "Cannot consume: RtpCapabilities mismatch or invalid ProducerID" });
            }
        } catch (error) {
            console.error(" [Server] consume error:", error);
            safeCb(callback, { error: error.message });
        }
    });

    socket.on("resume", async ({ kind }) => {
        try {
            console.log(` 🔄 [Server] Resume request for kind=${kind || 'all'} from socket=${socket.id}`);
            const consumers = viewerConsumers[socket.id];
            if (!consumers) {
                console.warn(` ⚠️ [Server] No consumers found for socket=${socket.id} during resume`);
                return;
            }
            // Resume specific kind, or all if kind not specified
            if (kind && consumers[kind]) {
                await consumers[kind].resume();
                console.log(` ▶️ [Server] Consumer RESUMED: ${kind} for socket=${socket.id}`);
            } else {
                if (consumers.video) {
                    await consumers.video.resume();
                    console.log(` ▶️ [Server] Consumer RESUMED: video for socket=${socket.id}`);
                }
                if (consumers.audio) {
                    await consumers.audio.resume();
                    console.log(` ▶️ [Server] Consumer RESUMED: audio for socket=${socket.id}`);
                }
            }
        } catch (error) { console.error(' ❌ [Server] Resume error:', error); }
    });
};

module.exports = handleConnection;
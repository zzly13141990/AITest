import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager';
import { GameManager } from './GameManager';
import { CONFIG } from './constants';
// 辅助函数：序列化房间数据（Map转数组）
function serializeRoom(room) {
    return {
        ...room,
        players: Array.from(room.players.entries()),
    };
}
const app = express();
// 开发环境：宽松的CORS配置
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const roomManager = new RoomManager();
const gameManager = new GameManager((roomId) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
        const gameState = gameManager.getGameState(room);
        io.to(roomId).emit('message', {
            type: 'gameState',
            data: gameState,
        });
    }
}, (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
        const gameResult = gameManager.getGameResult(room);
        io.to(roomId).emit('message', {
            type: 'gameEnded',
            data: gameResult,
        });
    }
});
// 定期清理超时房间
setInterval(() => {
    roomManager.cleanupTimeoutRooms();
}, 60000);
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // 发送房间列表
    socket.emit('message', {
        type: 'roomList',
        data: roomManager.getRoomList(),
    });
    socket.on('message', async (message) => {
        try {
            switch (message.type) {
                case 'ping':
                    socket.emit('message', {
                        type: 'pong',
                        data: { timestamp: Date.now() },
                    });
                    break;
                case 'createRoom':
                    handleCreateRoom(socket, message.data);
                    break;
                case 'joinRoom':
                    handleJoinRoom(socket, message.data);
                    break;
                case 'leaveRoom':
                    handleLeaveRoom(socket);
                    break;
                case 'exitGame':
                    handleExitGame(socket);
                    break;
                case 'toggleReady':
                    handleToggleReady(socket);
                    break;
                case 'startGame':
                    handleStartGame(socket);
                    break;
                case 'playerMove':
                    handlePlayerMove(socket, message.data.direction);
                    break;
                case 'useItem':
                    handleUseItem(socket, message.data.itemId, message.data.targetPlayerId);
                    break;
                case 'resetRooms':
                    handleResetRooms(socket);
                    break;
                case 'requestPause':
                    handleRequestPause(socket);
                    break;
                case 'confirmPause':
                    handleConfirmPause(socket);
                    break;
                case 'requestResume':
                    handleRequestResume(socket);
                    break;
                case 'confirmResume':
                    handleConfirmResume(socket);
                    break;
                case 'selectMap':
                    handleSelectMap(socket, message.data.map);
                    break;
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            socket.emit('message', {
                type: 'error',
                data: { message: 'Internal server error' },
            });
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        handleLeaveRoom(socket);
    });
});
function handleCreateRoom(socket, data) {
    const room = roomManager.createRoom(data.name, socket.id, data.playerName, data.password, data.gameDuration || 180, 2 // 固定为2人
    );
    socket.join(room.id);
    // 发送房间创建成功消息
    socket.emit('message', {
        type: 'roomCreated',
        data: {
            roomId: room.id,
            room: serializeRoom(room),
            player: Array.from(room.players.values()).find(p => p.socketId === socket.id),
        },
    });
    // 广播房间列表更新
    broadcastRoomList();
}
function handleJoinRoom(socket, data) {
    console.log('📥 Received joinRoom request:', data);
    // 先检查是否有可恢复的玩家
    const recoverable = roomManager.findRecoverablePlayer(data.playerName);
    if (recoverable && data.roomId === recoverable.room.id) {
        // 恢复玩家连接
        roomManager.recoverPlayer(recoverable.player, socket.id);
        socket.join(recoverable.room.id);
        // 发送恢复的完整状态
        const gameState = gameManager.getGameState(recoverable.room);
        socket.emit('message', {
            type: 'roomJoined',
            data: {
                room: serializeRoom(recoverable.room),
                player: recoverable.player,
                recovered: true, // 标记这是恢复的连接
            },
        });
        // 如果游戏正在进行，发送游戏状态
        if (recoverable.room.status === 'playing') {
            socket.emit('message', {
                type: 'gameState',
                data: gameState,
            });
        }
        // 通知房间内其他玩家
        socket.to(recoverable.room.id).emit('message', {
            type: 'playerJoined',
            data: { player: recoverable.player },
        });
        broadcastRoomList();
        return;
    }
    // 正常加入房间
    console.log('🔍 Attempting to join room:', data.roomId);
    const room = roomManager.joinRoom(data.roomId, socket.id, data.playerName, data.password);
    console.log('✅ Room found:', room);
    if (!room) {
        console.log('❌ Failed to join room - room not found or password wrong');
        socket.emit('message', {
            type: 'error',
            data: { message: '房间不存在或密码错误' },
        });
        return;
    }
    socket.join(room.id);
    console.log('📡 Joined socket to room:', room.id);
    // 通知加入房间的玩家
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    console.log('👤 Found player:', player);
    socket.emit('message', {
        type: 'roomJoined',
        data: {
            room: serializeRoom(room),
            player: player,
        },
    });
    // 通知房间内其他玩家
    socket.to(room.id).emit('message', {
        type: 'playerJoined',
        data: { player: player },
    });
    // 广播房间列表更新
    broadcastRoomList();
}
function handleResetRooms(socket) {
    console.log('🔄 Resetting all rooms');
    roomManager.reset();
    broadcastRoomList();
}
function handleRequestPause(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing' || room.isPaused)
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player)
        return;
    // 创建暂停请求
    room.pauseRequest = {
        fromPlayerId: player.id,
        confirmedBy: [player.id], // 请求者已确认
    };
    // 通知房间所有玩家
    io.to(room.id).emit('message', {
        type: 'pauseRequested',
        data: { fromPlayerId: player.id, fromPlayerName: player.name },
    });
}
function handleConfirmPause(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing' || !room.pauseRequest || room.isPaused)
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player)
        return;
    // 检查是否已确认
    if (!room.pauseRequest.confirmedBy.includes(player.id)) {
        room.pauseRequest.confirmedBy.push(player.id);
        // 通知房间所有玩家
        io.to(room.id).emit('message', {
            type: 'pauseConfirmed',
            data: { playerId: player.id, playerName: player.name, confirmedBy: [...room.pauseRequest.confirmedBy] },
        });
        // 检查是否所有玩家都确认（2人都确认）
        const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator);
        if (room.pauseRequest.confirmedBy.length >= nonSpectators.length) {
            // 所有玩家都确认，暂停游戏
            room.isPaused = true;
            console.log('⏸️ Game paused in room', room.id);
        }
    }
}
function handleRequestResume(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing' || !room.isPaused)
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player)
        return;
    // 创建恢复请求
    room.pauseRequest = {
        fromPlayerId: player.id,
        confirmedBy: [player.id], // 请求者已确认
    };
    // 通知房间所有玩家
    io.to(room.id).emit('message', {
        type: 'resumeRequested',
        data: { fromPlayerId: player.id, fromPlayerName: player.name },
    });
}
function handleConfirmResume(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing' || !room.pauseRequest || !room.isPaused)
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player)
        return;
    // 检查是否已确认
    if (!room.pauseRequest.confirmedBy.includes(player.id)) {
        room.pauseRequest.confirmedBy.push(player.id);
        // 通知房间所有玩家
        io.to(room.id).emit('message', {
            type: 'resumeConfirmed',
            data: { playerId: player.id, playerName: player.name, confirmedBy: [...room.pauseRequest.confirmedBy] },
        });
        // 检查是否所有玩家都确认（2人都确认）
        const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator);
        if (room.pauseRequest.confirmedBy.length >= nonSpectators.length) {
            // 所有玩家都确认，恢复游戏
            room.isPaused = false;
            room.pauseRequest = undefined;
            console.log('▶️ Game resumed in room', room.id);
        }
    }
}
function handleExitGame(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room)
        return;
    // 如果游戏正在进行或已结束，重置游戏状态
    if (room.status === 'playing' || room.status === 'ended') {
        gameManager.stopGame(room.id);
        roomManager.resetRoomGame(room);
        // 通知房间内所有玩家游戏已退出，回到房间
        io.to(room.id).emit('message', {
            type: 'gameExited',
            data: { room: serializeRoom(room) },
        });
    }
}
function handleLeaveRoom(socket) {
    // 先获取房间 ID（在 leaveRoom 之前）
    const roomId = roomManager.getRoomBySocketId(socket.id)?.id;
    const room = roomManager.leaveRoom(socket.id);
    if (room) {
        socket.leave(room.id);
        // 发送完整的房间状态更新，包含新房主信息
        io.to(room.id).emit('message', {
            type: 'roomJoined',
            data: {
                room: serializeRoom(room),
            },
        });
        // 如果游戏正在进行，停止游戏
        if (room.status === 'playing') {
            gameManager.stopGame(room.id);
            roomManager.resetRoomGame(room);
        }
    }
    else if (roomId) {
        // 房间已被删除，离开房间
        socket.leave(roomId);
    }
    // 总是广播房间列表更新
    broadcastRoomList();
}
function handleToggleReady(socket) {
    console.log('handleToggleReady called for socket:', socket.id);
    const room = roomManager.getRoomBySocketId(socket.id);
    console.log('Room found:', room?.id, 'status:', room?.status);
    if (!room || room.status !== 'waiting')
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    console.log('Player found:', player?.name, 'current ready state:', player?.isReady);
    if (!player)
        return;
    player.isReady = !player.isReady;
    console.log('Toggled to:', player.isReady);
    // 通知房间内所有玩家
    io.to(room.id).emit('message', {
        type: 'playerReadyChanged',
        data: { playerId: player.id, isReady: player.isReady },
    });
    console.log('Sent playerReadyChanged to room:', room.id);
}
function handleStartGame(socket) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'waiting')
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player || !player.isHost)
        return;
    // 检查是否至少有2名玩家准备好
    const readyPlayers = Array.from(room.players.values()).filter(p => p.isReady && !p.isSpectator);
    if (readyPlayers.length < 2) {
        socket.emit('message', {
            type: 'error',
            data: { message: '至少需要2名玩家准备好才能开始游戏' },
        });
        return;
    }
    // 初始化游戏
    roomManager.initializeGame(room);
    // 通知游戏开始
    io.to(room.id).emit('message', {
        type: 'gameStarted',
        data: {
            room: serializeRoom(room),
        },
    });
    // 开始游戏循环
    gameManager.startGame(room);
    // 广播房间列表更新
    broadcastRoomList();
}
function handlePlayerMove(socket, direction) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing')
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player || !player.isAlive)
        return;
    // 处理反向控制
    let actualDirection = direction;
    if (player.isReversed) {
        const reverseMap = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left',
        };
        actualDirection = reverseMap[direction];
    }
    // 防止180度转向
    const oppositeDirections = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
    };
    if (oppositeDirections[actualDirection] !== player.direction) {
        player.nextDirection = actualDirection;
    }
}
function handleUseItem(socket, itemId, targetPlayerId) {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.status !== 'playing')
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player || !player.isAlive)
        return;
    const success = gameManager.useItem(player, itemId, targetPlayerId, room);
    if (success) {
        // 通知道具使用
        io.to(room.id).emit('message', {
            type: 'itemUsed',
            data: {
                playerId: player.id,
                itemId: itemId,
                targetPlayerId: targetPlayerId,
            },
        });
    }
}
function broadcastRoomList() {
    io.emit('message', {
        type: 'roomList',
        data: roomManager.getRoomList(),
    });
}
function handleSelectMap(socket, map) {
    console.log('🗺️ handleSelectMap called:', map);
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room)
        return;
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player || !player.isHost) {
        // 只有房主可以选择地图
        return;
    }
    // 更新房间的地图信息
    room.customMap = map;
    room.walls = map ? map.walls : undefined;
    room.obstacles = map ? map.obstacles : undefined;
    if (map) {
        room.gridWidth = map.width;
        room.gridHeight = map.height;
    }
    else {
        // 恢复默认地图
        room.gridWidth = CONFIG.GRID_WIDTH;
        room.gridHeight = CONFIG.GRID_HEIGHT;
    }
    // 通知房间里的所有玩家地图已变更
    io.to(room.id).emit('message', {
        type: 'mapChanged',
        data: { map },
    });
}
server.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`);
});
// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    gameManager.cleanup();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

import { generateRoomId, generateId, getRandomEmptyPosition, getRandomItemType, getInitialSnakePosition } from './utils';
import { CONFIG, ITEM_COLORS } from './constants';
export class RoomManager {
    rooms = new Map();
    socketToRoom = new Map(); // socketId -> roomId
    playerIdToSocket = new Map(); // playerId -> socketId
    /**
     * 创建新房间
     */
    createRoom(name, hostSocketId, hostPlayerName, password, gameDuration = 180, maxPlayers = 2 // 固定为2人
    ) {
        let roomId = generateRoomId();
        // 确保房间ID唯一
        while (this.rooms.has(roomId)) {
            roomId = generateRoomId();
        }
        const hostPlayer = {
            id: generateId(),
            socketId: hostSocketId,
            name: hostPlayerName,
            isHost: true,
            isReady: false,
            snake: [],
            direction: 'right',
            nextDirection: 'right',
            score: 0,
            items: [],
            isFrozen: false,
            frozenUntil: 0,
            isReversed: false,
            reversedUntil: 0,
            isAlive: true,
            wins: 0,
            losses: 0,
        };
        const room = {
            id: roomId,
            name,
            hostId: hostPlayer.id,
            players: new Map([[hostPlayer.id, hostPlayer]]),
            status: 'waiting',
            maxPlayers: 2, // 固定为2人
            hasPassword: !!password,
            password,
            gameDuration,
            createdAt: Date.now(),
            foods: [],
            gridWidth: CONFIG.GRID_WIDTH,
            gridHeight: CONFIG.GRID_HEIGHT,
        };
        this.rooms.set(roomId, room);
        this.socketToRoom.set(hostSocketId, roomId);
        this.playerIdToSocket.set(hostPlayer.id, hostSocketId);
        return room;
    }
    /**
     * 加入房间
     */
    joinRoom(roomId, socketId, playerName, password) {
        console.log('🔍 joinRoom called:', { roomId, socketId, playerName, password });
        const room = this.rooms.get(roomId);
        console.log('📋 Room found:', room);
        if (!room) {
            console.log('❌ Room not found');
            return null;
        }
        console.log('🔐 Checking password:', { hasPassword: room.hasPassword, providedPassword: password });
        // 检查密码
        if (room.hasPassword && room.password !== password) {
            console.log('❌ Wrong password');
            return null;
        }
        console.log('👥 Checking room capacity:', { current: room.players.size, max: 2 });
        // 检查房间是否满员（固定为2人）
        if (room.players.size >= 2) {
            console.log('❌ Room is full');
            return null;
        }
        // 检查是否已经在房间里
        const existingPlayer = Array.from(room.players.values()).find(p => p.socketId === socketId);
        if (existingPlayer) {
            console.log('✅ Player already in room');
            return room;
        }
        const player = {
            id: generateId(),
            socketId,
            name: playerName,
            isHost: false,
            isReady: false,
            snake: [],
            direction: 'left',
            nextDirection: 'left',
            score: 0,
            items: [],
            isFrozen: false,
            frozenUntil: 0,
            isReversed: false,
            reversedUntil: 0,
            isAlive: true,
            wins: 0,
            losses: 0,
        };
        room.players.set(player.id, player);
        this.socketToRoom.set(socketId, roomId);
        this.playerIdToSocket.set(player.id, socketId);
        return room;
    }
    /**
     * 离开房间
     */
    leaveRoom(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return null;
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        // 找到并移除玩家
        let removedPlayer;
        for (const [playerId, player] of room.players) {
            if (player.socketId === socketId) {
                removedPlayer = player;
                room.players.delete(playerId);
                break;
            }
        }
        if (!removedPlayer)
            return null;
        this.socketToRoom.delete(socketId);
        this.playerIdToSocket.delete(removedPlayer.id);
        // 如果房间为空，删除房间
        if (room.players.size === 0) {
            this.rooms.delete(roomId);
            return null;
        }
        // 如果房主离开，选择新房主
        if (removedPlayer.isHost) {
            const newHost = Array.from(room.players.values())[0];
            newHost.isHost = true;
            room.hostId = newHost.id;
        }
        return room;
    }
    /**
     * 获取房间
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    /**
     * 根据socketId获取房间
     */
    getRoomBySocketId(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        return roomId ? this.rooms.get(roomId) : undefined;
    }
    /**
     * 获取所有房间信息
     */
    getRoomList() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            hostName: Array.from(room.players.values()).find(p => p.id === room.hostId)?.name || '',
            playerCount: room.players.size,
            maxPlayers: 2, // 固定为2人
            hasPassword: room.hasPassword,
            status: room.status,
            gameDuration: room.gameDuration,
        }));
    }
    /**
     * 初始化游戏
     */
    initializeGame(room) {
        room.status = 'playing';
        room.gameStartedAt = Date.now();
        // 初始化玩家蛇
        const players = Array.from(room.players.values()).filter(p => !p.isSpectator);
        players.forEach((player, index) => {
            player.snake = getInitialSnakePosition(index, room.gridWidth, room.gridHeight);
            player.direction = index === 0 ? 'right' : 'left';
            player.nextDirection = player.direction;
            player.score = 0;
            player.items = [];
            player.isFrozen = false;
            player.isReversed = false;
            player.isAlive = true;
        });
        // 生成初始食物
        this.generateFoods(room);
    }
    /**
     * 生成食物
     */
    generateFoods(room) {
        const occupiedPositions = [];
        // 收集所有蛇的位置
        for (const player of room.players.values()) {
            if (!player.isSpectator) {
                occupiedPositions.push(...player.snake);
            }
        }
        // 收集现有食物位置
        occupiedPositions.push(...room.foods);
        room.foods = [];
        // 生成新食物
        for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
            const type = getRandomItemType();
            const pos = getRandomEmptyPosition(room.gridWidth, room.gridHeight, occupiedPositions, room.walls, room.obstacles);
            room.foods.push({
                ...pos,
                type,
                color: ITEM_COLORS[type],
                id: generateId(),
            });
            occupiedPositions.push(pos);
        }
    }
    /**
     * 查找是否有可恢复的玩家（通过playerName查找
     */
    findRecoverablePlayer(playerName) {
        for (const room of this.rooms.values()) {
            for (const player of room.players.values()) {
                // 查找同名玩家且socket已经断开连接（socket.id !== player.socketId
                if (player.name === playerName) {
                    // 检查socket是否还在socketToRoom中
                    const existingSocketRoomId = this.socketToRoom.get(player.socketId);
                    if (!existingSocketRoomId || existingSocketRoomId !== room.id) {
                        return { room, player };
                    }
                }
            }
        }
        return null;
    }
    /**
     * 恢复玩家连接
     */
    recoverPlayer(player, newSocketId) {
        // 更新socket映射
        this.socketToRoom.set(newSocketId, this.socketToRoom.get(player.socketId));
        this.playerIdToSocket.set(player.id, newSocketId);
        player.socketId = newSocketId;
    }
    /**
     * 检查并清理超时房间
     */
    cleanupTimeoutRooms() {
        const now = Date.now();
        for (const [roomId, room] of this.rooms) {
            if (now - room.createdAt > CONFIG.ROOM_TIMEOUT) {
                this.rooms.delete(roomId);
                // 清理socket映射
                for (const player of room.players.values()) {
                    this.socketToRoom.delete(player.socketId);
                    this.playerIdToSocket.delete(player.id);
                }
            }
        }
    }
    /**
     * 重置房间游戏状态，返回等待状态
     */
    resetRoomGame(room) {
        room.status = 'waiting';
        room.gameStartedAt = undefined;
        room.isPaused = false;
        room.pauseRequest = undefined;
        room.foods = [];
        // 重置所有玩家状态
        for (const player of room.players.values()) {
            player.isReady = false;
            player.snake = [];
            player.score = 0;
            player.items = [];
            player.isFrozen = false;
            player.frozenUntil = 0;
            player.isReversed = false;
            player.reversedUntil = 0;
            player.isAlive = true;
            player.hasSpeedBoost = false;
            player.speedBoostUntil = undefined;
            player.lastItemUsedAt = undefined;
        }
    }
    /**
     * 重置所有房间
     */
    reset() {
        console.log('🔄 Resetting RoomManager - clearing all rooms');
        this.rooms.clear();
        this.socketToRoom.clear();
        this.playerIdToSocket.clear();
    }
}

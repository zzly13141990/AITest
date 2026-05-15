import { ITEM_WEIGHTS, CONFIG } from './constants';
/**
 * 生成6位数字房间ID
 */
export function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * 生成唯一ID
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * 检查位置是否碰撞
 */
export function checkCollision(pos, positions, gridWidth, gridHeight, walls = [], obstacles = []) {
    // 检查边界
    if (pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight) {
        return true;
    }
    // 检查墙壁
    if (walls.some(wall => wall.x === pos.x && wall.y === pos.y)) {
        return true;
    }
    // 检查障碍物
    if (obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y)) {
        return true;
    }
    // 检查自身或其他蛇
    return positions.some(p => p.x === pos.x && p.y === pos.y);
}
/**
 * 获取随机空位置
 */
export function getRandomEmptyPosition(gridWidth, gridHeight, occupiedPositions, walls = [], obstacles = []) {
    let attempts = 0;
    const maxAttempts = 1000;
    while (attempts < maxAttempts) {
        const pos = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        const isOccupied = occupiedPositions.some(p => p.x === pos.x && p.y === pos.y) ||
            walls.some(w => w.x === pos.x && w.y === pos.y) ||
            obstacles.some(o => o.x === pos.x && o.y === pos.y);
        if (!isOccupied) {
            return pos;
        }
        attempts++;
    }
    // 如果找不到空位置，返回一个默认位置
    return { x: 1, y: 1 };
}
/**
 * 根据权重随机选择道具类型
 */
export function getRandomItemType() {
    const totalWeight = Object.values(ITEM_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    for (const [type, weight] of Object.entries(ITEM_WEIGHTS)) {
        random -= weight;
        if (random <= 0) {
            return type;
        }
    }
    return 'normal';
}
/**
 * 获取蛇的初始位置
 */
export function getInitialSnakePosition(index, gridWidth, gridHeight) {
    const positions = [];
    const startY = Math.floor(gridHeight / 2);
    if (index === 0) {
        // 玩家1，在左边，蛇向右，蛇数组是 [5, 6, 7], 蛇头在 7
        const startX = 5;
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            positions.push({ x: startX + i, y: startY });
        }
    }
    else {
        // 玩家2，在右边，蛇向左，蛇数组应该是 [24, 23, 22], 蛇头在 22
        const startX = gridWidth - 8;
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            positions.push({ x: startX + (CONFIG.INITIAL_SNAKE_LENGTH - 1 - i), y: startY });
        }
    }
    return positions;
}

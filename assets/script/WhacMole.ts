import { _decorator, Component, Prefab, instantiate, Size, Node, math, tween, ParticleSystem, physics, Vec2, v2, v3 } from 'cc';
import { ArrayUtils } from '../utils/ArrayUtils';

const { BoxCollider } = physics;
const { Vec3 } = math;
const { ccclass, property } = _decorator;
interface MapItem {
    /**
     * 存在与否
     */
    exist: boolean
    /**
     * 坐标，待定，因为这个可以算出来
     */
    pointX?:number
    pointY?: number
}
interface MasterDirection {
    'top': boolean,
    'bottom': boolean,
    'left': boolean,
    'right': boolean
}

/**
 * 获取随机数
 */
export function getRandomNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

@ccclass('WhacMole')
export class WhacMole extends Component {
    @property({ type: Prefab })
    public Blue_Vert: Prefab | null = null;
    @property({ type: Prefab })
    public Green_Horiz: Prefab | null = null;
    @property({ type: Prefab })
    public Orange_Horiz: Prefab | null = null;
    @property({ type: Prefab })
    public Pink_Horiz: Prefab | null = null;
    @property({ type: Prefab })
    public Purple_Horiz: Prefab | null = null;
    @property({ type: Prefab })
    public Yellow_Horiz: Prefab | null = null;
    @property({ type: Prefab })
    public MapBg: Prefab | null = null;

    private masterList: any[] = [];

    start() {
        this._onload();
        this._test()
    }
    _test() {
        const master = instantiate(this.Blue_Vert);
        const masterBoxColl = master.addComponent(BoxCollider);
        // this.node.addChild()
    }
    _onload() {
        const map = this._createMap();
        const masterList = map.map(item => {
            enum MasterKey {
                Blue_Vert = 0,
                Green_Horiz = 1,
                Orange_Horiz = 2,
                Pink_Horiz = 3,
                Purple_Horiz = 4,
                Yellow_Horiz = 5
            }
            const RandomNum = getRandomNum(0, 5)
            const masterName = MasterKey[RandomNum]
            const master = this._loadImage(this[masterName], item.pointX * 68, item.pointY * 68)
            const masterCollBody = master.addComponent(ParticleSystem)
            this.node.addChild(master)

            // 添加刚体平台
            // const
            return {
                ...item,
                node: master,
                name: masterName,
                direction: {
                    'top': false,
                    'bottom': false,
                    'left': false,
                    'right': false
                }
            }
        })
        this._crushMaster(masterList)
        // 移动坐标
        this._moveMaster(masterList)
        // this.node.removeAllChildren();
        // this.node.addChild(instantiate(this.Blue_Vert))
    }
    _createMap() {
        // 9*8 个格子   地图需要存储对应坐标和位置，方便怪兽找到对应位置。
        // 有些格子可能在显示上是不会出现的。上面不会存在怪物
        const map: MapItem[] = (new Array(72)).fill({ exist: true })
        return map.map((item, idx) => {
            // 计算当前列数
            // this.node.addChild(this._loadImage(0,0, 68, 68))
            const row = (idx % 9) + 1
            const col = Math.ceil(((idx + 1) / 9))
            let spriteNode = null
            if (item.exist) {
                spriteNode = this._loadImage(this.MapBg, row * 68, col * 68, 68, 68)
                this.node.addChild(spriteNode)
            }
            return {
                ...item,
                pointX:row,
                pointY: col
            }
        })
    }
    _loadImage(url, x?: number, y?: number, w?: number, h?: number) {
        const ownSprite = instantiate(url)
        if (x && y) {
            ownSprite.setPosition(x, y)
        }
        if (w && h) {
            ownSprite.setContentSize(new Size(w, h))
        }
        return ownSprite
    }
    /** 消除怪物 */
    _crushMaster(List) {
        // 递归怪物四个方向的所有可能
        const getCrushMaster = (master, masterList, count, crushList, direction, getPointFn) => {
            let point = {
                x: master.pointX,
                y: master.pointY
            }
            if (count === 1) {
                point = {
                    x: master.pointX,
                    y: master.pointY
                }
            } else {
                point = getPointFn({
                    pointX: master.pointX,
                    pointY: master.pointY
                })
            }
            const nextMaster = masterList.find(item => item.pointX === point.x && item.pointY === point.y)
            console.log(nextMaster,'nextMaster')
            // 如果名字相同的话继续往下找
            if (nextMaster?.name === master?.name) {
                nextMaster.direction[direction] = true
                crushList.push(nextMaster)
                count++;
                return getCrushMaster(nextMaster, masterList, count, crushList, direction, getPointFn)
            } else {
                // 可以消除了
                if (nextMaster) {
                    let BackDirection = 'top'
                    switch (direction) {
                        case 'top':
                            BackDirection = 'bottom'
                            break;
                        case 'bottom':
                            BackDirection = 'top'
                            break;
                        case 'left':
                            BackDirection = 'right'
                            break;
                        case 'right':
                            BackDirection = 'left'
                            break;
                        default:
                            BackDirection = 'bottom'
                            break;
                    }
                    nextMaster.direction[BackDirection] = true
                }
                if (count > 3) {
                    return crushList
                }
            }
        }

        const getPoint = {
            left({
                pointX,
                pointY
            }) {
                return {
                    x: pointX - 1,
                    y: pointY
                }
            },
            right({
                pointX,
                pointY
            }) {
                return {
                    x: pointX + 1,
                    y: pointY
                }
            },
            up({
                pointX,
                pointY
            }) {
                return {
                    x: pointX,
                    y: pointY + 1
                }
            },
            down({
                pointX,
                pointY
            }) {
                return {
                    x: pointX,
                    y: pointY - 1
                }
            }
        }
        // 判断每个怪兽的上下左右是否有相同的怪兽，如果有的话，继续向该方向往下走
        /**
         *  下一步优化：
         *  扫描过但没有三连的，固定方向不再扫描
         *  扫描到不相同的怪兽，记录该怪兽相反方向不扫描
         */
        let i = 1
        let crushMasters = []
        List.forEach((item, idx, arr) => {
            // 连击数
            let count = 1
            // 维护可以消除的怪物
            let whileLoopIdx = 0
            while (whileLoopIdx < 4) {
                let getPointFn = getPoint.up
                let direction = 'up'
                switch (whileLoopIdx) {
                    case 0:
                        getPointFn = getPoint.up
                        direction = 'top'
                        break;
                    case 1:
                        getPointFn = getPoint.down
                        direction = 'bottom'
                        break;
                    case 2:
                        getPointFn = getPoint.left
                        direction = 'left'
                        break;
                    case 3:
                        getPointFn = getPoint.right
                        direction = 'right'
                        break;
                    default:
                        break;
                }
                whileLoopIdx++
                if (!!item.direction.top && direction === 'top') continue
                if (!!item.direction.bottom && direction === 'bottom') continue
                if (!!item.direction.left && direction === 'left') continue
                if (!!item.direction.right && direction === 'right') continue
                i++
                let crushList = [item]
                item.direction[direction] = true
                const CrushMasterList = getCrushMaster(item, arr, count, crushList, direction, getPointFn)
                if (!!CrushMasterList) {
                    crushMasters = [...crushMasters, ...CrushMasterList]
                    CrushMasterList.forEach((masterItem: {
                        node: Node
                        direction: MasterDirection
                        name: string
                        exist: false
                    }) => {
                        // masterItem.node.setScale((new Vec3(.4,.4,.4)))
                        this.node.removeChild(masterItem.node)
                        masterItem.node = null
                        masterItem.direction = {
                            'top': false,
                            'bottom': false,
                            'left': false,
                            'right': false
                        }
                        masterItem.name = ''
                        masterItem.exist = false
                        //消除的怪物占位需要被顶上来
                    })
                }
                // 扫描每列最下方空的位置，
            }
        })
        return Array.from(new Set(crushMasters))
    }
    _moveMaster(originalList) {
        // 扫描所有空的位置
        const emptyPos = originalList.filter(item => !item.exist) as any[]
        // 开始分组
        // 将空出的地图分组处理
        const emptyMapCol = ArrayUtils.groupBy(emptyPos, 'pointX')
        // 过滤每组中连在一起的格子,取最下的一个格子
        console.log(emptyMapCol,'emptyMapCol')
        let emptyMapColDep = {}
        for(let key of Object.keys(emptyMapCol)) {
            const single = []
            const repeat = []
            emptyMapCol[key].forEach(item=> {
                // 如果最终数据里有相邻的,将对象push到重复的队列中
                // TODO 有问题需要后续修复
                if(single.findIndex(singleItem => singleItem.pointY === item.pointY + 1) || single.findIndex(singleItem => singleItem.pointY === item.pointY - 1)) {
                    repeat.push(item)
                } else {
                    if(repeat.findIndex(repeatItem => repeatItem.pointY === item.pointY + 1) || repeat.findIndex(repeatItem => repeatItem.pointY === item.pointY - 1)) {
                        repeat.push(item)
                    } else {
                        single.push(item)
                    }
                }
            })
            console.log(single)
            console.log(repeat)
            emptyMapColDep[key] = single
        }
        console.log(emptyMapColDep,'emptyMapColDep')
        // 将所有格子分为9列
        // emptyPos.forEach(item => {
        //     const colList = originalList.filter(listItem => listItem.pointX === item.pointX && listItem.pointY > item.pointY)
        //     console.log(colList,'colList')


        //     if (colList.length !== 0) {
        //         colList.forEach((colItem: {
        //             node: Node
        //             pointX:number
        //             pointY: number
        //         }, idx) => {
        //             // if (!!colItem.node) {
        //             //     tween(colItem.node).to(1, { position: v3(colItem.pointX * 68, (colItem.pointY + (item.pointY - colItem.pointY) + idx) * 68, 0) }).call(() => {
        //             //         // 改变格子状态
        //             //     }).start()
        //             // }
        //         })
        //     }
        // })
    }
    update(deltaTime: number) {

    }
}



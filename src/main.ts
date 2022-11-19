interface ISkiplistItem {
    value: number
    next: null | ISkiplistItem
    down: null | ISkiplistItem
}

interface ISkiplistOperation {
    addItem(item: number): void
    deleteItem(item: number): void
    existItem(item: number): boolean
}

type ExistItemReturnType = {
    exist: boolean
    downDepthNode: ISkiplistItem | null
}

class SkiplistRow {
    private head: ISkiplistItem | null

    addItem(item: number, downDepthNode: ISkiplistItem | null): ISkiplistItem | null {
        if (this.head == null) {
            this.head = {
                value: item,
                next: null,
                down: downDepthNode,
            }
        }

        const newNode: ISkiplistItem = {
            value: item,
            next: null,
            down: downDepthNode,
        }

        let node: ISkiplistItem | null = this.head
        let prevNode: ISkiplistItem | null = null
        while (node) {
            if (node.value === item) {
                // 추가 작업 없음
                return null
            }
            if (node.value > item) {
                newNode.next = node
                if (node === this.head) {
                    // head의 값이 제일 큰 상황
                    this.head = newNode
                } else if (prevNode) {
                    prevNode.next = newNode
                }
                break
            }
            prevNode = node
            node = node.next
        }

        if (node == null) {
            // item이 제일 큰 값
            if (prevNode) prevNode.next = newNode
        }

        return newNode
    }

    deleteItem(item: number): void {
        if (!this.head) {
            return
        }
        let node: ISkiplistItem = this.head
        let prevNode = node
        while (node) {
            if (node.value === item) {
                if (node === this.head) {
                    this.head = null
                } else {
                    prevNode.next = null
                }
                break
            }
            prevNode = node
            node = node.next!
        }
    }

    existItem(item: number, startNode: ISkiplistItem | null): ExistItemReturnType {
        if (!this.head) {
            return {
                exist: false,
                downDepthNode: null,
            }
        }
        let node: ISkiplistItem = startNode ?? this.head
        let prevNode: ISkiplistItem | null = null
        while (node) {
            if (node.value === item) {
                return {
                    exist: true,
                    downDepthNode: null,
                }
            } else if (node.value > item) {
                if (prevNode?.down) {
                    return {
                        exist: false,
                        downDepthNode: prevNode.down,
                    }
                }
                break
            }
            prevNode = node
            node = node.next!
        }
        return {
            exist: false,
            downDepthNode: prevNode?.down || null,
        }
    }
}

class Skiplist implements ISkiplistOperation {
    private skiplistRows: SkiplistRow[] = []

    constructor(private depth: number) {
        if (this.depth < 1) this.depth = 1
        for (let i = 0; i < depth; i++) {
            this.skiplistRows.push(new SkiplistRow())
        }
    }

    addItem(item: number): void {
        // 해당 값이 이미 있는지 검사 (있으면 아무것도 하지 않음)
        if (this.existItem(item)) return

        // 없으면 depth 0부터 추가
        let downDepthNode: ISkiplistItem | null = null
        for (let i = 0; i < this.depth; i++) {
            downDepthNode = this.skiplistRows[i].addItem(item, downDepthNode)
            if (!downDepthNode) {
                // 이미 존재하는 값
                break
            }
            if (Math.round(Math.random()) === 0) {
                // 더 이상 추가하지 않음
                break
            }
            // 다음 depth에도 추가
        }
    }

    deleteItem(item: number): void {
        for (let i = 0; i < this.depth; i++) {
            this.skiplistRows[i].deleteItem(item)
        }
    }

    existItem(item: number): boolean {
        let currentDepth = this.depth - 1
        let upDepthNode: ISkiplistItem | null = null
        while (currentDepth >= 0) {
            const returnValue = this.skiplistRows[currentDepth].existItem(item, upDepthNode)
            if (returnValue.exist) return true
            if (returnValue.downDepthNode) {
                upDepthNode = returnValue.downDepthNode
            }
            currentDepth--
        }
        return false
    }
}

const DATA_SIZE = 30000
const SKIPLIST_DEPTH_SIZE = 6

const skiplist: ISkiplistOperation = new Skiplist(SKIPLIST_DEPTH_SIZE)
const arr: number[] = []

for (let i = 0; i < DATA_SIZE; i++) {
    const value = Math.round(Math.random() * DATA_SIZE)
    skiplist.addItem(value)
    arr.push(value)
}

let skiplistTrueCnt = 0
console.time('skiplist find')
for (let i = 0; i < DATA_SIZE; i++) {
    skiplist.existItem(i) && skiplistTrueCnt++
}
console.timeEnd('skiplist find')

let arrayTrueCnt = 0
console.time('array find')
for (let i = 0; i < DATA_SIZE; i++) {
    ;(arr.find(item => item === i) ? true : false) && arrayTrueCnt++
}
console.timeEnd('array find')

console.log('Data match -> ', skiplistTrueCnt === arrayTrueCnt)

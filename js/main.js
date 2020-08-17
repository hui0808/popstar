class GameObject {
    constructor() {
        this.events = []
    }

    static new(...args) {
        let i = new this(...args)
        // i.main = this.main
        return i
    }

    init() {
    }

    update() {
    }

    debug() {
    }

    listener(element, type, callback) {
        this.events.push([element, type, callback])
        element.addEventListener(type, callback)
    }

    destory() {
        for (let [element, type, callback] of this.events) {
            element.removeEventListener(type, callback)
        }
    }
}

class Game extends GameObject {
    constructor() {
        super()
        this.fps = 30
        this.scene = null
        this.pause = false
        this.runWithScene(NextStage)
    }

    static instance(...args) {
        this.i = this.i || new this(...args)
        return this.i
    }

    update() {
        this.scene.update()
    }

    runloop() {
        if (!this.pause) {
            this.update()
        }
        setTimeout(() => {
            this.runloop()
        }, 1000 / this.fps)
    }

    runWithScene(scene, callback) {
        this.scene = scene.new(this, callback)
        // 开始运行程序
        setTimeout(() => {
            this.runloop()
        }, 1000 / this.fps)
    }

    replaceScene(scene, callback) {
        this.pause = true
        this.scene.destory()
        let s = scene.new(this, callback)
        this.scene = s
        this.pause = false
    }
}

class Grid extends GameObject {
    constructor(game, x, y) {
        super()
        this.game = game
        this.x = x
        this.y = y
    }
}


class Star extends Grid {
    constructor(game, num, x, y) {
        super(game, x, y)
        this.num = num
        this.isHighlight = false
        this.isMark = false
    }

    static randomNumNew(game, x, y) {
        let num = ranint(0, 5)
        let grid = Star.new(game, num, x, y)
        grid.add()
        return grid
    }

    highlight() {
        this.isHighlight = true
        let element = this.game.getElementFromXY(this.x, this.y)
        element.classList.add('star-highlight')
    }

    clearHighlight() {
        if (this.isHighlight) {
            this.isHighlight = false
            let element = this.game.getElementFromXY(this.x, this.y)
            element.classList.remove('star-highlight')
        }
    }

    remove() {
        let element = this.game.getElementFromXY(this.x, this.y)
        element.classList.add('star-remove')
    }

    add() {
        let element = e('#id-grid')
        let html = `
            <div class="grid num${this.num} star-new position-${this.x}-${this.y}"
            data-x="${this.x}" data-y="${this.y}">
                <div class="grid-inner"></div>
            </div>
        `
        element.insertAdjacentHTML('beforeend', html)
    }


    moveTo(x, y) {
        this.game.stars[this.x][this.y] = null
        this.game.stars[x][y] = this
        let class_ = `position-${this.x}-${this.y}`
        let element = e('.' + class_)
        element.classList.replace(class_, `position-${x}-${y}`)
        element.dataset.x = x
        element.dataset.y = y
        this.x = x
        this.y = y
    }

    moveLeft() {
        this.moveTo(this.x, this.y - 1)
    }

    moveDown() {
        let x = this.x + 1
        let y = this.y
        for (; x < this.game.x; x++) {
            let star = this.game.stars[x][y]
            if (star !== null) {
                this.moveTo(x - 1, y)
                return
            }
        }
        this.moveTo(this.game.x - 1, y)
    }
}

class Scene
    extends GameObject {
    constructor(game, callback = null) {
        super()
        this.game = game
        this.stars = null
        this.x = 10
        this.y = 10
        this.target = 1000
        this.score = 0
        callback && callback(this)
        this.initHtml()
        this.initStars()
        this.register()
    }

    initStars() {
        this.stars = zeros(this.x, this.y)
        for (let i = this.x - 1; i >= 0; i--) {
            for (let j = 0; j < this.y; j++) {
                this.stars[i][j] = Star.randomNumNew(this, i, j)
            }
        }
        log('init', this.stars)
    }

    getXYFromElement(element) {
        let x = parseInt(element.dataset.x)
        let y = parseInt(element.dataset.y)
        return [x, y]
    }

    getElementFromXY(x, y) {
        let r = e(`[data-x="${x}"][data-y="${y}"]`)
        return r
    }

    getStarFromElement(element) {
        let [x, y] = this.getXYFromElement(element)
        return this.stars[x][y]
    }

    getStar(x, y) {
        return this.stars[x][y]
    }

    initHtml() {
        e('#id-grid').innerHTML = ''
        let html = ''
        for (let i = 0; i < this.x; i++) {
            let rowHtml = ''
            for (let j = 0; j < this.y; j++) {
                rowHtml += `<div class="cell"></div>`
            }
            html += `<div class="row">${rowHtml}</div>`
        }
        let s = e('#id-map')
        s.innerHTML = html
    }

    checkInterval() {
        let last = this.stars[this.x - 1]
        for (let i = 0; i < this.x; i++) {
            if (last[i] === null) {
                return i
            }
        }
        return -1
    }

    moveLeft(y) {
        if (y === -1) return
        for (let i = this.x - 1; i >= 0; i--) {
            for (let j = y + 1; j < this.y; j++) {
                let star = this.stars[i][j]
                star && star.moveLeft()
            }
        }
    }

    moveDown() {
        for (let i = 0; i < this.y; i++) {
            for (let j = this.x - 1; j >= 0; j--) {
                let star = this.stars[j][i]
                if (star !== null) {
                    star.moveDown()
                }
            }
        }
    }

    aroundCoordinate(x, y) {
        // 返回 (x, y) 周围四个合法坐标
        return aroundCoordinate(x, y, this.x, this.y)
    }

    expand(x, y, callback) {
        let arr = this.aroundCoordinate(x, y)
        for (let [x, y] of arr) {
            callback && callback(x, y)
        }
    }

    clearHighlight() {
        for (let i = 0; i < this.x; i++) {
            for (let j = 0; j < this.y; j++) {
                let star = this.stars[i][j]
                star && star.clearHighlight()
            }
        }
    }

    checkEnd() {
        for (let i = 0; i < this.x; i++) {
            for (let j = 0; j < this.y; j++) {
                let star = this.stars[i][j]
                star && (star.isMark = false)
            }
        }
        for (let i = 0; i < this.x; i++) {
            for (let j = 0; j < this.y; j++) {
                let star = this.stars[i][j]
                if (star === null || star.isMark) continue
                let count = 0
                let call = (x, y) => {
                    let s = this.getStar(x, y)
                    if (s !== null) {
                        if (s.num === star.num && !s.isMark) {
                            s.isMark = true
                            count++
                            this.expand(x, y, call)
                        }
                    }
                }
                this.expand(star.x, star.y, call)
                if (count >= 2) return false
            }
        }
        return true
    }

    plus(score) {
        this.score += score
        e('#id-info-score').innerHTML = `
            ${this.score}
            <div class="score-addition">+${score}</div>
        `
    }

    highlight(star) {
        let count = 1
        this.clearHighlight()
        star.highlight()
        let callback = (x, y) => {
            let s = this.getStar(x, y)
            if (s !== null) {
                if (s.num === star.num && !s.isHighlight) {
                    s.highlight()
                    count++
                    this.expand(x, y, callback)
                }
            }
        }
        this.expand(star.x, star.y, callback)
        return count
    }

    remove(star) {
        let count = this.highlight(star)
        if (count < 2) return
        let callback = (x, y) => {
            let s = this.getStar(x, y)
            if (s !== null) {
                if (s.isHighlight) {
                    s.clearHighlight()
                    s.remove()
                    this.expand(x, y, callback)
                }
            }
        }
        this.expand(star.x, star.y, callback)
        this.plus(count * 5 * count)
    }

    register() {
        this.listener(e('#id-grid'), 'click', event => {
            let target = event.target
            if (target.classList.contains('grid')) {
                let star = this.getStarFromElement(event.target)
                this.highlight(star)
            }
        })
        this.listener(e('#id-grid'), 'dblclick', event => {
            let target = event.target
            if (target.classList.contains('grid')) {
                let star = this.getStarFromElement(event.target)
                this.remove(star)
            }
        })
        this.listener(e('#id-grid'), 'transitionend', event => {
            let target = event.target
            if (target.classList.contains('star-remove')) {
                target.remove()
                let [x, y] = this.getXYFromElement(target)
                this.stars[x][y] = null
            }
        })
    }

    update() {
        super.update()
        this.moveDown()
        let index = this.checkInterval()
        this.moveLeft(index)
        if (this.checkEnd()) {
            if (this.score >= this.target) {
                this.game.replaceScene(NextStage)
            } else {
                this.game.replaceScene(GameOver)
            }
        }
    }
}

class GameOver extends GameObject {
    constructor(game) {
        super();
        this.game = game
        this.element = e('#id-message')
        this.register()
    }

    register() {
        let html = `
            <p>Game Over!</p>
            <div id="id-restart">Try again!</div>
        `
        this.element.classList.add('message-show')
        this.element.innerHTML = html
        this.listener(this.element, 'click', event => {
            let target = event.target
            if (target.id === 'id-restart') {
                this.game.replaceScene(NextStage)
            }
        })
    }

    destory() {
        super.destory();
        log('game over')
        e('#id-info-stage').innerHTML = "0"
        e('#id-info-score').innerHTML = "0"
        e('#id-info-target').innerHTML = "500"
        this.element.innerHTML = ''
        this.element.classList.remove('message-show')
    }
}

class NextStage extends GameObject {
    constructor(game) {
        super();
        this.game = game
        this.stageElement = e('#id-info-stage')
        this.scoreElement = e('#id-info-score')
        this.targetElement = e('#id-info-target')
        this.element = e('#id-message')
        this.init()
        this.register()
    }

    init() {
        super.init()
        this.stage = parseInt(this.stageElement.innerText) + 1
        this.stageElement.innerText = String(this.stage)
        this.scoreElement.innerText = '0'
        this.target = parseInt(this.targetElement.innerText) + 500
        this.targetElement.innerText = String(this.target)
    }

    register() {
        let html = `
            <p>Stage ${this.stage}</p>
            <p>Target ${this.target}</p>
        `
        this.element.classList.add('message-show')
        this.element.innerHTML = html
        this.listener(this.element, 'animationend', event => {
            let target = event.target
            if (target.classList.contains('message-show')) {
                this.game.replaceScene(Scene, scene => {
                    scene.target = this.target
                })
            }
        })
    }

    destory() {
        super.destory()
        this.element.innerHTML = ''
        this.element.classList.remove('message-show')
    }
}

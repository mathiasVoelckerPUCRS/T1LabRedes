const config = require("./config")
const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ttt = {
    d: [[0, 8], [2, 6]],
    h: [0, 3, 6],
    v: [0, 1, 2]
}

module.exports = {
    params2Args: data => {
        return data.toString()
            .trim()
            .split(config.separator)
            .map(e => e.replace("-", " "))
    },

    args2Params: array => {
        return array.map(s => s.trim().replace(" ", "-"))
            .join(config.separator)
    },

    //Applied shorter name for these variables (will look better in code)
    //'m' stands for -> Matrix (array of 9 elements)
    //'c' stands for -> Character (X or O)
    didIWin: (m, c) => {
        //Horizontal
        for (let k in ttt.h) {
            let h = ttt.h[k]

            if (m[h] === c && m[h + 1] === c && m[h + 2] === c)
                return true
        }

        //Vertical
        for (let k in ttt.v) {
            v = ttt.v[k]

            if (m[v] === c && m[v + 3] === c && m[v + 6] === c)
                return true
        }

        //Diagonal
        for (let k in ttt.d) {
            let d = ttt.d[k]

            if (m[4] === c && m[d[0]] === c && m[d[1]] === c)
                return true
        }

        return false
    },

    //Check if there is a draw result. All positions are occupied
    isDraw: (matrix) => {
        return matrix.filter(m => m.length).length == 9
    },

    response: {
        success: result => {
            return `success${config.separator}${(result || "")}`
        },

        error: result => {
            return `error${config.separator}${(result || "")}`
        },
    },

    console: {
        debug: what => {
            if (config.debug)
                console.log(what)
        },

        log: what => {
            console.log(what)
        },

        clear: () => {
            console.log('\033c')
        },

        question: text => {
            return new Promise(res => {
                rl.question(text + ": ", answer => {
                    res(answer)
                })
            })
        }
    }
}
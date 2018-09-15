const config = require("./config")
const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

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
        for (let h in [0, 3, 6])
            if (m[h] === c && m[h + 1] === c && m[h + 2] === c)
                return true

        //Vertical
        for (let v in [0, 1, 2])
            if (m[v] === c && m[v + 3] === c && m[v + 6] === c)
                return true

        //Diagonal
        for (let d in [[0, 8], [2, 6]])
            if (m[4] === c && m[d[0]] === c && m[d[1]] === c)
                return true

        return false
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
const { readFile, writeFile } = require('fs')

const readFileAsync = (path) => new Promise((resolve, reject) => 
    readFile(path, 'utf8', (err, data) => err ? reject(err) : resolve(data)))

const writeFileAsync = (path, data) => new Promise((resolve, reject) => 
    writeFile(path, data, (err) => err ? reject(err) : resolve()))

async function persistRecord(file, key, value) {
    let existingJson = {}
    try {
        const fileContents = await readFileAsync(file)
        existingJson = JSON.parse(fileContents)
    } catch(e) {}
    existingJson[key] = value
    await writeFileAsync(file, JSON.stringify(existingJson))
}

async function consolidateRecords() {
    // write helper to consolidate json output files
}

module.exports = persistRecord

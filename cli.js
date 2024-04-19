const os = require('os')
const freeMem = os.freemem()
const totalMem = os.totalmem()
const formatMemGB = mem => Number((mem / 1024 / 1024 / 1024).toFixed(2))
const freeMemGB = formatMemGB(freeMem)
const totalMemGB = formatMemGB(totalMem)
const approxInstanceMemUsageGB = 0.5

const persistRecord = require('./data')

const { spawn } = require('node:child_process')

const readLine = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
})

const getInputFromCLI = (prompt, logOutput=false) => new Promise((resolve) => {
    readLine.question(`\x1b[1m${prompt}\x1b[0m\n`, (cliInput) => {
        // readLine.close()
        if (logOutput) {
            console.log(`\x1b[32m${cliInput}\x1b[0m`)
        }
        resolve(cliInput)
    })
})

const consoleError = errMsg => console.log(`\x1b[31m${errMsg}\x1b[0m`)

const CLI_CONFIG = {}

const minYear = 2010
const maxYear = new Date().getFullYear() - 1
async function askForYear() {
    const yearInput = await getInputFromCLI(`Provide a year (${minYear}-${maxYear})`)
    const formattedYear = Number(yearInput.replace(/[^0-9]/g, ''))
    if (isNaN(formattedYear) || formattedYear < minYear || formattedYear > maxYear) {
        consoleError(`Please provide a valid year between ${minYear}-${maxYear}`)
        return false
    }
    CLI_CONFIG.year = formattedYear
    return true
}

async function askForMinBillNum() {
    const minBillNumInput = await getInputFromCLI('Provide a min bill number')
    const formattedBillNum = Number(minBillNumInput.replace(/[^0-9]/g, ''))
    if (isNaN(formattedBillNum) || formattedBillNum < 1) {
        consoleError(`Please provide a valid bill number`)
        return false
    }
    CLI_CONFIG.minBillNum = formattedBillNum
    return true
}

async function askForMaxBillNum() {
    const maxBillNumInput = await getInputFromCLI('Provide a max bill number')
    const formattedBillNum = Number(maxBillNumInput.replace(/[^0-9]/g, ''))
    if (isNaN(formattedBillNum) || formattedBillNum < 1) {
        consoleError(`Please provide a valid bill number`)
        return false
    }
    CLI_CONFIG.maxBillNum = formattedBillNum
    return true
}

async function askForTotalInstances() {
    const recommendedMaxInstances = Math.max(1, Math.floor(freeMemGB / approxInstanceMemUsageGB) - 1)
    const totalInstancesInput = await getInputFromCLI(
        `How many instances would you like to run?\n\x1b[90m` +
        `Free memory: ${freeMemGB}gb of ${totalMemGB}gb\n` +
        `Recommended max instances: ${recommendedMaxInstances}`
    )
    const formattedTotalInstances = Number(totalInstancesInput.replace(/[^0-9]/g, ''))
    const totalRecordsToScrape = CLI_CONFIG.maxBillNum - CLI_CONFIG.minBillNum + 1
    if (isNaN(formattedTotalInstances) || formattedTotalInstances < 1 || formattedTotalInstances > totalRecordsToScrape) {
        consoleError('Please enter a valid number of instances')
        return false
    }
    CLI_CONFIG.totalInstances = formattedTotalInstances
    return true
}

const spawnScraperWithListener = (envVars, onOutput, onError, onExit) => {
    const env = { ...process.env, ...envVars, }
    const child = spawn('node', ['scrape/runner.js'], { env })
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', data => onOutput(data))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', data => onError(data))
    child.on('close', exitCode => onExit(exitCode))
}

function createScraperInstance(year, minBillNum, maxBillNum) {
    spawnScraperWithListener({
        SCRAPE_YEAR: year,
        SCRAPE_MIN_BILL_NUM: minBillNum,
        SCRAPE_MAX_BILL_NUM: maxBillNum,
    }, (stdOut) => {
        try {
            const jsonRecord = JSON.parse(stdOut.toString())
            const filePath = `./output/${year}-${minBillNum}-${maxBillNum}.json`
            const recordKey = `${jsonRecord.billYear}.${jsonRecord.billNum}`
            console.log(`[${year}-${minBillNum}-${maxBillNum}] Persisting ${recordKey}`)
            persistRecord(filePath, recordKey, jsonRecord)
        } catch(e) {
            // not json, ignore
        }
    }, (stdErr) => {
        console.log(`[${year}-${minBillNum}-${maxBillNum}] Error:`, stdErr)
    }, (exitCode) => {
        console.log(`[${year}-${minBillNum}-${maxBillNum}] Exit code:`, exitCode)
    })
}

async function runInstances() {
    console.log('Spawning', CLI_CONFIG.totalInstances, 'instance(s)')
    const totalRecordsToScrape = CLI_CONFIG.maxBillNum - CLI_CONFIG.minBillNum + 1
    console.log('totalRecordsToScrape', totalRecordsToScrape)
    const recordsPerInstance = Math.floor(totalRecordsToScrape / CLI_CONFIG.totalInstances)
    console.log('recordsPerInstance', recordsPerInstance)
    const leftOverRecords = totalRecordsToScrape % CLI_CONFIG.totalInstances
    console.log('leftOverRecords', leftOverRecords)
    for (let i = 0; i < CLI_CONFIG.totalInstances; i++) {
        let recordOffset = 1 // because min/start
        let minBillNum = CLI_CONFIG.minBillNum + (i * recordsPerInstance)
        let maxBillNum = CLI_CONFIG.minBillNum + ((i + 1) * recordsPerInstance) - recordOffset
    
        if (i + 1 === CLI_CONFIG.totalInstances) {
          maxBillNum = CLI_CONFIG.maxBillNum
        }
    
        console.log(`[${CLI_CONFIG.year}-${minBillNum}-${maxBillNum}] Instance #${i + 1} scrapes ${minBillNum} - ${maxBillNum}`)
        createScraperInstance(CLI_CONFIG.year, minBillNum, maxBillNum)
    }
    return true
}

const orderOfOps = [askForYear, askForMinBillNum, askForMaxBillNum, askForTotalInstances, runInstances]
async function run() {
    for(let i = 0; i < orderOfOps.length;) {
        const operation = orderOfOps[i]
        const result = await operation()
        if (result) i++
    }
}

run()

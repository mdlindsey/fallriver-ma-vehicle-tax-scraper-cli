const parseHtml = require('./parser')
const InvoiceLoader = require('./loader')

async function generateInvoiceDetailsJson(billYear, billNum) {
    await InvoiceLoader.loadBrowser()
    const invoiceUrl = await InvoiceLoader.loadInvoiceDetailsUrl(billYear, billNum)
    if (!invoiceUrl) {
        console.error('Failed to load search results')
        return null
    }
    const invoiceHtml = await InvoiceLoader.loadInvoiceDetailsHtml(invoiceUrl)
    if (!invoiceHtml) {
        console.error('Failed to load invoice details')
        return null
    }
    await InvoiceLoader.unloadBrowser()
    return parseHtml(invoiceHtml)
}

async function run() {
    const { SCRAPE_YEAR, SCRAPE_MIN_BILL_NUM, SCRAPE_MAX_BILL_NUM } = process.env
    const [year, minBillNum, maxBillNum] = [SCRAPE_YEAR, SCRAPE_MIN_BILL_NUM, SCRAPE_MAX_BILL_NUM]
        .map(num => Number(num.replace(/[^0-9]/g, '')))
    for(let i = minBillNum; i <= maxBillNum; i++) {
        const parsedResult = await generateInvoiceDetailsJson(year, i)
        console.log(JSON.stringify(parsedResult))
    }
}

run()

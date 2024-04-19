const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

class InvoiceLoader {
    static async loadBrowser() {
        puppeteer.use(StealthPlugin()) // Bypass most bot detection
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
    }
    static async unloadBrowser() {
        return this.browser.close()
    }

    static async loadInvoiceDetailsUrl(billYear, billNum) {
        try {
            const searchPage = await this.browser.newPage()
            await searchPage.goto('https://www.invoicecloud.com/portal/(S(nl4zqdts1bxesbq0px0xw010))/2/customerlocator.aspx?iti=9&bg=049b1175-5b72-4595-8678-466f74c646c0&vsii=3&return=1')
            await searchPage.type('[name="ctl00$ctl00$cphBody$cphBodyLeft$ctrlVSInputs$rptInputs$ctl01$txtValue"]', String(billNum))
            await searchPage.type('[name="ctl00$ctl00$cphBody$cphBodyLeft$ctrlVSInputs$rptInputs$ctl02$txtValue"]', String(billYear))
            await searchPage.click('#ctl00_ctl00_cphBody_cphBodyLeft_btnSearch')
            await searchPage.waitForNavigation()
            const [invoiceLinkHref] = await searchPage.evaluate(() => Array.from(
                document.querySelectorAll('[href^="https://www.invoicecloud.com/templates/CityofFallRiver/MV2013.aspx"]'),
                a => a.getAttribute('href')
            ))
            await searchPage.close()
            return invoiceLinkHref
        } catch(e) {
            console.error(e)
            return null
        }
    }

    static async loadInvoiceDetailsHtml(invoiceDetailsUrl) {
        try {
            const invoiceDetailsPage = await this.browser.newPage()
            await invoiceDetailsPage.goto(invoiceDetailsUrl)
            const invoiceDetailsHtml = await invoiceDetailsPage.content()
            await invoiceDetailsPage.close()
            return invoiceDetailsHtml
        } catch(e) {
            console.error(e)
            return null
        }
    }
}

module.exports = InvoiceLoader
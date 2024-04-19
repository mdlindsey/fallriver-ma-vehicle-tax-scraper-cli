const { parse } = require('node-html-parser')

const parseHtml = (html) => {
    const root = parse(html)
    const title = root.querySelector('title').innerHTML
    const billId = title.replace('City of Fall River, Motor Vehicle for ', '').trim()
    const billYearRaw = root.querySelector('tbody > tr:nth-of-type(2) > td:nth-of-type(8)').innerHTML
    const infoRow = root.querySelector('tbody > tr:nth-of-type(9)')
    const [vehicleYear, vehicleMake] = infoRow.querySelector('> td:nth-of-type(2)').innerHTML.trim().split('&nbsp;')
    const plateRaw = infoRow.querySelector('> td:nth-of-type(4)').innerHTML.trim()
    const vehiclePlate = plateRaw.replace('PAN/', '')
    const ownerName = infoRow.querySelector('> td:nth-of-type(5)').innerHTML.trim()
    const billNumRaw = infoRow.querySelector('> td:nth-of-type(6)').innerHTML
    const taxValueRaw = root.querySelector('tbody > tr:nth-of-type(10) > td:nth-of-type(2)').innerHTML
    const taxValue = Number(taxValueRaw.trim())
    const vinRaw = root.querySelector('tbody > tr:nth-of-type(11) > td:nth-of-type(1)').innerHTML
    const vehicleVIN = vinRaw.replace('VIN&nbsp;&nbsp;&nbsp;', '')
    const taxExciseRaw = root.querySelector('tbody > tr:nth-of-type(13) > td:nth-of-type(10)').innerHTML
    const ownerAddressRaw = root.querySelector('tbody > tr:nth-of-type(14) > td:nth-of-type(2)').innerHTML
    const ownerAddress = ownerAddressRaw.trim().split('<br>').map(p => p.trim())
    const taxAbatementRaw = root.querySelector('tbody > tr:nth-of-type(14) > td:nth-of-type(7)').innerHTML
    const taxDemandRaw = root.querySelector('tbody > tr:nth-of-type(15) > td:nth-of-type(7)').innerHTML
    const taxFeesRaw = root.querySelector('tbody > tr:nth-of-type(16) > td:nth-of-type(7)').innerHTML
    const taxInterestRaw = root.querySelector('tbody > tr:nth-of-type(17) > td:nth-of-type(7)').innerHTML
    const taxTotalRaw = root.querySelector('tbody > tr:nth-of-type(18) > td:nth-of-type(9)').innerHTML

    const formatNumber = (numericalStr) => Number(numericalStr.replace(/[^0-9\.]/g, '').trim())

    return {
        billId,
        billNum: formatNumber(billNumRaw),
        billYear: formatNumber(billYearRaw),
        ownerName,
        ownerAddress,
        vehicleVIN,
        vehicleYear: formatNumber(vehicleYear),
        vehicleMake,
        vehiclePlate,
        taxValue,
        taxExcise: formatNumber(taxExciseRaw),
        taxAbatement: formatNumber(taxAbatementRaw),
        taxDemand: formatNumber(taxDemandRaw),
        taxFees: formatNumber(taxFeesRaw),
        taxInterest: formatNumber(taxInterestRaw),
        taxTotal: formatNumber(taxTotalRaw),
    }
}

module.exports = parseHtml
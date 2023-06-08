/**
 * Nécessite chrome://flags/#enable-experimental-web-platform-features
 *
 * Ne fonctionne que sur Chrome Android :
 * - Activer le mode développeur sur le téléphone
 * - Activer le débugage USB
 * - Brancher le téléphone au PC via un cable USB
 * - Lancer Chrome sur Android
 * - Depuis le PC, se rendre sur chrome://inspect/#devices
 * - Attendre la détection du téléphone puis cliquer sur inspect
 * - La console (devtools) correspondant au chrome du téléphone va s'ouvrir :)
 */

import { Subject, tap, mergeMap, of } from "rxjs"

const LibBleGap  = require("../lib/lib.ble.gap.min.js")
const LibGraph   = require("../lib/lib.graph.min.js")
const LibDate    = require("../lib/esp.lib.date.min.js")
const LibStorage = require("../lib/lib.storage.min.js")

console.log("Bonjour :-)")

var buttonScanning  = document.getElementById("listening")
let scanning = false

var buttonDownloadTemperature = document.getElementById("downloadTemperature")
const subjectTemperature = new Subject()
const graphTemperature   = new LibGraph("graphTemperature", "Température (°C)")
graphTemperature.display()
let dataTemperature = LibStorage.loadObject("temperature")

var buttonDownloadPressure = document.getElementById("downloadPressure")
const subjectPressure = new Subject()
const graphPressure   = new LibGraph("graphPressure", "Pression (bars)")
graphPressure.display()
let dataPressure = LibStorage.loadObject("pressure")

/**
 *
 */
const psi2bar = function(PsiValue){
  return PsiValue / 14.5038
}

/**
 *
 */
const exportData2Csv = function(Options){
  let href = `data:text/csv,${Options.header}%0A`
  for(const item of Options.list){
    href += `${Options.cb(item)}%0A`
  }
  Options.a.href = href
  Options.a.download = Options.filename
  Options.a.click()
}

/**
*
*/
buttonScanning.addEventListener("click", async Event => {
  console.log("Connexion...")

  if (scanning){
    LibBleGap.stopScanning()
    scanning = false
    buttonScanning.value = "Listening"
  }else{
    await LibBleGap.startScanning({
      name: "MX5"
    })
    scanning = true

    /**
     * Listin BLE advertising and convert to rxjs streams
     */
    LibBleGap.onAdvertisement(DataView => {
      subjectTemperature.next(
        DataView.getUint8(0) //rawTemperature
      )
      subjectPressure.next(
        DataView.getUint8(1) //rawPressure
      )
    })

    buttonScanning.value = "Stop listening"
  }
})


const saveTemperature = function(rawTemperature){
  const item = {
    ts   : Date.now(),
    value: rawTemperature,
  }
  dataTemperature.push(item)
  LibStorage.saveObject("temperature", dataTemperature)
  return of(item)
}

const displayTemperature = function(Item){
  graphTemperature.addData({
    label: LibDate.time(Item.ts),
    value: Item.value,
  })
  return of(Item)
}

const savePressure = function(rawPressure){
  const item = {
    ts   : Date.now(),
    value: rawPressure,
  }
  dataPressure.push(item)
  LibStorage.saveObject("pressure", dataPressure)
  return of(item)
}

const displayPressure = function(Item){
  graphPressure.addData({
    label: LibDate.time(Item.ts),
    value: psi2bar(Item.value),
  })
  return of(Item)
}

subjectTemperature
  .pipe(
    //tap((rawTemperature)      => console.log("rawTemperature", rawTemperature)),
    mergeMap((rawTemperature) => saveTemperature(rawTemperature)),
    mergeMap((item)           => displayTemperature(item)),
  )
  .subscribe()

subjectPressure
  .pipe(
    //tap((rawPressure)      => console.log("rawPressure", rawPressure)),
    mergeMap((rawPressure) => savePressure(rawPressure)),
    mergeMap((item)        => displayPressure(item)),
  )
  .subscribe()

buttonDownloadTemperature.addEventListener("click", async Event => {
  const list = LibStorage.loadObject("temperature")
  exportData2Csv({
    a: document.getElementById("csv"),                       //HTML element
    list,                                                    //Data list
    filename: `${LibDate.dateFilename(list[0].ts)}_${LibDate.timeFilename(list[0].ts)}_temperature.csv`,
    header: "ts%2Ctemperature",                              //CSV header line
    cb: (item) => `${item.ts}%2C${item.value}`,              //Convert item to CSV line
  })
  dataTemperature = []
  LibStorage.saveObject("temperature", dataTemperature)
})

buttonDownloadPressure.addEventListener("click", async Event => {
  const list = LibStorage.loadObject("pressure")
  exportData2Csv({
    a: document.getElementById("csv"),                    //HTML element
    list,                                                 //Data list
    filename: `${LibDate.dateFilename(list[0].ts)}_${LibDate.timeFilename(list[0].ts)}_pressure.csv`,
    header: "ts%2Cpressure",                              //CSV header line
    cb: (item) => `${item.ts}%2C${item.value}`,           //Convert item to CSV line
  })
  dataPressure = []
  LibStorage.saveObject("pressure", dataPressure)
})

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

const LibBleGap = require("../lib/lib.ble.gap.min.js")

import Flux from "../lib/lib.flux.min.mjs"

console.log("Bonjour :-)")

const buttonScanning = document.getElementById("listening")
const linkCsv        = document.getElementById("csv")

const temperature = {
  canvas             : document.querySelector('div.temperature canvas[name="graph"]'),
  buttonDownload     : document.querySelector('div.temperature input[name="download"]'),
  buttonClearStorage : document.querySelector('div.temperature input[name="clearStorage"]'),
  confirm            : false
}

const pressure = {
  canvas             : document.querySelector('div.pressure canvas[name="graph"]'),
  buttonDownload     : document.querySelector('div.pressure input[name="download"]'),
  buttonClearStorage : document.querySelector('div.pressure input[name="clearStorage"]'),
  confirm            : false
}

let scanning = false

const fluxTemperature = new Flux({
  id: "temperature",
  htmlCanvasElement: temperature.canvas,
  title: "Temperature (°C)",
})

const fluxPressure = new Flux({
  id: "pressure",
  htmlCanvasElement: pressure.canvas,
  title: "Pressure (bars)",
  graphValueformatter: (v) => v / 14.5038, //psi -> bars
})

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
      fluxTemperature.pushValue(DataView.getUint8(0)) //rawTemperature
      fluxPressure.pushValue(DataView.getUint8(1)) //rawPressure
    })

    buttonScanning.value = "Stop listening"
  }
})

temperature.buttonDownload.addEventListener("click", async Event => {
  fluxTemperature.downloadCsv(linkCsv)
  fluxTemperature.clearGraph()
})

pressure.buttonDownload.addEventListener("click", async Event => {
  fluxPressure.downloadCsv(linkCsv)
  fluxPressure.clearGraph()
})

temperature.buttonClearStorage.addEventListener("click", async Event => {
  if (temperature.confirm){
    fluxTemperature.clearStorage()
    fluxTemperature.clearGraph()
    temperature.buttonClearStorage.value = "Clear storage"
    temperature.confirm = false
  }else{
    temperature.buttonClearStorage.value = "Sure ?"
    temperature.confirm = true
  }
})

pressure.buttonClearStorage.addEventListener("click", async Event => {
  if (pressure.confirm){
    fluxPressure.clearStorage()
    fluxPressure.clearGraph()
    pressure.buttonClearStorage.value = "Clear storage"
    pressure.confirm = false
  }else{
    pressure.buttonClearStorage.value = "Sure ?"
    pressure.confirm = true
  }
})

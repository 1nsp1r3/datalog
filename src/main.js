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
const LibFlux   = require("../lib/lib.flux.min.js")

console.log("Bonjour :-)")

const buttonScanning = document.getElementById("listening")
const linkCsv        = document.getElementById("csv")

const temperature = {
  buttonDownload     : document.querySelector('div.temperature input[name="download"]'),
  buttonClearGraph   : document.querySelector('div.temperature input[name="clearGraph"]'),
  buttonRefreshGraph : document.querySelector('div.temperature input[name="refreshGraph"]'),
  buttonClearStorage : document.querySelector('div.temperature input[name="clearStorage"]'),
  checkboxLive       : document.querySelector('div.temperature input[name="live"]'),
}

const pressure = {
  buttonDownload     : document.querySelector('div.pressure input[name="download"]'),
  buttonClearGraph   : document.querySelector('div.pressure input[name="clearGraph"]'),
  buttonRefreshGraph : document.querySelector('div.pressure input[name="refreshGraph"]'),
  buttonClearStorage : document.querySelector('div.pressure input[name="clearStorage"]'),
  checkboxLive       : document.querySelector('div.pressure input[name="live"]'),
}

let scanning = false

const fluxTemperature = new LibFlux({
  id: "temperature",
  title: "Température (°C)",
})

const fluxPressure = new LibFlux({
  id: "pressure",
  title: "Pressure (bars)",
  graphValueformatter: (v) => v / 14.5038, //psi -> bars
})

fluxTemperature.refreshGraph()
fluxPressure.refreshGraph()

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
      if (temperature.checkboxLive.checked){
        fluxTemperature.pushValue(DataView.getUint8(0)) //rawTemperature
      }
      if (pressure.checkboxLive.checked){
        fluxPressure.pushValue(DataView.getUint8(1)) //rawPressure
      }
    })

    buttonScanning.value = "Stop listening"
  }
})

temperature.buttonDownload.addEventListener("click", async Event => fluxTemperature.downloadCsv(linkCsv))
temperature.buttonClearGraph.addEventListener("click", async Event => fluxTemperature.clearGraph())
temperature.buttonRefreshGraph.addEventListener("click", async Event => fluxTemperature.refreshGraph())
temperature.buttonClearStorage.addEventListener("click", async Event => {
  fluxTemperature.clearStorage()
  fluxTemperature.clearGraph()
})

pressure.buttonDownload.addEventListener("click", async Event => fluxPressure.downloadCsv(linkCsv))
pressure.buttonClearGraph.addEventListener("click", async Event => fluxPressure.clearGraph())
pressure.buttonRefreshGraph.addEventListener("click", async Event => fluxPressure.refreshGraph())
pressure.buttonClearStorage.addEventListener("click", async Event => {
  fluxPressure.clearStorage()
  fluxPressure.clearGraph()
})

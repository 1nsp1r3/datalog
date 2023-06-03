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
const LibGraph  = require("../lib/lib.graph.min.js")
const LibDate   = require("../lib/esp.lib.date.min.js")

console.log("Bonjour :-)")

var buttonScanning  = document.getElementById("listening")
let scanning = false

const graphTemperature = new LibGraph("graphTemperature", "Température (°C)")
const graphPressure    = new LibGraph("graphPressure", "Pression (bars)")

graphTemperature.display()
graphPressure.display()

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
    LibBleGap.onAdvertisement(byte => {
      console.log("octet !", byte)
      graphTemperature.addData({
        label: LibDate.time(),
        value: byte,
      })
    })
    buttonScanning.value = "Stop listening"
  }
})

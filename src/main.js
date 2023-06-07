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

import { Subject, tap, map } from "../lib/rxjs-7.8.1.min.js"

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

let subjectTemperature = new Subject()
let subjectPressure    = new Subject()

/**
 *
 */
const psi2bar = function(PsiValue){
  return PsiValue / 14.5038
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

subjectTemperature
  .pipe(
    tap((rawTemperature) => console.log("rawTemperature", rawTemperature))
  )
  .subscribe((rawTemperature) => {
    graphTemperature.addData({
      label: LibDate.time(),
      value: rawTemperature,
    })
  })

subjectPressure
  .pipe(
    map((rawPressure) => psi2bar(rawPressure)),
    tap((rawPressure) => console.log("rawPressure", rawPressure))
  )
  .subscribe((rawPressure) => {
    graphPressure.addData({
      label: LibDate.time(),
      value: rawPressure,
    })
  })

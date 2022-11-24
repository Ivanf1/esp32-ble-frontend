const modelNumber = document.getElementById("model-number");
const firmwareRevision = document.getElementById("firmware-revision");
const hardwareRevision = document.getElementById("hardware-revision");
const softwareRevision = document.getElementById("software-revision");
const manufacturerName = document.getElementById("manufacturer-name");

const reading = document.getElementById("reading");
const readingBar = document.getElementById("reading-bar");

let currentDevice = null;

const handleConnection = async () => {
  if (currentDevice) {
    currentDevice.gatt.disconnect();
    currentDevice = null;
    connectButton.innerHTML = "Connect";
    connectButton.className = "btn-blue";
    return;
  }

  try {
    console.log("Requesting any Bluetooth Device...");
    const device = await navigator.bluetooth.requestDevice({
      // acceptAllDevices: true,
      optionalServices: ["device_information", 0x00ff],
      filters: [{ name: "ESP_GATTS_DEMO" }],
    });

    currentDevice = device;

    // Set up event listener for when device gets disconnected.
    device.addEventListener("gattserverdisconnected", onDisconnected);

    connectButton.innerHTML = "Disconnect";
    connectButton.className = "btn-red";

    console.log("Connecting to GATT Server...");
    const server = await device.gatt.connect();

    console.log("Getting Device Information Service...");
    const service = await server.getPrimaryService("device_information");

    const service2 = await server.getPrimaryService(0x00ff);
    console.log(service2);

    console.log("Getting Device Information Characteristics...");
    const characteristics = await service.getCharacteristics();

    const characteristic2 = await service2.getCharacteristic(0xff01);
    console.log(characteristic2);

    await characteristic2.startNotifications();

    console.log("> Notifications started");
    characteristic2.addEventListener("characteristicvaluechanged", handleNotifications);

    const decoder = new TextDecoder("utf-8");
    for (const characteristic of characteristics) {
      switch (characteristic.uuid) {
        case BluetoothUUID.getCharacteristic("manufacturer_name_string"):
          await characteristic.readValue().then((value) => {
            console.log("> Manufacturer Name String: " + decoder.decode(value));
            manufacturerName.innerHTML = decoder.decode(value);
          });
          break;

        case BluetoothUUID.getCharacteristic("model_number_string"):
          await characteristic.readValue().then((value) => {
            console.log("> Model Number String: " + decoder.decode(value));
            modelNumber.innerHTML = decoder.decode(value);
          });
          break;

        case BluetoothUUID.getCharacteristic("hardware_revision_string"):
          await characteristic.readValue().then((value) => {
            console.log("> Hardware Revision String: " + decoder.decode(value));
            hardwareRevision.innerHTML = decoder.decode(value);
          });
          break;

        case BluetoothUUID.getCharacteristic("firmware_revision_string"):
          await characteristic.readValue().then((value) => {
            console.log("> Firmware Revision String: " + decoder.decode(value));
            firmwareRevision.innerHTML = decoder.decode(value);
          });
          break;

        case BluetoothUUID.getCharacteristic("software_revision_string"):
          await characteristic.readValue().then((value) => {
            console.log("> Software Revision String: " + decoder.decode(value));
            softwareRevision.innerHTML = decoder.decode(value);
          });
          break;

        case BluetoothUUID.getCharacteristic("system_id"):
          await characteristic.readValue().then((value) => {
            console.log("> System ID: ");
            console.log(
              "  > Manufacturer Identifier: " +
                padHex(value.getUint8(4)) +
                padHex(value.getUint8(3)) +
                padHex(value.getUint8(2)) +
                padHex(value.getUint8(1)) +
                padHex(value.getUint8(0))
            );
            console.log(
              "  > Organizationally Unique Identifier: " +
                padHex(value.getUint8(7)) +
                padHex(value.getUint8(6)) +
                padHex(value.getUint8(5))
            );
          });
          break;

        case BluetoothUUID.getCharacteristic("ieee_11073-20601_regulatory_certification_data_list"):
          await characteristic.readValue().then((value) => {
            console.log(
              "> IEEE 11073-20601 Regulatory Certification Data List: " + decoder.decode(value)
            );
          });
          break;

        case BluetoothUUID.getCharacteristic("pnp_id"):
          await characteristic.readValue().then((value) => {
            console.log("> PnP ID:");
            console.log("  > Vendor ID Source: " + (value.getUint8(0) === 1 ? "Bluetooth" : "USB"));
            if (value.getUint8(0) === 1) {
              console.log("  > Vendor ID: " + (value.getUint8(1) | (value.getUint8(2) << 8)));
            } else {
              console.log(("  > Vendor ID: " + value.getUint8(1)) | (value.getUint8(2) << 8));
            }
            console.log("  > Product ID: " + (value.getUint8(3) | (value.getUint8(4) << 8)));
            console.log("  > Product Version: " + (value.getUint8(5) | (value.getUint8(6) << 8)));
          });
          break;

        default:
          console.log("> Unknown Characteristic: " + characteristic.uuid);
      }
    }
  } catch (error) {
    console.log("Argh! " + error);
  }
};

const connectButton = document.getElementById("btn");
connectButton.addEventListener("click", handleConnection);
connectButton.className = "btn-blue";

const handleNotifications = (event) => {
  let value = event.target.value;
  let intValue = swap32(value.getUint32());
  let scaledValue = scale(intValue, 0, 4095, 0, 512);
  reading.innerHTML = intValue;
  readingBar.style.width = `${scaledValue}px`;

  readingBar.removeAttribute("class");
  if (scaledValue >= 0 && scaledValue <= 380) {
    readingBar.className = "reading-bar-green";
  } else if (scaledValue > 380 && scaledValue < 460) {
    readingBar.className = "reading-bar-yellow";
  } else {
    readingBar.className = "reading-bar-red";
  }
};

const onDisconnected = (event) => {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
  currentDevice = null;
  connectButton.innerHTML = "Connect";
};

// https://stackoverflow.com/a/5320624
const swap32 = (val) => {
  return (
    ((val & 0xff) << 24) | ((val & 0xff00) << 8) | ((val >> 8) & 0xff00) | ((val >> 24) & 0xff)
  );
};

const scale = (number, inMin, inMax, outMin, outMax) => {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const padHex = (value) => {
  return ("00" + value.toString(16).toUpperCase()).slice(-2);
};

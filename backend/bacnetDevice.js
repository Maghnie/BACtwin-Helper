// backend/bacnetDevice.js
import Bacnet from "node-bacnet";
import bacnet from "bacstack";

//const bacnet  = require('bacstack');
//const debug   = require('debug')('bacstack-device');

const settings = {
  deviceId: 443,
  vendorId: 7
};

const client = new Bacnet({
  port: 47809, // Standard BACnet/IP-Port
  interface: "0.0.0.0",
});

const dataStore = {
  '1:0': {
    75: [{value: {type: 1, instance: 0}, type: 12}],    // PROP_OBJECT_IDENTIFIER
    77: [{value: 'Analog Output 1', type: 7}],          // PROP_OBJECT_NAME
    79: [{value: 1, type: 9}],                          // PROP_OBJECT_TYPE
    85: [{value: 5, type: 4}]                           // PROP_PRESENT_VALUE
  },
  '8:443': {
    75: [{value: {type: 8, instance: 443}, type: 12}],  // PROP_OBJECT_IDENTIFIER
    76: [
      {value: {type: 8, instance: 443}, type: 12},
      {value: {type: 1, instance: 0}, type: 12}
    ],                                                  // PROP_OBJECT_IDENTIFIER
    77: [{value: 'my-device-443', type: 7}],            // PROP_OBJECT_NAME
    79: [{value: 8, type: 9}],                          // PROP_OBJECT_TYPE
    28: [{value: 'Test Device #443', type: 7}]          // PROP_DESCRIPTION
  }
};

client.on('whoIs', (data) => {
  console.log(data);
  if (data.lowLimit && data.lowLimit > settings.deviceId) return;
  if (data.highLimit && data.highLimit < settings.deviceId) return;
  client.iAmResponse(settings.deviceId, bacnet.enum.Segmentations.SEGMENTATION_BOTH, settings.vendorId);
  //client.iAmResponse(settings.deviceId, bacnet.enum.Segmentations.0, settings.vendorId);
});

client.on('readProperty', (data) => {
  const object = dataStore[data.request.objectId.type + ':' + data.request.objectId.instance];
  console.log('object', object);
  if (!object) return client.errorResponse(data.address, bacnet.enum.ConfirmedServices.SERVICE_CONFIRMED_READ_PROPERTY, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_OBJECT, bacnet.enum.ErrorCodes.ERROR_CODE_UNKNOWN_OBJECT);
  const property = object[data.request.property.id];
  console.log('object', property);
  if (!property) return client.errorResponse(data.address, bacnet.enum.ConfirmedServices.SERVICE_CONFIRMED_READ_PROPERTY, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_PROPERTY, bacnet.enum.ErrorCodes.ERROR_CODE_UNKNOWN_PROPERTY);
  if (data.request.property.index === 0xFFFFFFFF) {
    client.readPropertyResponse(data.address, data.invokeId, data.request.objectId, data.request.property, property);
  } else {
    const slot = property[data.request.property.index];
    if (!slot) return client.errorResponse(data.address, bacnet.enum.ConfirmedServices.SERVICE_CONFIRMED_READ_PROPERTY, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_PROPERTY, bacnet.enum.ErrorCodes.ERROR_CODE_INVALID_ARRAY_INDEX);
    client.readPropertyResponse(data.address, data.invokeId, data.request.objectId, data.request.property, [slot]);
  }
});

client.on('writeProperty', (data) => {
  const object = dataStore[data.request.objectId.type + ':' + data.request.objectId.instance];
  if (!object) return client.errorResponse(data.address, data.service, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_OBJECT, bacnet.enum.ErrorCodes.ERROR_CODE_UNKNOWN_OBJECT);
  const property = object[data.request.property.id];
  if (!property) return client.errorResponse(data.address, data.service, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_PROPERTY, bacnet.enum.ErrorCodes.ERROR_CODE_UNKNOWN_PROPERTY);
  if (data.request.property.index === 0xFFFFFFFF) {
    property = data.request.value.value;
    client.simpleAckResponse(data.address, data.service, data.invokeId);
  } else {
    const slot = property[data.request.property.index];
    if (!slot) return client.errorResponse(data.address, data.service, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_PROPERTY, bacnet.enum.ErrorCodes.ERROR_CODE_INVALID_ARRAY_INDEX);
    slot = data.request.value.value[0];
    client.simpleAckResponse(data.address, data.service, data.invokeId);
  }
});


client.on('whoHas', (data) => {
  console.log(data);
  if (data.lowLimit && data.lowLimit > settings.deviceId) return;
  if (data.highLimit && data.highLimit < settings.deviceId) return;
  if (data.objId) {
    var object = dataStore[data.objId.type + ':' + data.objId.instance];
    if (!object) return;
    client.iHaveResponse(settings.deviceId, {type: data.objId.type, instance: data.objId.instance}, object[77][0].value);
  }
  if (data.objName) {
    // TODO: Find stuff...
    client.iHaveResponse(settings.deviceId, {type: 1, instance: 1}, 'test');
  }
});

client.on('timeSync', (data) => {
  // TODO: Implement
});

client.on('timeSyncUTC', (data) => {
  // TODO: Implement
});

client.on('readPropertyMultiple', (data) => {
  console.log(data.request.properties);
  const responseList = [];
  const properties = data.request.properties;
  properties.forEach((property) => {
    if (property.objectId.type === bacnet.enum.ObjectTypes.OBJECT_DEVICE && property.objectId.instance === 4194303) {
      property.objectId.instance = settings.deviceId;
    }
    const object = dataStore[property.objectId.type + ':' + property.objectId.instance];
    if (!object) return; // TODO: Add error
    const propList = [];
    property.properties.forEach((item) => {
      if (item.id === bacnet.enum.PropertyIds.PROP_ALL) {
        for (let key in object) {
          propList.push({property: {id: key, index: 0xFFFFFFFF}, value: object[key]});
        }
        return;
      }
      const prop = object[item.id];
      let content;
      if (!prop) return; // TODO: Add error
      if (item.index === 0xFFFFFFFF) {
        content = prop;
      } else {
        const slot = prop[item.index];
        if (!prop) return; // TODO: Add error
        content = [slot];
      }
      propList.push({property: {id: item.id, index: item.index}, value: content});
    });
    responseList.push({objectId: {type: property.objectId.type, instance: property.objectId.instance}, values: propList});
  });
  client.readPropertyMultipleResponse('192.168.0.255', data.invokeId, responseList);
});

client.on('writePropertyMultiple', (data) => {
  // TODO: Implement
  // TODO: valuesRefs
  //if () client.simpleAckResponse(data.address, data.service, data.invokeId);
  //else client.errorResponse(data.address, data.service, data.invokeId, bacnet.enum.ErrorClasses.ERROR_CLASS_OBJECT, bacnet.enum.ErrorCodes.ERROR_CODE_UNKNOWN_OBJECT);
});

client.on('atomicWriteFile', (data) => {
});

client.on('atomicReadFile', (data) => {
});

client.on('subscribeCOV', (data) => {
});

client.on('subscribeProperty', (data) => {
});

client.on('deviceCommunicationControl', (data) => {
});

client.on('reinitializeDevice', (data) => {
});

client.on('readRange', (data) => {
});

client.on('createObject', (data) => {
});

client.on('deleteObject', (data) => {
});

console.log('Node BACstack Device started');

const DEVICE_ID = 26042;
const VENDOR_ID = 260;

// Unser BACnet-Device fungiert gleichzeitig als Client
const device = new Bacnet({
  port: 47808, // Standard BACnet/IP-Port
  interface: "0.0.0.0",
});

// Simulierte Objekte (z. B. Sensoren)
const objects = [
  { type: 8, instance: DEVICE_ID, name: "Device" }, // Device DEVICE_ID
  { type: 0, instance: 1, name: "Raumtemperatur", value: 22.1 }, // Analog Input 1
  { type: 1, instance: 1, name: "Lichtschalter", value: 1 },     // Binary Input 1
];

/**
 * Starte das Gerät und sende initial eine I-Am-Nachricht
 */
export function startBacnetDevice() {
  console.log(`🏠 Starte BACnet-Device ${DEVICE_ID} ...`);
  sendIAmBroadcast();

  // Auf eingehende Who-Is reagieren
  device.on("whoIs", (data) => {
    console.log(`📡 Who-Is empfangen von ${data.address}, sende I-Am ...`);
    sendIAmResponse(data.address);
  });

  // Auf eingehende ReadProperty reagieren
device.on("readProperty", (data) => {
  try {
    if (!data?.request?.objectId) {
      console.warn("⚠️ Ungültige ReadProperty-Anfrage:", data);
      return;
    }

    const { address, request } = data;
    console.log(`🔍 ReadProperty empfangen von ${address} →`, request.objectId);

    // Gesuchtes Objekt finden
    const obj = objects.find(
      (o) =>
        o.type === request.objectId.type &&
        o.instance === request.objectId.instance
    );

    if (!obj) {
      console.warn("⚠️ Unbekanntes Objekt:", request.objectId);
      return;
    }

    // Unterstützte Properties
    const supportedProperties = [85, 28]; // 85=Present_Value, 28=Object_Name
    if (!supportedProperties.includes(request.property.id)) {
      console.warn(`⚠️ Property ${request.property.id} wird nicht unterstützt.`);
      return;
    }

    // Wert abhängig vom Property-ID bestimmen
    let value = null;
    switch (request.property.id) {
      case 85: // Present_Value
        value = obj.value;
        break;
      case 28: // Object_Name
        value = obj.name;
        break;
      default:
        value = null;
    }

    device.readPropertyResponse(address, request.invokeId, request.objectId, [
      {
        objectId: request.objectId,
        property: { id: request.property.id },
        value: [{ type: 4, value }],
      },
    ]);

    console.log(`➡️  ReadProperty beantwortet: ${obj.name} = ${value}`);
  } catch (err) {
    console.error("❌ Fehler beim Verarbeiten der ReadProperty-Anfrage:", err);
  }
});



  // Optional: periodisches I-Am senden
  setInterval(sendIAmBroadcast, 60000);
}

/**
 * Sendet eine Broadcast-I-Am-Nachricht
 */
function sendIAmBroadcast() {
  console.log("📢 Sende I-Am (Broadcast)...");
  device.iAmResponse({
    address: "192.168.0.255",
    deviceId: 2552,//DEVICE_ID,
    maxApdu: 1476,
    segmentation: 3,
    vendorId: VENDOR_ID,
  });
  console.log(`DEVICE_ID`,DEVICE_ID)
}

/**
 * Sendet I-Am direkt an eine Adresse (z. B. auf Who-Is)
 */
function sendIAmResponse(address) {
  device.iAmResponse({
    address,
    deviceId: DEVICE_ID,
    maxApdu: 1476,
    segmentation: 3,
    vendorId: VENDOR_ID,
  });
}

/**
 * Führe Who-Is als Client aus
 */
export async function whoIsDevices(timeout = 3000) {
  const discovered = [];
  return new Promise((resolve) => {
    device.on("iAm", (d) => {
      const info = {
        address: d.address,
        deviceId: d.deviceId,
        vendorId: d.vendorId,
      };
      if (!discovered.some((x) => x.deviceId === info.deviceId)) {
        discovered.push(info);
      }
    });

    device.whoIs();
    setTimeout(() => resolve(discovered), timeout);
  });
}

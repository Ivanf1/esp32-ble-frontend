// Create a client instance
client = new Paho.MQTT.Client("127.0.0.1", 9001, "jsClient");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({
  onSuccess: onConnect,
  userName: "ble_project",
  password: "bleble_projectproject",
});

// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  client.subscribe("World");
  message = new Paho.MQTT.Message("Hello");
  message.destinationName = "World";
  client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived:" + message.payloadString);
}

const sendMQTTMessage = (messageString) => {
  message = new Paho.MQTT.Message(messageString);
  message.destinationName = "ESP32/Analog/Reading";
  client.send(message);
};

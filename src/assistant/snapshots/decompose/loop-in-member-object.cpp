for (JsonPair property : doc["properties"].as<JsonObject>()) {
  const char* property_key = property.key().c_str(); // "batt", "tempc", "hum"

  const char* property_value_unit = property.value()["unit"]; // "%", "°C", "%"
  const char* property_value_name = property.value()["name"]; // "battery", "temperature", "humidity"

}

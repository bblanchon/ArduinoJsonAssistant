for (JsonObject item : doc.as<JsonArray>()) {

  long dt = item["dt"]; // 1511978400, 1511989200

  float main_temp = item["main"]["temp"]; // 3.95, 3.2

  const char* weather_0_description = item["weather"][0]["description"]; // "light rain", "clear sky"

}

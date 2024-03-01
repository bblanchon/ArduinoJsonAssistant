for (JsonObject list_item : doc["list"].as<JsonArray>()) {

  long list_item_dt = list_item["dt"]; // 1511978400, 1511989200, 1512000000

  float list_item_main_temp = list_item["main"]["temp"]; // 3.95, 3.2, 3.25

  const char* list_item_weather_0_description = list_item["weather"][0]["description"]; // "light rain", ...

}

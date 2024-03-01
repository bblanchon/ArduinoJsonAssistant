for (JsonObject item : doc.as<JsonArray>()) {

  for (JsonObject data_item : item["data"].as<JsonArray>()) {

    int data_item_time = data_item["time"]; // 1, 2

  }

}

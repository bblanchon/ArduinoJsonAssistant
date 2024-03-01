JsonDocument doc;

doc["answer"] = 42;

doc.shrinkToFit();  // optional

serializeJson(doc, output);
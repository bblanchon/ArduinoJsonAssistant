JsonDocument filter;
filter["a"] = true;

JsonDocument doc;

DeserializationError error = deserializeJson(doc, input, DeserializationOption::Filter(filter));

if (error) {
  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;
  return;
}

JsonDocument doc;

DeserializationError error = deserializeJson(doc, input, DeserializationOption::NestingLimit(11));

if (error) {
  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;
  return;
}

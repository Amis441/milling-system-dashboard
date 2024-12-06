#include <ArduinoJson.h> // Include ArduinoJson library

const int hallPin = A0; // Hall sensor connected to analog pin A0
unsigned long lastTime = 0;
unsigned long interval = 5; // Sampling time = 5 ms (200 Hz)

void setup()
{
    Serial.begin(9600); // Initialize serial communication
}

void loop()
{
    unsigned long currentTime = millis(); // Get the current time

    if (currentTime - lastTime >= interval)
    {                                               // Check if 5 ms have passed
        int hallValue = analogRead(hallPin);        // Read the Hall sensor value
        float voltage = hallValue * (5.0 / 1023.0); // Convert the analog value to voltage
        float current = (voltage - 2.5) / 0.032;    // Convert voltage to current (32 mV/A sensitivity)

        // Create a JSON object
        StaticJsonDocument<128> jsonDoc;
        jsonDoc["time"] = currentTime / 1000.0; // Time in seconds (to 3 decimal places)
        jsonDoc["current"] = current;           // Current value

        // Serialize the JSON object to a string
        char jsonBuffer[128];
        serializeJson(jsonDoc, jsonBuffer);

        // Send the JSON string over serial
        Serial.println(jsonBuffer);

        lastTime = currentTime; // Update the last time a reading was taken
    }
}

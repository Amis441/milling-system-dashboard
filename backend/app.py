import serial
import json
import time
from flask import Flask, jsonify

app = Flask(__name__)

# Set up the serial connection (adjust 'COM6' to your Arduino's port)
ser = serial.Serial('COM6', 9600)  # Replace 'COM6' with your Arduino port
time.sleep(2)  # Wait for the serial connection to initialize

# Initialize variables to store time and current
latest_data = {
    'time': None,
    'current': None
}

# Function to read data from the Arduino and store the latest values
def read_data():
    global latest_data
    if ser.in_waiting > 0:  # Check if there is data in the buffer
        line_data = ser.readline().decode('utf-8').strip()  # Read a line from the serial
        try:
            data = json.loads(line_data)  # Parse the JSON data
            latest_data['time'] = data['time']  # Store time
            latest_data['current'] = data['current']  # Store current
        except json.JSONDecodeError:
            print("Failed to decode JSON:", line_data)

# Route to fetch the latest data
@app.route('/hall-sensor', methods=['GET'])
def hall_sensor():
    read_data()  # Update the latest data from the Arduino
    if latest_data['time'] is not None and latest_data['current'] is not None:
        return jsonify(latest_data), 200  # Return the latest data as JSON
    else:
        return jsonify({"error": "No data available"}), 503  # If no data received yet

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=False)
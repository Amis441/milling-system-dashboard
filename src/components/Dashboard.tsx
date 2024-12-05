import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../styles/Dashboard.css";

const VOLTAGE = 220; // Constant voltage in Volts
const K1 = 150; // Constant for spindle speed calculation
const MAX_POINTS = 20; // Maximum number of points on the graph

const Dashboard: React.FC = () => {
  const [currentData, setCurrentData] = useState(
    Array.from({ length: MAX_POINTS }, (_, i) => ({ time: i, value: 0 }))
  );
  const [forceData, setForceData] = useState(
    Array.from({ length: MAX_POINTS }, (_, i) => ({
      time: i,
      x: 0,
      y: 0,
      total: 0,
    }))
  );
  const [current, setCurrent] = useState<number>(0);
  const [powerConsumption, setPowerConsumption] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [torque, setTorque] = useState<number>(0);
  const [forceX, setForceX] = useState<number>(0);
  const [forceY, setForceY] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Fetch current data from Flask API
        const response = await axios.get("http://127.0.0.1:5000/hall-sensor");
        const data = response.data;

        if (data.current) {
          const currentBackend = data.current; // Extract the current value from API
          const time = data.time; // Extract the time value from API

          // Calculate mean current
          const current = currentBackend;
          setCurrent(current);

          // Calculate metrics
          setPowerConsumption(VOLTAGE * current);
          setSpeed(K1 * current);
          setTorque(25 * current);

          // Update current data array (keep only 20 points)
          setCurrentData((prevData) => [
            ...prevData.slice(1),
            { time, value: current },
          ]);

          // Generate forces based on current
          const newForceX = 80 + (current / 20) * 40;
          const newForceY = 200 + (current / 20) * 40;
          const newTotalForce = 25 * current;

          setForceX(newForceX);
          setForceY(newForceY);

          // Update force data array (keep only 20 points)
          setForceData((prevData) => [
            ...prevData.slice(1),
            { time, x: newForceX, y: newForceY, total: newTotalForce },
          ]);
        } else {
          setError("No current data received");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching current data from API");
      }
    }, 1000); // Fetch data every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <div className="left-section">
        <div className="progress-grid">
          <div className="metric-card">
            <h2>Mean Current</h2>
            <CircularProgressbar
              value={current / Math.sqrt(2)}
              maxValue={50}
              text={`${(current / Math.sqrt(2)).toFixed(2)} A`}
            />
          </div>
          <div className="metric-card">
            <h2>Power Consumption</h2>
            <CircularProgressbar
              value={powerConsumption}
              maxValue={10000}
              text={`${powerConsumption.toFixed(2)} W`}
            />
          </div>
          <div className="metric-card">
            <h2>Spindle Speed</h2>
            <CircularProgressbar
              value={speed}
              maxValue={5000}
              text={`${speed.toFixed(0)} RPM`}
            />
          </div>
          <div className="metric-card">
            <h2>Torque</h2>
            <CircularProgressbar
              value={torque}
              maxValue={1000}
              text={`${torque.toFixed(2)} Nm`}
            />
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="right-section">
          <div className="metrics-grid">
            <div className="metric-card">
              <h2>Force Components</h2>
              <div className="forces-grid">
                <div>
                  <p>X: {forceX.toFixed(2)} N</p>
                  <progress value={forceX} max={150} />
                </div>
                <div>
                  <p>Y: {forceY.toFixed(2)} N</p>
                  <progress value={forceY} max={150} />
                </div>
              </div>
            </div>
            <div className="metric-card">
              <h2>Current Parameters</h2>
              <p>Imax: {current} A</p>
            </div>
          </div>
        </div>
        <div className="full-width">
          <h2>Real-time Current Plot</h2>
          {error ? <p className="error">{error}</p> : null}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{
                  value: "Time (s)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: "Current (A)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="natural"
                dataKey="value"
                stroke="#8884d8"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="full-width">
          <h2>Real-time Force Plot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{
                  value: "Time (s)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: "Force (N)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              {/* <Line
                type="monotone"
                dataKey="x"
                stroke="#8884d8"
                name="Force X"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#82ca9d"
                name="Force Y"
                isAnimationActive={false}
              /> */}
              <Line
                type="natural"
                dataKey="total"
                stroke="#ff7300"
                name="Total Force"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

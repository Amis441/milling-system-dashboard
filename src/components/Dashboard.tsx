import { useState, useEffect } from "react";
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
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import * as math from "mathjs";
import FFT from "fft.js";
import "../styles/Dashboard.css";

const VOLTAGE = 220; // Constant voltage in Volts
const K1 = 150; // Constant for spindle speed calculation

const Dashboard: React.FC = () => {
  // const [currentData, setCurrentData] = useState<
  //   { time: number; value: number }[]
  // >([]);
  const [forceData, setForceData] = useState<
    { time: number; x: number; y: number; z: number; total: number }[]
  >([]);
  const [fftData, setFFTData] = useState<any[]>([]);
  const [iMax, setIMax] = useState<number>(20); // Maximum current in Amperes
  const [frequency, setFrequency] = useState<number>(50); // Frequency in Hz
  const [meanCurrent, setMeanCurrent] = useState<number>(0);
  const [powerConsumption, setPowerConsumption] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [forceX, setForceX] = useState<number>(0);
  const [forceY, setForceY] = useState<number>(0);
  // const [totalForce, setTotalForce] = useState<number | math.Complex>(0);
  const [torque, setTotalForce] = useState<number | math.Complex>(0);

  useEffect(() => {
    let time = parseFloat(
      Number(
        forceData.length - 1
          ? forceData[forceData.length - 1] &&
              forceData[forceData.length - 1].time
          : 0
      ).toFixed(2)
    );
    const interval = setInterval(() => {
      // Slightly vary iMax and frequency for dynamic behavior
      const newIMax = iMax + (math.random() - 0.5) * 2; // Vary by ±1A
      const newFrequency = frequency + (math.random() - 0.5) * 0.2; // Vary by ±0.1Hz
      setIMax(newIMax);
      setFrequency(newFrequency);

      const newMeanCurrent = newIMax / Number(math.sqrt(2));
      setMeanCurrent(newMeanCurrent);

      const newPowerConsumption = VOLTAGE * newMeanCurrent;
      setPowerConsumption(newPowerConsumption);

      const newSpeed = K1 * newMeanCurrent;
      setSpeed(newSpeed);

      // Generate forces based on current (you might want to adjust these relationships)
      const newForceX =
        80 + (newMeanCurrent / 20) * 40 + (math.random() - 0.5) * 10;
      const newForceY =
        100 + (newMeanCurrent / 20) * 40 + (math.random() - 0.5) * 10;
      // const newForceZ =
      //   80 + (newMeanCurrent / 20) * 40 + (math.random() - 0.5) * 10;
      setForceX(newForceX);
      setForceY(newForceY);
      // setForceZ(newForceZ);

      // Calculate total force using vector formula
      const torque = 25 * meanCurrent;

      setTotalForce(torque);
      // const newTotalForce = math.sqrt(
      //   newForceX ** 2 + newForceY ** 2 + newForceZ ** 2
      // );
      // setTotalForce(newTotalForce);

      // Add new force data point
      setForceData((prevData: any) => {
        return [
          ...prevData.slice(-99),
          {
            time,
            x: newForceX,
            y: newForceY,
            // z: newForceZ,
            total: torque, // You can still store total if needed elsewhere
          },
        ];
      });

      const forceXData = forceData.map((some) => some.x); // Extract forceX (newForceX)

      // Pad data to the next power of 2
      const paddedLength = Math.pow(2, Math.ceil(Math.log2(forceXData.length)));
      const paddedData = [
        ...forceXData,
        ...new Array(paddedLength - forceXData.length).fill(0),
      ];

      // Initialize FFT
      const fft = new FFT(paddedLength);

      // Perform FFT
      const out = fft.createComplexArray(); // Initializes an empty complex array
      fft.realTransform(out, paddedData); // Perform real FFT on padded data

      // Convert to magnitude
      const magnitudes = Array(paddedLength / 2)
        .fill(0)
        .map((_, i) => {
          const real = out[2 * i]; // Real part of complex number
          const imag = out[2 * i + 1]; // Imaginary part of complex number
          return Math.sqrt(real * real + imag * imag);
        });

      // Create frequency array
      const sampleRate = 1 / 0.1; // Assuming 0.1s between each sample
      const frequencies = Array(paddedLength / 2)
        .fill(0)
        .map((_, i) => {
          return (i * sampleRate) / paddedLength;
        });

      // Combine frequencies and magnitudes
      const fftResult = frequencies.map((freq, i) => ({
        frequency: freq,
        magnitude: magnitudes[i],
      }));

      // Set the FFT result to state or use the data
      setFFTData(fftResult);
      time += 0.1; // Increment time by 0.1 seconds
    }, 1000); // Update every 100ms for smoother animation

    return () => clearInterval(interval);
  }, [iMax, frequency]);

  return (
    <div className="dashboard">
      <div className="left-section">
        <div className="progress-grid">
          <div className="metric-card metric-data">
            <h2>Mean Current</h2>
            <CircularProgressbar
              styles={{
                text: {
                  fontSize: "14px", // Change this value to whatever size you want
                },
              }}
              value={meanCurrent}
              maxValue={50}
              text={`${meanCurrent.toFixed(2)} A`}
            />
          </div>
          <div className="metric-card metric-data">
            <h2>Power Consumption</h2>
            <CircularProgressbar
              styles={{
                text: {
                  fontSize: "14px", // Change this value to whatever size you want
                },
              }}
              value={powerConsumption}
              maxValue={10000}
              text={`${powerConsumption.toFixed(2)} W`}
            />
          </div>
          <div className="metric-card metric-data">
            <h2>Spindle Speed</h2>
            <CircularProgressbar
              value={speed}
              maxValue={5000}
              text={`${speed.toFixed(0)} RPM`}
              styles={{
                text: {
                  fontSize: "14px", // Change this value to whatever size you want
                },
              }}
            />
          </div>
          <div className="metric-card metric-data">
            <h2>Torque</h2>
            <CircularProgressbar
              styles={{
                text: {
                  fontSize: "14px", // Change this value to whatever size you want
                },
              }}
              value={Number(torque)}
              maxValue={1000}
              text={`${(torque as number).toFixed(2)} Nm`}
            />
          </div>
        </div>
      </div>

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
              {/* <div>
                <p>Z: {forceZ.toFixed(2)} N</p>
                <progress value={forceZ} max={150} />
              </div> */}
            </div>
          </div>
          <div className="metric-card">
            <h2>Current Parameters</h2>
            <p>Imax: {iMax.toFixed(2)} A</p>
            <p>Frequency: {frequency.toFixed(2)} Hz</p>
          </div>
        </div>
        <div className="full-width">
          <h2>Real-time Force Plot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forceData}>
              <CartesianGrid strokeDasharray="3 3" />

              {/* X-Axis with time label */}
              <XAxis
                dataKey="time"
                label={{
                  value: "Time(s)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />

              {/* Y-Axis with Newton label */}
              <YAxis
                domain={[0, 300]}
                label={{
                  value: "Force (N)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <Tooltip />
              <Legend />

              {/* Lines for force data */}
              <Line type="monotone" dataKey="x" stroke="#8884d8" />
              <Line type="monotone" dataKey="y" stroke="#82ca9d" />
              {/* <Line type="monotone" dataKey="z" stroke="#ffc658" /> */}
              {/* <Line type="monotone" dataKey="total" stroke="#ff7300" /> */}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="full-width">
          <h2>FFT Analysis of Force</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fftData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="frequency"
                label={{
                  value: "frequency (Hz)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                domain={[0, 300]}
                label={{
                  value: "Force (N)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="magnitude" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

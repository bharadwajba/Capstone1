import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ setIsLoggedIn }) {

  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_URL}/api/airdata`, { headers })
      .then(res => setData(res.data))
      .catch(()=>{
        localStorage.removeItem("token");
        setIsLoggedIn(false);
      });

    axios.get(`${API_URL}/api/user`, { headers })
      .then(res => setUser(res.data))
      .catch(()=>{
        localStorage.removeItem("token");
        setIsLoggedIn(false);
      });

  }, [API_URL, setIsLoggedIn]);

  /* === YOUR ANALYTICS CODE (UNCHANGED) === */

  const avgAQI = data.length ? (data.reduce((s,i)=>s+i.aqi,0)/data.length).toFixed(1) : 0;
  const maxPM = data.length ? Math.max(...data.map(i=>i.pm25)) : 0;

  const yearlyData={};
  data.forEach(i=>{
    const y=new Date(i.date).getFullYear();
    if(!yearlyData[y]) yearlyData[y]=[];
    yearlyData[y].push(i.aqi);
  });

  const years=Object.keys(yearlyData);

  const yearlyAvgAQI=years.map(
    y=> yearlyData[y].reduce((a,b)=>a+b,0)/yearlyData[y].length
  );

  function calculateRegression(v){
    const n=v.length;
    if(n<2) return {slope:0,intercept:0,r2:0};

    const x=[...Array(n).keys()];
    const sumX=x.reduce((a,b)=>a+b,0);
    const sumY=v.reduce((a,b)=>a+b,0);
    const sumXY=x.reduce((a,b,i)=>a+b*v[i],0);
    const sumX2=x.reduce((a,b)=>a+b*b,0);

    const slope=(n*sumXY-sumX*sumY)/(n*sumX2-sumX*sumX);
    const intercept=(sumY-slope*sumX)/n;

    return {slope,intercept,r2:0};
  }

  const {slope:trendSlope,intercept}=calculateRegression(yearlyAvgAQI);

  const forecastYears=["+1","+2","+3"];
  const forecastValues=forecastYears.map((_,i)=>trendSlope*(yearlyAvgAQI.length+i)+intercept);

  const trendChart={
    labels:[...years,...forecastYears],
    datasets:[
      {
        label:"Yearly AQI Trend",
        data:[...yearlyAvgAQI,null,null,null],
        borderColor:"#ffb703",
        backgroundColor:"rgba(255,183,3,.2)",
        tension:.4,
        fill:true
      },
      {
        label:"Forecast",
        data:[...Array(yearlyAvgAQI.length).fill(null),...forecastValues],
        borderColor:"#00e5ff",
        tension:.4
      }
    ]
  };

  const handleLogout=()=>{
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return(

    <div style={{
      background:"linear-gradient(135deg,#5b6cff,#7b61ff,#00c9a7)",
      minHeight:"100vh",
      color:"white",
      padding:"40px",
      fontFamily:"system-ui"
    }}>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h1 style={{fontSize:"34px"}}>Air Quality Dashboard</h1>

        {user &&(
          <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
            <img src={user.profilePic} alt=""
              style={{width:"45px",borderRadius:"50%",border:"2px solid white"}}/>
            <span style={{fontWeight:"600"}}>{user.name}</span>

            <button onClick={handleLogout}
              style={{
                background:"#ff4d6d",
                color:"white",
                border:"none",
                padding:"10px 18px",
                borderRadius:"8px",
                cursor:"pointer",
                fontWeight:"600"
              }}>
              Logout
            </button>
          </div>
        )}
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
        gap:"22px",
        marginTop:"35px"
      }}>
        <Card title="Average AQI" value={avgAQI}/>
        <Card title="Max PM2.5" value={maxPM}/>
        <Card title="Trend Slope" value={trendSlope.toFixed(2)}/>
      </div>

      <Section title="Pollution Trend + Forecast">
        <Line data={trendChart}/>
      </Section>

    </div>
  );
}

const Card=({title,value})=>(
  <div style={{
    background:"rgba(255,255,255,0.15)",
    backdropFilter:"blur(12px)",
    padding:"25px",
    borderRadius:"18px",
    textAlign:"center",
    boxShadow:"0 10px 30px rgba(0,0,0,.25)"
  }}>
    <h3>{title}</h3>
    <h2 style={{marginTop:"10px",fontSize:"30px"}}>{value}</h2>
  </div>
);

const Section=({title,children})=>(
  <div style={{
    marginTop:"45px",
    background:"rgba(255,255,255,0.15)",
    backdropFilter:"blur(12px)",
    padding:"30px",
    borderRadius:"20px",
    boxShadow:"0 12px 40px rgba(0,0,0,.3)"
  }}>
    <h2 style={{marginBottom:"15px"}}>{title}</h2>
    {children}
  </div>
);

export default Dashboard;
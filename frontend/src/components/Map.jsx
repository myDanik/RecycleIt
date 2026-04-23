import React, {useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


export default function Map({ points = [], selectedPointId = null }) {
  const navigate = useNavigate();
  const [center, setCenter] = useState([55.7558, 37.6173]);
  const [zoom, setZoom] = useState(12);
  const [validPoints, setValidPoints] = useState([]);


  useEffect(() => {
    const filteredPoints = points.filter(point => {
      const hasLat = point.latitude !== null && point.latitude !== undefined;
      const hasLng = point.longitude !== null && point.longitude !== undefined;
      
      if (!hasLat || !hasLng) {
        console.log(`Пропускаем пункт ${point.id}: отсутствуют координаты`);
        return false;
      }
      
      const lat = parseFloat(point.latitude);
      const lng = parseFloat(point.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.log(`Пропускаем пункт ${point.id}: некорректные координаты`);
        return false;
      }
      
      return true;
    });
    
    setValidPoints(filteredPoints);
    
    if (filteredPoints.length > 0) {
      const firstPoint = filteredPoints[0];
      setCenter([firstPoint.latitude, firstPoint.longitude]);
    }
  }, [points]);

  useEffect(() => {
    if (selectedPointId && validPoints.length > 0) {
      const selectedPoint = validPoints.find(p => p.id === selectedPointId);
      if (selectedPoint) {
        setCenter([selectedPoint.latitude, selectedPoint.longitude]);
        setZoom(15);
      }
    }
  }, [selectedPointId, validPoints]);

   const handleMarkerClick = (pointId) => {
    navigate(`/sidebar/info/${pointId}`);
  };

  if (validPoints.length === 0) {
    return (
      <div className="map-container">
        <div className="map-inner">
          <div className="map-hint" style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            height: "100%",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
            padding: "20px"
          }}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>🗺️</div>
              <div>Нет пунктов с координатами для отображения</div>
              <div style={{ fontSize: "12px", marginTop: "10px", color: "#999" }}>
                Координаты не указаны в данных
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validPoints.map((point) => {
          const icon = defaultIcon;
          
          return (
            <Marker
              key={point.id}
              position={[point.latitude, point.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(point.id),
              }}
            >
              <Popup>
                <div style={{ maxWidth: "250px" }}>
                  <h4 style={{ margin: "5px 0", color: "#1976d2" }}>{point.name}</h4>
                  <p style={{ margin: "5px 0", fontSize: "12px" }}>
                    <strong>📍 Адрес:</strong> {point.address || "Не указан"}
                  </p>
                  {point.waste_types && point.waste_types.length > 0 && (
                    <p style={{ margin: "5px 0", fontSize: "12px" }}>
                      <strong>♻ Принимает:</strong> {point.waste_types.join(", ")}
                    </p>
                  )}
                  {point.opens_at && point.closes_at && (
                    <p style={{ margin: "5px 0", fontSize: "12px" }}>
                      <strong>🕐 Время работы:</strong> {point.opens_at.slice(0,5)}-{point.closes_at.slice(0,5)}
                    </p>
                  )}
                  <p style={{ 
                    margin: "5px 0", 
                    fontSize: "10px", 
                    color: "#666",
                    fontStyle: "italic" 
                  }}>
                    Координаты: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
    
    </div>
  );
}
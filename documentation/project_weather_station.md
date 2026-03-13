# 🌤️ ESP32-S3 Weather Station

A compact, Wi-Fi connected weather station measuring temperature, humidity, barometric pressure, and ambient light — built around the ESP32-S3-WROOM-1.

---

## Hardware

| Component | Role |
|---|---|
| ESP32-S3-WROOM-1 | Microcontroller + Wi-Fi |
| GY-BME280 | Temperature, humidity, pressure |
| GY-302 (BH1750) | Ambient light (lux) |

### Wiring (I²C shared bus)

| Signal | ESP32-S3 Pin |
|---|---|
| SDA | GPIO 8 |
| SCL | GPIO 9 |
| VCC | 3.3V |
| GND | GND |

Both sensors share the same two wires. BME280 address: `0x76`, BH1750 address: `0x23`.

---

## What It Measures

- **Temperature** — °C / °F
- **Humidity** — % relative humidity
- **Pressure** — hPa (can derive altitude)
- **Light level** — lux (day/night detection, UV index proxy)

---

## Software Stack

```
Arduino IDE or ESP-IDF
├── Adafruit BME280 library
├── BH1750 library (claws/BH1750)
├── WiFi + HTTPClient (data upload)
└── Optional: ESPAsyncWebServer (local dashboard)
```

### Core Loop

```cpp
// Every 60 seconds:
float temp     = bme.readTemperature();
float humidity = bme.readHumidity();
float pressure = bme.readPressure() / 100.0F;  // hPa
float lux      = lightMeter.readLightLevel();

// store data locally. 
// try to connect to hotspot of phone. 
// as soon as connection is there send data to other network node in some way (email, webserver, etc. has to be decided)
```

---


## Features to Add

- [important] Deep sleep between readings (battery-friendly)
- [important] Derived altitude from pressure
- [not important] Weather trend (rising/falling pressure = weather change)
- [not important] Day/night detection from lux
- [maybe] OTA firmware updates over Wi-Fi
- [maybe] E-ink display for always-on readout

---

## Enclosure

A small simple gastro transparent PP weatherproof box with a small hole for cables and hotglue for sealing:
- Light aperture or clear window for the BH1750
- USB-C port for power / flashing access

---

## Power

| Option | Notes |
|---|---|
| USB 5V | Simplest — powered from 20000 mAh powerbank migth get low quick?|
---

## Pin Summary

| GPIO | Use | Status |
|---|---|---|
| 8 | I²C SDA | ✅ Safe |
| 9 | I²C SCL | ✅ Safe |
| 3 | (free) | ⚠️ Strapping — avoid |
| 4,5,6,7,15–18 | Free to use | ✅ Safe |
| 26–32 | SPI Flash | ❌ Reserved |

--- 
this browser app is for setting settings which then generates a .cpp or .ino code . flashing the microcontroller then can be done via browser. 

this browser app also might be running constantly on the server in the same network like the esp32. 
eventually it will also be here for visually representing the data using echarts.esm.min.js. 


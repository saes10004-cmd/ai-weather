import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Proxy for geocoding (Open-Meteo Geocoding API)
app.get("/api/geocode", async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "City name is required" });
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        name
      )}&count=5&language=ko&format=json`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch geocoding data");
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Geocoding proxy error:", error);
    res.status(500).json({ error: error.message || "Failed to search location" });
  }
});

// Weather API endpoint supporting Open-Meteo or OpenWeatherMap with client's API key
app.get("/api/weather", async (req: Request, res: Response) => {
  try {
    const { lat, lon, city, owmKey } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and Longitude are required" });
    }

    // 1. If OpenWeatherMap API key is provided, try OpenWeatherMap first
    if (owmKey && typeof owmKey === "string" && city && typeof city === "string") {
      try {
        console.log(`Fetching from OpenWeatherMap for ${city}`);
        const owmRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owmKey}&units=metric&lang=kr`
        );
        const owmForecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${owmKey}&units=metric&lang=kr`
        );

        if (owmRes.ok && owmForecastRes.ok) {
          const currentData = await owmRes.json();
          const forecastData = await owmForecastRes.json();

          // Transform OpenWeatherMap to unified schema for UI convenience
          return res.json({
            source: "openweathermap",
            current: {
              temp: currentData.main.temp,
              feels_like: currentData.main.feels_like,
              humidity: currentData.main.humidity,
              wind_speed: currentData.wind.speed,
              pressure: currentData.main.pressure,
              weather_code: currentData.weather[0].id, // OWM code
              description: currentData.weather[0].description,
              icon: currentData.weather[0].icon,
              is_day: currentData.weather[0].icon.endsWith("d") ? 1 : 0,
            },
            forecast: forecastData.list.slice(0, 8).map((item: any) => ({
              time: item.dt_txt,
              temp: item.main.temp,
              weather_code: item.weather[0].id,
              description: item.weather[0].description,
              precipitation_prob: Math.round((item.pop || 0) * 100),
            })),
            daily: forecastData.list
              .filter((_: any, idx: number) => idx % 8 === 0)
              .slice(0, 5)
              .map((item: any) => ({
                date: item.dt_txt.split(" ")[0],
                temp_max: item.main.temp_max,
                temp_min: item.main.temp_min,
                weather_code: item.weather[0].id,
                description: item.weather[0].description,
              })),
          });
        }
      } catch (owmError) {
        console.error("OpenWeatherMap fetch failed, falling back to Open-Meteo:", owmError);
      }
    }

    // 2. Default to free Open-Meteo API
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;

    const openMeteoRes = await fetch(openMeteoUrl);
    if (!openMeteoRes.ok) {
      throw new Error("Failed to fetch data from weather provider");
    }

    const data = await openMeteoRes.json();
    res.json({
      source: "open-meteo",
      current: {
        temp: data.current.temperature_2m,
        feels_like: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind_speed: data.current.wind_speed_10m,
        pressure: data.current.pressure_msl,
        weather_code: data.current.weather_code,
        description: getWeatherDescription(data.current.weather_code),
        is_day: data.current.is_day,
      },
      forecast: data.hourly.time.slice(0, 24).map((timeStr: string, idx: number) => ({
        time: timeStr,
        temp: data.hourly.temperature_2m[idx],
        weather_code: data.hourly.weather_code[idx],
        description: getWeatherDescription(data.hourly.weather_code[idx]),
        precipitation_prob: data.hourly.precipitation_probability[idx],
      })),
      daily: data.daily.time.map((timeStr: string, idx: number) => ({
        date: timeStr,
        temp_max: data.daily.temperature_2m_max[idx],
        temp_min: data.daily.temperature_2m_min[idx],
        weather_code: data.daily.weather_code[idx],
        description: getWeatherDescription(data.daily.weather_code[idx]),
        uv_index: data.daily.uv_index_max[idx],
        sunrise: data.daily.sunrise[idx]?.split("T")[1] || "",
        sunset: data.daily.sunset[idx]?.split("T")[1] || "",
      })),
    });
  } catch (error: any) {
    console.error("Weather endpoint error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch weather forecast" });
  }
});

// Gemini AI Weather Advisor Endpoint
app.post("/api/weather-advice", async (req: Request, res: Response) => {
  try {
    const { current, daily, city } = req.body;

    if (!current) {
      return res.status(400).json({ error: "Weather data is required for advice" });
    }

    const prompt = `당신은 센스 있고 다정한 AI 날씨 코디네이터입니다.
${city || "선택한 도시"}의 현재 날씨와 예보 데이터를 바탕으로, 오늘 하루를 완벽하게 보낼 수 있는 한국어 피드백을 작성해 주세요.

[날씨 정보]
- 현재 온도: ${current.temp}°C (체감 온도: ${current.feels_like}°C)
- 습도: ${current.humidity}%
- 풍속: ${current.wind_speed} m/s
- 날씨 상태: ${current.description}
${daily ? `- 오늘 최고 기온: ${daily[0]?.temp_max}°C, 최저 기온: ${daily[0]?.temp_min}°C` : ""}

[답변 요구사항]
반드시 다음 구조의 JSON 형식으로만 완벽하게 한국어로 대답해 주세요 (다른 텍스트나 markdown 코드 블록은 제외하고 순수 JSON 스트링으로만):
{
  "summary": "오늘의 날씨를 감성적이고 다정하게 요약한 1줄 총평 (예: '선선한 바람이 불어 야외 활동하기 딱 좋은 날씨예요!')",
  "outfit": "기온과 날씨에 딱 맞는 실용적이고 예쁜 옷차림 추천 (상의, 하의, 아우터, 신발 등 구체적으로 제안)",
  "activities": "오늘 날씨에 완벽히 매칭되는 추천 활동 2~3가지 (예: '한강공원 피크닉', '따뜻한 실내 미술관 투어')",
  "precaution": "오늘 날씨에 주의해야 할 건강/안전 팁 (예: '자외선 지수가 높으니 선크림을 챙기세요', '일교차가 크니 얇은 가디건을 챙기세요')"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const adviceText = response.text?.trim() || "{}";
    const adviceJson = JSON.parse(adviceText);
    res.json(adviceJson);
  } catch (error: any) {
    console.error("Gemini advice error, falling back to local heuristic advisor:", error);
    try {
      const { current, daily, city } = req.body;
      const fallbackAdvice = getLocalWeatherAdvice(current, daily, city);
      res.json(fallbackAdvice);
    } catch (fallbackError) {
      console.error("Local fallback advisor also failed:", fallbackError);
      res.json({
        summary: "오늘 하루도 행복하고 건강한 시간 보내세요!",
        outfit: "오늘 바깥 온도에 알맞은 가볍고 편안한 레이어드 옷차림을 조율해 보세요.",
        activities: "기온에 맞는 가벼운 산책이나 맛있는 따뜻한 음식 탐방",
        precaution: "일교차와 기상 예보 변동에 수시로 대비하여 가벼운 외투를 휴대해 주세요."
      });
    }
  }
});

// Heuristic rule-based fallback weather advisor when Gemini API is busy or offline
function getLocalWeatherAdvice(current: any, daily: any, city: string) {
  const temp = current.temp;
  const desc = current.description || "";
  
  let summary = `오늘 ${city}의 날씨는 ${desc} 상태이며, 기온은 약 ${temp}°C 입니다.`;
  let outfit = "기온에 맞는 편안한 복장을 추천합니다.";
  let activities = "동네 산책 및 따뜻한 음료 한 잔을 즐겨보세요.";
  let precaution = "기온 변화에 대비해 건강관리에 유의하세요.";

  // Outfits and Advice based on temperature ranges
  if (temp >= 28) {
    summary = `오늘 ${city}은 최고 ${temp}°C의 무더운 여름 날씨가 예상됩니다. 시원한 하루 보내세요!`;
    outfit = "반소매 티셔츠, 얇은 셔츠, 반바지, 미니스커트, 린넨 소재 의류가 시원합니다. 햇빛 차단을 위한 선글라스도 추천해요.";
    activities = "에어컨이 시원한 미술관이나 카페 방문, 저녁 시간대 야간 산책, 시원한 실내 쇼핑몰 나들이";
    precaution = "수분을 충분히 섭취하시고, 자외선이 매우 강하니 외출 시 자외선 차단제를 꼭 바르세요.";
  } else if (temp >= 23 && temp < 28) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 활동하기 좋은 살짝 더운 초여름/늦봄 날씨입니다.`;
    outfit = "반팔 티셔츠, 얇은 셔츠, 얇은 긴바지, 면바지, 청바지를 입기 좋은 온도입니다.";
    activities = "시원한 음료와 함께하는 공원 피크닉, 카페 테라스 자리에서 독서, 가벼운 야외 러닝";
    precaution = "야외 활동 시 햇빛에 오래 노출되지 않도록 모자를 준비하고 적절한 휴식을 취하세요.";
  } else if (temp >= 20 && temp < 23) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 가장 쾌적하고 선선하여 야외 활동에 완벽한 날씨입니다!`;
    outfit = "얇은 가디건, 셔츠, 긴팔 티셔츠, 청바지, 면바지가 가장 적합합니다.";
    activities = "야외 공원 나들이, 하이킹, 자전거 라이딩, 도심 산책과 데이트";
    precaution = "낮에는 따뜻하지만 그늘이나 저녁에는 쌀쌀할 수 있으니 가벼운 겉옷을 가방에 넣고 다니세요.";
  } else if (temp >= 17 && temp < 20) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 쾌적하지만 아침저녁으로 선선하여 겉옷이 필요한 날씨입니다.`;
    outfit = "얇은 니트, 맨투맨, 가디건, 얇은 재킷, 청바지, 슬랙스 코디를 추천합니다.";
    activities = "단풍 구경이나 골목 투어, 한적한 카페에서의 시간, 조용한 북카페 방문";
    precaution = "일교차가 커서 감기에 걸리기 쉬운 기온입니다. 외출 시 입고 벗기 편한 아우터를 꼭 챙기세요.";
  } else if (temp >= 12 && temp < 17) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 쌀쌀함이 느껴지는 완연한 봄/가을 날씨입니다.`;
    outfit = "자켓, 트렌치코트, 야상, 도톰한 가디건, 니트, 스타킹, 가죽 자켓이 어울리는 온도입니다.";
    activities = "따뜻한 국물 요리 맛집 탐방, 실내 서점 투어, 차분한 음악과 드라이브";
    precaution = "목을 따뜻하게 유지하고 면역력이 떨어지지 않도록 비타민 가득한 과일이나 차를 챙겨 드세요.";
  } else if (temp >= 9 && temp < 12) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 꽤 쌀쌀한 환절기 날씨입니다. 든든하게 입고 나가세요.`;
    outfit = "트렌치코트, 도톰한 재킷, 점퍼, 니트웨어, 머플러나 스카프 코디가 따뜻함을 지켜줍니다.";
    activities = "따뜻한 수프 전문점 방문, 스파나 찜질방에서 힐링, 실내 전시회 관람";
    precaution = "체온 조절을 위해 여러 겹 겹쳐 입는 레이어드 룩을 연출하시고, 실내 습도 관리에 신경 써주세요.";
  } else if (temp >= 5 && temp < 9) {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 초겨울처럼 차갑고 차가운 공기가 느껴지는 날씨입니다.`;
    outfit = "코트, 가죽 자켓, 얇은 패딩, 도톰한 가디건, 내의 착용을 추천하며 기모 바지도 좋습니다.";
    activities = "따뜻한 실내 가볼 만한 곳 투어, 집에서 따뜻한 영화 한 편 감상, 온천욕";
    precaution = "실외 체류 시간을 줄이시고 외출 후에는 손발을 깨끗이 씻어 환절기 감기를 예방하세요.";
  } else {
    summary = `오늘 ${city}은 기온 약 ${temp}°C로 영하권이거나 매우 추운 혹한의 겨울 날씨입니다. 감기 조심하세요!`;
    outfit = "두꺼운 패딩, 롱패딩, 겨울 코트, 장갑, 목도리, 털모자, 기모 레깅스나 방한화까지 풀무장 필수!";
    activities = "따뜻한 집콕 힐링, 실내 스파 투어, 김이 모락모락 나는 호빵이나 붕어빵 사 먹기";
    precaution = "동파 사고에 유의하시고 빙판길 보행 시 넘어지지 않도록 스마트폰을 주머니에 넣고 조심히 걸으세요.";
  }

  // Weather-specific modification
  if (desc.includes("비") || desc.includes("이슬비") || desc.includes("소나기")) {
    summary = `오늘 ${city}은 비가 내리는 날입니다. 차분하고 촉촉한 하루 보내세요!`;
    outfit += " 빗물에 오염되어도 좋은 가벼운 소재의 옷과 어두운 톤의 바지, 레인부츠나 방수 기능이 있는 신발을 신어보세요.";
    activities = "창밖 빗소리를 들을 수 있는 분위기 좋은 카페 창가 자리, 실내 미술관 관람, 따뜻한 파전에 어울리는 맛집";
    precaution = "우산을 필수로 챙기시고, 빗길이 미끄러우니 보행과 운전 시 특히 서행해 주세요.";
  } else if (desc.includes("눈") || desc.includes("싸락눈")) {
    summary = `오늘 ${city}은 하얀 눈이 소담스럽게 내리는 날입니다. 동화 같은 하루 보내세요!`;
    outfit += " 눈이 녹아 젖지 않는 방수 아우터와 따뜻한 방한 어그부츠, 따뜻한 장갑을 꼭 챙기세요.";
    activities = "눈 내리는 풍경 사진 찍기, 분위기 있는 카페 탐방, 눈사람 만들기";
    precaution = "바닥이 매우 미끄러우니 미끄럼 방지 슈즈를 신고 주머니에서 손을 빼서 조심히 걸어 다니세요.";
  } else if (desc.includes("뇌우")) {
    summary = `오늘 ${city}은 강한 천둥번개와 비를 동반한 뇌우 날씨입니다. 가급적 실내에 머무세요.`;
    outfit = "외출을 최소화하시되 비를 완벽히 차단할 수 있는 기능성 윈드브레이커와 아우터, 장화를 제안합니다.";
    activities = "포근하고 아늑한 집콕 힐링, 실내 밀집 복합 쇼핑몰에서 모든 것 해결하기, 영화 감상";
    precaution = "천둥번개가 칠 때는 큰 나무 아래나 전신주 주변을 피하시고 전자기기 코드를 정비해 두세요.";
  }

  return { summary, outfit, activities, precaution };
}

// WMO Weather code mapper
function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: "맑음",
    1: "대체로 맑음",
    2: "구름 조금",
    3: "흐림",
    45: "안개",
    48: "침적성 안개",
    51: "가벼운 이슬비",
    53: "보통 이슬비",
    55: "강한 이슬비",
    56: "가벼운 결빙성 이슬비",
    57: "강한 결빙성 이슬비",
    61: "약한 비",
    63: "보통 비",
    65: "강한 비",
    66: "가벼운 결빙성 비",
    67: "강한 결빙성 비",
    71: "약한 눈",
    73: "보통 눈",
    75: "강한 눈",
    77: "싸락눈",
    80: "약한 소나기",
    81: "보통 소나기",
    82: "강한 소나기",
    85: "약한 소나기성 눈",
    86: "강한 소나기성 눈",
    95: "뇌우",
    96: "약한 우박을 동반한 뇌우",
    99: "강한 우박을 동반한 뇌우",
  };
  return codes[code] || "정보 없음";
}

// Vite and Static assets middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Aura Weather running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

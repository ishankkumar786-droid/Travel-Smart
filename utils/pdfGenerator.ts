import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const generateItineraryPDF = async (itinerary: any) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #2d3436;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #6c5ce7;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #6c5ce7;
            font-size: 32px;
          }
          .header p {
            margin: 5px 0;
            color: #636e72;
            font-size: 16px;
          }
          .summary {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #6c5ce7;
          }
          .day-card {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .day-header {
            background-color: #6c5ce7;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-weight: bold;
            color: #2d3436;
            text-transform: uppercase;
            font-size: 14px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          .item {
            margin-bottom: 10px;
            padding-left: 15px;
            border-left: 2px solid #dfe6e9;
          }
          .item-title {
            font-weight: 600;
            color: #2d3436;
          }
          .item-desc {
            font-size: 14px;
            color: #636e72;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #b2bec3;
            border-top: 1px solid #dfe6e9;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${itinerary.destination} Itinerary</h1>
          <p>${itinerary.days.length} Days Trip • ${itinerary.budget} Budget</p>
        </div>

        <div class="summary">
          <strong>Trip Overview:</strong><br/>
          ${itinerary.summary || `A wonderful journey through ${itinerary.destination}.`}
        </div>

        ${itinerary.days.map((day: any) => `
          <div class="day-card">
            <div class="day-header">
              Day ${day.day}: ${day.title}
            </div>

            ${day.travel ? `
              <div class="section">
                <div class="section-title">🚆 Travel Information</div>
                <div class="item">
                  <div class="item-title">${day.travel.mode}</div>
                  <div class="item-desc">Duration: ${day.travel.duration} • Cost: ${day.travel.costRange}</div>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <div class="section-title">📍 Places to Visit</div>
              ${(day.places || []).map((place: any) => `
                <div class="item">
                  <div class="item-title">${place.name || 'Unknown Place'}</div>
                  <div class="item-desc">${place.description || 'No description available'} (Time: ${place.bestTime || 'Anytime'})</div>
                </div>
              `).join('')}
            </div>

            <div class="section">
              <div class="section-title">🍜 Food Suggestions</div>
              ${(day.food || []).map((food: any) => `
                <div class="item">
                  <div class="item-title">${food.name || 'Local Spot'}</div>
                  <div class="item-desc">Try: ${food.famousFor || 'Local Cuisine'} • Range: ${food.priceRange || 'N/A'}</div>
                </div>
              `).join('')}
            </div>

            ${day.stay ? `
              <div class="section">
                <div class="section-title">🏨 Accommodation</div>
                <div class="item">
                  <div class="item-title">${day.stay.category}</div>
                  <div class="item-desc">Expected Range: ${day.stay.priceRange} per night</div>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <div class="section-title">💡 Pro Tips</div>
              <ul>
                ${day.tips.map((tip: string) => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}

        <div class="footer">
          Generated by Smart Travel Companion AI<br/>
          &copy; 2026 Your Travel Partner
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri);
    } else {
      // Android: Sharing directly often works better for downloads
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const City = require('../models/City');

const CITIES = [
  {
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    description: 'The holy city at the confluence of Ganga, Yamuna, and Saraswati rivers.',
    aliases: ['allahabad', 'prayag', 'sangam city'],
    places: [
      { name: 'Triveni Sangam', category: 'religious', bestTime: 'Morning (5-8 AM)', duration: '1-2 hours', description: 'Sacred confluence of three rivers', entryFee: 'Free', rating: 4.8 },
      { name: 'Anand Bhawan', category: 'museum', bestTime: 'Morning (9 AM-12 PM)', duration: '1-2 hours', description: 'Nehru family ancestral home turned museum', entryFee: '₹20-₹80', rating: 4.5 },
      { name: 'Allahabad Fort', category: 'fort', bestTime: 'Morning (9-11 AM)', duration: '1 hour', description: 'Mughal fort near Sangam, partially restricted', entryFee: 'Free', rating: 4.2 },
      { name: 'Khusro Bagh', category: 'monument', bestTime: 'Afternoon (3-5 PM)', duration: '1 hour', description: 'Mughal-era garden with beautiful tombs', entryFee: 'Free', rating: 4.3 },
      { name: 'Alopi Devi Mandir', category: 'temple', bestTime: 'Morning (7-9 AM)', duration: '30 min', description: 'One of the Shakti Peethas', entryFee: 'Free', rating: 4.4 },
      { name: 'Chandrashekhar Azad Park', category: 'park', bestTime: 'Evening (4-6 PM)', duration: '1 hour', description: 'Historic park where Azad sacrificed his life', entryFee: 'Free', rating: 4.3 },
      { name: 'Mankameshwar Mandir', category: 'temple', bestTime: 'Morning (6-9 AM)', duration: '30 min', description: 'Ancient Shiva temple near Sangam', entryFee: 'Free', rating: 4.5 },
      { name: 'New Yamuna Bridge', category: 'viewpoint', bestTime: 'Evening (5-7 PM)', duration: '30 min', description: 'Stunning sunset views over the river', entryFee: 'Free', rating: 4.0 },
    ],
    food: [
      { name: 'El Chico', type: 'Multicuisine Restaurant', famousFor: 'puddings,Sizzlers,baked dishes', area: 'Civil Lines', budgetCategory: 'low', priceRange: '₹50-₹150', rating: 4.5 },
      { name: 'Netram Kachori', type: 'street-food', famousFor: 'Kachori-Sabzi', area: 'Loknath', budgetCategory: 'low', priceRange: '₹30-₹80', rating: 4.6 },
      { name: 'Eat On Restaurant', type: 'restaurant', famousFor: 'North Indian, Chinese', area: 'Civil Lines', budgetCategory: 'moderate', priceRange: '₹150-₹400', rating: 4.2 },
      { name: 'Kamdhenu Sweets', type: 'sweet-shop', famousFor: 'Peda, Gulab Jamun', area: 'Katra', budgetCategory: 'low', priceRange: '₹50-₹200', rating: 4.4 },
      { name: 'Indian Coffee House', type: 'cafe', famousFor: 'Coffee, Dosa', area: 'MG Marg', budgetCategory: 'low', priceRange: '₹40-₹120', rating: 4.3 },
    ],
    hotels: {
      low: [{ name: 'Budget dharamshalas near Sangam', area: 'Sangam area', priceRange: '₹300-₹800/night', rating: 3.5 }],
      moderate: [{ name: 'Hotel Kanha Shyam', area: 'Civil Lines', priceRange: '₹1200-₹2500/night', rating: 4.0 }],
      high: [{ name: 'Hotel Milan Palace', area: 'Civil Lines', priceRange: '₹3500-₹7000/night', rating: 4.3 }],
    },
    tips: [
      'Visit Sangam early morning for peaceful boat ride',
      'Hire a local guide at Sangam for ₹200-₹500',
      'Civil Lines area is best for food and shopping',
      'Carry cash — many small shops don\'t accept cards',
    ],
    avoid: [
      'Avoid Sangam during peak afternoon heat',
      'Don\'t fall for overpriced boat rides — negotiate firmly',
      'Avoid visiting during Magh Mela if you prefer less crowds',
    ],
    localGems: [
      { name: 'Loknath Kachori Gali', type: 'food', description: 'Hidden lane with best kachoris in the city, locals-only spot', bestTime: 'Morning', area: 'Old City' },
      { name: 'Saraswati Ghat sunset', type: 'experience', description: 'Lesser-known ghat with beautiful evening aarti', bestTime: 'Evening', area: 'Daraganj' },
    ],
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    description: 'The spiritual capital of India, one of the oldest living cities in the world.',
    aliases: ['banaras', 'kashi', 'benaras'],
    places: [
      { name: 'Dashashwamedh Ghat', category: 'religious', bestTime: 'Evening (6-8 PM)', duration: '1-2 hours', description: 'Famous Ganga Aarti ceremony', entryFee: 'Free', rating: 4.9 },
      { name: 'Kashi Vishwanath Temple', category: 'temple', bestTime: 'Morning (5-7 AM)', duration: '1-2 hours', description: 'One of the 12 Jyotirlingas', entryFee: 'Free', rating: 4.8 },
      { name: 'Sarnath', category: 'historical', bestTime: 'Morning (9-11 AM)', duration: '2-3 hours', description: 'Where Buddha gave his first sermon', entryFee: '₹15-₹200', rating: 4.6 },
      { name: 'Assi Ghat', category: 'religious', bestTime: 'Morning (5-7 AM)', duration: '1 hour', description: 'Starting point of ghat walk, morning aarti', entryFee: 'Free', rating: 4.5 },
      { name: 'Manikarnika Ghat', category: 'religious', bestTime: 'Anytime', duration: '30 min', description: 'Sacred cremation ghat, observe respectfully', entryFee: 'Free', rating: 4.4 },
      { name: 'Ramnagar Fort', category: 'fort', bestTime: 'Morning (10 AM-12 PM)', duration: '1-2 hours', description: 'Fort-palace with museum across the Ganga', entryFee: '₹15-₹75', rating: 4.2 },
      { name: 'BHU Campus', category: 'park', bestTime: 'Afternoon (3-5 PM)', duration: '1-2 hours', description: 'Beautiful university campus with Vishwanath Temple', entryFee: 'Free', rating: 4.5 },
    ],
    food: [
      { name: 'Blue Lassi', type: 'street-food', famousFor: 'Thick creamy lassi', area: 'Kachori Gali', budgetCategory: 'low', priceRange: '₹30-₹100', rating: 4.8 },
      { name: 'Kashi Chaat Bhandar', type: 'street-food', famousFor: 'Tamatar chaat, Pani Puri', area: 'Dashashwamedh', budgetCategory: 'low', priceRange: '₹30-₹80', rating: 4.7 },
      { name: 'Deena Chaat', type: 'street-food', famousFor: 'Chaat', area: 'Luxa Road', budgetCategory: 'low', priceRange: '₹30-₹80', rating: 4.5 },
      { name: 'Pizzeria Vaatika', type: 'cafe', famousFor: 'Wood-fired pizza, river views', area: 'Assi Ghat', budgetCategory: 'moderate', priceRange: '₹200-₹500', rating: 4.4 },
      { name: 'Baati Chokha', type: 'restaurant', famousFor: 'Baati Chokha, traditional thali', area: 'Lanka', budgetCategory: 'moderate', priceRange: '₹150-₹350', rating: 4.5 },
    ],
    hotels: {
      low: [{ name: 'Hostels near Assi Ghat', area: 'Assi', priceRange: '₹400-₹900/night', rating: 3.8 }],
      moderate: [{ name: 'Hotel Ganges Grand', area: 'Nadesar', priceRange: '₹1500-₹3500/night', rating: 4.1 }],
      high: [{ name: 'BrijRama Palace', area: 'Darbhanga Ghat', priceRange: '₹8000-₹25000/night', rating: 4.7 }],
    },
    tips: ['Book boat ride for sunrise — best experience in Varanasi', 'Wear comfortable shoes for ghat walks', 'Try morning subah-e-banaras walk', 'Bargain at Vishwanath Gali shops'],
    avoid: ['Don\'t photograph cremation ghats without permission', 'Avoid touts near temples', 'Avoid narrow gali driving, walk instead'],
    localGems: [
      { name: 'Morning Boat Ride at Sunrise', type: 'experience', description: 'Watch 84 ghats from the river as the sun rises — magical', bestTime: 'Dawn 5:30 AM', area: 'Dashashwamedh' },
      { name: 'Malaiyo (winter special)', type: 'food', description: 'Cloud-like milk foam dessert available only Nov-Feb', bestTime: 'Morning', area: 'Godowlia' },
    ],
  },
  {
    city: 'Katra',
    state: 'Jammu & Kashmir',
    description: 'Base camp for the holy Vaishno Devi shrine, nestled in the Trikuta Mountains.',
    aliases: ['katra vaishno devi', 'vaishnodevi'],
    places: [
      { name: 'Vaishno Devi Temple', category: 'religious', bestTime: 'Early Morning (3-5 AM start)', duration: '10-14 hours (trek)', description: 'One of the holiest Hindu shrines', entryFee: 'Free', rating: 4.9 },
      { name: 'Bhairavnath Temple', category: 'temple', bestTime: 'After Vaishno Devi darshan', duration: '1 hour', description: 'Temple 2.5 km beyond the main shrine', entryFee: 'Free', rating: 4.5 },
      { name: 'Ardh Kuwari', category: 'religious', bestTime: 'During trek', duration: 'Midway stop', description: 'Holy cave midway on the trek', entryFee: 'Free', rating: 4.4 },
      { name: 'Sanjhi Chhat', category: 'viewpoint', bestTime: 'Evening', duration: '1 hour', description: 'Helipad viewpoint with mountain views', entryFee: 'Free', rating: 4.2 },
    ],
    food: [
      { name: 'Sagar Ratna', type: 'restaurant', famousFor: 'South Indian, North Indian', area: 'Main Bazaar', budgetCategory: 'moderate', priceRange: '₹100-₹300', rating: 4.0 },
      { name: 'Katra street food', type: 'street-food', famousFor: 'Rajma Chawal, Chole', area: 'Main Market', budgetCategory: 'low', priceRange: '₹50-₹120', rating: 4.2 },
    ],
    hotels: {
      low: [{ name: 'Dharamshalas near bus stand', area: 'Katra town', priceRange: '₹300-₹700/night', rating: 3.3 }],
      moderate: [{ name: 'Hotel Asia Vaishno Devi', area: 'Main Road', priceRange: '₹1500-₹3000/night', rating: 3.9 }],
      high: [{ name: 'Vaishno Devi Bhawan', area: 'Katra', priceRange: '₹4000-₹8000/night', rating: 4.2 }],
    },
    tips: ['Register yatra slip online before trek', 'Start trek before dawn for cooler weather', 'Carry light — locker rooms available at base', 'Pony/palki available for elderly'],
    avoid: ['Avoid trekking in heavy rain season (Jul-Aug)', 'Don\'t carry large bags on trek', 'Avoid weekends and navratri for extreme crowds'],
    localGems: [
      { name: 'Night trek under stars', type: 'experience', description: 'Trek at 2-3 AM — less crowd, cool weather, starry sky', area: 'Trek route' },
    ],
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    description: 'India\'s capital — a blend of Mughal heritage, modern architecture, and vibrant street life.',
    aliases: ['new delhi', 'dilli'],
    places: [
      { name: 'Red Fort', category: 'fort', bestTime: 'Morning (9-11 AM)', duration: '2 hours', description: 'Iconic Mughal fortress, UNESCO site', entryFee: '₹35-₹500', rating: 4.5 },
      { name: 'India Gate', category: 'monument', bestTime: 'Evening (5-8 PM)', duration: '1 hour', description: 'War memorial with beautiful evening lighting', entryFee: 'Free', rating: 4.7 },
      { name: 'Qutub Minar', category: 'monument', bestTime: 'Morning (9-11 AM)', duration: '1-2 hours', description: 'Tallest brick minaret, UNESCO site', entryFee: '₹35-₹500', rating: 4.6 },
      { name: 'Humayun\'s Tomb', category: 'monument', bestTime: 'Afternoon (2-5 PM)', duration: '1-2 hours', description: 'Precursor to Taj Mahal architecture', entryFee: '₹35-₹500', rating: 4.7 },
      { name: 'Lotus Temple', category: 'temple', bestTime: 'Afternoon (1-4 PM)', duration: '1 hour', description: 'Beautiful Bahai house of worship', entryFee: 'Free', rating: 4.5 },
      { name: 'Akshardham Temple', category: 'temple', bestTime: 'Afternoon (2-6 PM)', duration: '3-4 hours', description: 'Stunning modern Hindu temple complex', entryFee: 'Free', rating: 4.8 },
      { name: 'Chandni Chowk', category: 'market', bestTime: 'Morning (10 AM-1 PM)', duration: '2-3 hours', description: 'Historic market with incredible street food', entryFee: 'Free', rating: 4.4 },
      { name: 'Hauz Khas Village', category: 'other', bestTime: 'Evening (4-8 PM)', duration: '2 hours', description: 'Trendy area with cafes, ruins, and lake', entryFee: 'Free', rating: 4.3 },
    ],
    food: [
      { name: 'Paranthe Wali Gali', type: 'street-food', famousFor: 'Stuffed paranthas since 1872', area: 'Chandni Chowk', budgetCategory: 'low', priceRange: '₹50-₹150', rating: 4.5 },
      { name: 'Karim\'s', type: 'restaurant', famousFor: 'Mughlai non-veg, kebabs', area: 'Jama Masjid', budgetCategory: 'moderate', priceRange: '₹200-₹500', rating: 4.6 },
      { name: 'Natraj Dahi Bhalle', type: 'street-food', famousFor: 'Dahi Bhalle, Aloo Tikki', area: 'Chandni Chowk', budgetCategory: 'low', priceRange: '₹40-₹100', rating: 4.7 },
      { name: 'SodaBottleOpenerWala', type: 'cafe', famousFor: 'Parsi cuisine, quirky cafe', area: 'Khan Market', budgetCategory: 'moderate', priceRange: '₹300-₹700', rating: 4.4 },
      { name: 'Bukhara (ITC Maurya)', type: 'fine-dining', famousFor: 'Dal Bukhara, Tandoori', area: 'Chanakyapuri', budgetCategory: 'high', priceRange: '₹2000-₹5000', rating: 4.8 },
    ],
    hotels: {
      low: [{ name: 'Hostels in Paharganj', area: 'Paharganj', priceRange: '₹500-₹1200/night', rating: 3.5 }],
      moderate: [{ name: 'Hotel in Karol Bagh', area: 'Karol Bagh', priceRange: '₹2000-₹4000/night', rating: 4.0 }],
      high: [{ name: 'The Imperial', area: 'Janpath', priceRange: '₹10000-₹30000/night', rating: 4.8 }],
    },
    tips: ['Use Delhi Metro — fastest way to travel', 'Best street food is in Old Delhi area', 'Book Akshardham tickets online to skip queue', 'Carry water bottles in summer'],
    avoid: ['Avoid auto-rickshaws without meter — use Uber/Ola', 'Skip outdoor sightseeing 12-3 PM in summer', 'Beware of scams at railway station'],
    localGems: [
      { name: 'Old Delhi food walk', type: 'experience', description: 'Walk from Jama Masjid through Chandni Chowk tasting 10+ dishes', area: 'Old Delhi' },
      { name: 'Lodhi Art District', type: 'place', description: 'Open-air street art gallery across Lodhi Colony walls', area: 'Lodhi Colony' },
    ],
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    description: 'The Pink City — royal palaces, colorful bazaars, and Rajasthani hospitality.',
    aliases: ['pink city'],
    places: [
      { name: 'Amber Fort', category: 'fort', bestTime: 'Morning (8-11 AM)', duration: '2-3 hours', description: 'Majestic hilltop fort with Sheesh Mahal', entryFee: '₹100-₹500', rating: 4.7 },
      { name: 'Hawa Mahal', category: 'palace', bestTime: 'Morning (9-11 AM)', duration: '1 hour', description: 'Iconic palace of winds with 953 windows', entryFee: '₹50-₹200', rating: 4.5 },
      { name: 'City Palace', category: 'palace', bestTime: 'Morning (9-12 PM)', duration: '2 hours', description: 'Royal palace complex with museum', entryFee: '₹100-₹700', rating: 4.6 },
      { name: 'Jantar Mantar', category: 'monument', bestTime: 'Afternoon (2-4 PM)', duration: '1 hour', description: 'UNESCO astronomical observation site', entryFee: '₹50-₹200', rating: 4.4 },
      { name: 'Nahargarh Fort', category: 'fort', bestTime: 'Evening (4-7 PM)', duration: '2 hours', description: 'Hilltop fort with panoramic city views', entryFee: '₹50-₹200', rating: 4.5 },
      { name: 'Jal Mahal', category: 'palace', bestTime: 'Evening (5-7 PM)', duration: '30 min', description: 'Water palace in Man Sagar Lake — view from outside', entryFee: 'Free', rating: 4.3 },
    ],
    food: [
      { name: 'Laxmi Misthan Bhandar (LMB)', type: 'restaurant', famousFor: 'Ghewar, Rajasthani thali', area: 'Johari Bazaar', budgetCategory: 'moderate', priceRange: '₹200-₹500', rating: 4.5 },
      { name: 'Rawat Mishtan Bhandar', type: 'sweet-shop', famousFor: 'Pyaaz Kachori', area: 'Station Road', budgetCategory: 'low', priceRange: '₹30-₹100', rating: 4.7 },
      { name: '1135 AD', type: 'fine-dining', famousFor: 'Royal Rajasthani cuisine in Amber Fort', area: 'Amber Fort', budgetCategory: 'high', priceRange: '₹1500-₹4000', rating: 4.6 },
      { name: 'Tapri Central', type: 'cafe', famousFor: 'Chai and snacks with views', area: 'Central Park', budgetCategory: 'low', priceRange: '₹50-₹200', rating: 4.3 },
    ],
    hotels: {
      low: [{ name: 'Hostels in MI Road area', area: 'MI Road', priceRange: '₹500-₹1200/night', rating: 3.6 }],
      moderate: [{ name: 'Hotel Pearl Palace', area: 'Hathroi', priceRange: '₹1500-₹3500/night', rating: 4.2 }],
      high: [{ name: 'Rambagh Palace', area: 'Bhawani Singh Road', priceRange: '₹15000-₹50000/night', rating: 4.9 }],
    },
    tips: ['Combine Amber Fort + Jaigarh Fort in one morning', 'Johari Bazaar is best for jewelry shopping', 'Book elephant ride at Amber online to avoid wait', 'Best photos at Hawa Mahal from across the street'],
    avoid: ['Avoid gem/carpet shop scams — don\'t follow strangers', 'Don\'t visit forts barefoot in summer — stones get hot', 'Avoid Amber Fort on Mondays — some sections closed'],
    localGems: [
      { name: 'Sunset at Nahargarh', type: 'experience', description: 'Watch Jaipur turn pink during golden hour from the fort walls', area: 'Nahargarh' },
      { name: 'Rawat\'s Pyaaz Kachori', type: 'food', description: 'Arguably the best kachori in all of Rajasthan — must try', area: 'Station Road' },
    ],
  },
  {
    city: 'Manali',
    state: 'Himachal Pradesh',
    description: 'A Himalayan resort town known for adventure sports, snow-capped peaks, and hippie culture.',
    aliases: ['manali himachal'],
    places: [
      { name: 'Solang Valley', category: 'adventure', bestTime: 'Morning (9-12 PM)', duration: '3-4 hours', description: 'Paragliding, zorbing, skiing in winter', entryFee: '₹varies by activity', rating: 4.6 },
      { name: 'Rohtang Pass', category: 'viewpoint', bestTime: 'Morning (8-11 AM)', duration: '3-4 hours', description: 'Snow point at 13,050 ft — permit required', entryFee: '₹550 permit', rating: 4.7 },
      { name: 'Old Manali', category: 'other', bestTime: 'Afternoon-Evening', duration: '2-3 hours', description: 'Bohemian cafes, shops, riverside walks', entryFee: 'Free', rating: 4.5 },
      { name: 'Hadimba Temple', category: 'temple', bestTime: 'Morning (9-11 AM)', duration: '1 hour', description: 'Ancient cave temple in cedar forest', entryFee: 'Free', rating: 4.5 },
      { name: 'Jogini Waterfall', category: 'nature', bestTime: 'Morning (10 AM-1 PM)', duration: '2-3 hours trek', description: 'Beautiful waterfall trek from Vashisht', entryFee: 'Free', rating: 4.3 },
      { name: 'Vashisht Hot Springs', category: 'nature', bestTime: 'Morning (7-9 AM)', duration: '1 hour', description: 'Natural hot water springs and temple', entryFee: 'Free', rating: 4.2 },
    ],
    food: [
      { name: 'Lazy Dog Lounge', type: 'cafe', famousFor: 'Trout fish, continental', area: 'Old Manali', budgetCategory: 'moderate', priceRange: '₹200-₹600', rating: 4.5 },
      { name: 'Johnson\'s Cafe', type: 'restaurant', famousFor: 'European cuisine, trout', area: 'Circuit House Road', budgetCategory: 'high', priceRange: '₹500-₹1200', rating: 4.4 },
      { name: 'Chopsticks', type: 'restaurant', famousFor: 'Tibetan, Chinese, momos', area: 'Mall Road', budgetCategory: 'moderate', priceRange: '₹150-₹400', rating: 4.3 },
      { name: 'Drifters Cafe', type: 'cafe', famousFor: 'Pancakes, coffee, vibes', area: 'Old Manali', budgetCategory: 'low', priceRange: '₹100-₹300', rating: 4.5 },
    ],
    hotels: {
      low: [{ name: 'Backpacker hostels in Old Manali', area: 'Old Manali', priceRange: '₹400-₹1000/night', rating: 3.8 }],
      moderate: [{ name: 'Hotel in Mall Road area', area: 'Mall Road', priceRange: '₹2000-₹4000/night', rating: 4.0 }],
      high: [{ name: 'The Himalayan', area: 'Log Huts', priceRange: '₹6000-₹15000/night', rating: 4.5 }],
    },
    tips: ['Book Rohtang Pass permit online in advance', 'Best season: March-June and Oct-Nov', 'Carry warm clothes even in summer', 'Old Manali has better cafes than Mall Road'],
    avoid: ['Avoid driving to Rohtang during heavy snowfall', 'Don\'t trek alone without informing hotel', 'Avoid Mall Road parking chaos — walk'],
    localGems: [
      { name: 'Sethan Village', type: 'place', description: 'Hidden village 12km from Manali with igloo stays in winter', area: '12km from Manali' },
      { name: 'Fresh trout at riverside cafes', type: 'food', description: 'Locally caught trout cooked fresh — Old Manali specialty', area: 'Old Manali' },
    ],
  },
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) { console.error('❌ MONGODB_URI not set'); process.exit(1); }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing cities
    await City.deleteMany({});
    console.log('🗑️  Cleared existing city data');

    // Insert seed data
    await City.insertMany(CITIES);
    console.log(`✅ Seeded ${CITIES.length} premium cities`);

    CITIES.forEach((c) => console.log(`   📍 ${c.city} (${c.places.length} places, ${c.food.length} food spots)`));

    await mongoose.disconnect();
    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seedDB();

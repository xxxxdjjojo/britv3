import type { CityData } from "@/types/areas";

export const CITIES: Record<string, CityData> = {
  london: {
    slug: "london",
    name: "London",
    county: "Greater London",
    region: "London",
    population: "8.9 million",
    description:
      "London's property market remains the most expensive in the UK, driven by strong international demand and limited supply. Prime central boroughs command a significant premium while outer zones offer relative value for buyers priced out of Zone 1–2.",
    avgPrice: 725000,
    avgPriceFormatted: "£725,000",
    yoyChange: 3.2,
    yoyChangeFormatted: "+3.2%",
    activeListings: 485,
    avgDaysToSell: 38,
    medianPrice: 610000,
    transactionsLast12m: 4800,
    priceByType: {
      D: 1450000,
      S: 850000,
      T: 720000,
      F: 520000,
      O: 680000,
    },
    boroughs: [
      {
        name: "Westminster",
        slug: "westminster",
        avgPrice: "£1,250,000",
        description:
          "The historic political and cultural heart of London, home to embassies, government buildings, and some of the capital's most prestigious residential addresses.",
      },
      {
        name: "Camden",
        slug: "camden",
        avgPrice: "£850,000",
        description:
          "A vibrant north London borough blending bohemian markets with Georgian terraces and a thriving creative and tech economy.",
      },
      {
        name: "Islington",
        slug: "islington",
        avgPrice: "£780,000",
        description:
          "Gentrified inner-north London borough known for its Victorian townhouses, independent restaurants on Upper Street, and proximity to the City.",
      },
      {
        name: "Greenwich",
        slug: "greenwich",
        avgPrice: "£520,000",
        description:
          "A UNESCO World Heritage riverside borough offering period properties, excellent transport links to Canary Wharf, and a strong sense of community.",
      },
      {
        name: "Hackney",
        slug: "hackney",
        avgPrice: "£620,000",
        description:
          "East London's creative hub with rapidly rising values, Victorian terraces, and a young professional demographic attracted by its arts scene.",
      },
      {
        name: "Brixton",
        slug: "brixton",
        avgPrice: "£560,000",
        description:
          "A culturally rich south London neighbourhood with a strong Afro-Caribbean heritage, thriving food market, and improving transport links.",
      },
    ],
    transport: [
      {
        name: "London Underground",
        type: "underground",
        detail: "12 lines covering 270 stations across all zones",
        emoji: "🚇",
      },
      {
        name: "Elizabeth Line",
        type: "rail",
        detail: "Crossrail connecting Reading/Heathrow to Shenfield/Abbey Wood",
        emoji: "🚆",
      },
      {
        name: "London Overground",
        type: "rail",
        detail: "Orbital rail network linking inner and outer London",
        emoji: "🚆",
      },
      {
        name: "Thameslink",
        type: "rail",
        detail: "North–south rail corridor through City Thameslink and Blackfriars",
        emoji: "🚆",
      },
      {
        name: "Heathrow Airport",
        type: "airport",
        detail: "World's busiest airport, 30 mins by Piccadilly line or Elizabeth line",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 51.5074, lng: -0.1278 },
    postcodePrefix: "SW/SE/E/N/W",
  },

  manchester: {
    slug: "manchester",
    name: "Manchester",
    county: "Greater Manchester",
    region: "North West",
    population: "550,000",
    description:
      "Manchester has emerged as the UK's second property hotspot, with consistent price growth fuelled by a booming tech and media economy. The Northern Quarter and Ancoats lead demand for modern city-centre living while suburbs like Didsbury offer family-friendly alternatives.",
    avgPrice: 285000,
    avgPriceFormatted: "£285,000",
    yoyChange: 6.1,
    yoyChangeFormatted: "+6.1%",
    activeListings: 310,
    avgDaysToSell: 28,
    medianPrice: 245000,
    transactionsLast12m: 2100,
    priceByType: {
      D: 520000,
      S: 310000,
      T: 240000,
      F: 195000,
      O: 210000,
    },
    boroughs: [
      {
        name: "Ancoats",
        slug: "ancoats",
        avgPrice: "£280,000",
        description:
          "A former industrial district transformed into one of Manchester's trendiest postcodes, with converted mills, independent eateries, and new-build apartments.",
      },
      {
        name: "Didsbury",
        slug: "didsbury",
        avgPrice: "£420,000",
        description:
          "A leafy south Manchester suburb with Victorian semis, excellent schools, and a village-feel high street popular with young families.",
      },
      {
        name: "Chorlton",
        slug: "chorlton",
        avgPrice: "£360,000",
        description:
          "Manchester's most bohemian suburb, known for its independent coffee shops, diverse community, and period terraced housing.",
      },
      {
        name: "Northern Quarter",
        slug: "northern-quarter",
        avgPrice: "£260,000",
        description:
          "Manchester's creative and nightlife hub offering warehouse conversions and loft apartments within walking distance of the city centre.",
      },
    ],
    transport: [
      {
        name: "Metrolink",
        type: "tram",
        detail: "Extensive tram network covering 99 stops across Greater Manchester",
        emoji: "🚊",
      },
      {
        name: "Manchester Piccadilly",
        type: "rail",
        detail: "Principal mainline station with direct services to London in 2h 8m",
        emoji: "🚆",
      },
      {
        name: "Manchester Airport",
        type: "airport",
        detail: "International airport with 200+ destinations, 20 mins by rail from city",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 53.4808, lng: -2.2426 },
    postcodePrefix: "M",
  },

  birmingham: {
    slug: "birmingham",
    name: "Birmingham",
    county: "West Midlands",
    region: "West Midlands",
    population: "1.1 million",
    description:
      "Birmingham's property market is benefitting from the HS2 effect, with investors and owner-occupiers alike drawn by improving connectivity and a significantly lower price point than London. The city's diverse neighbourhoods offer everything from grand Edwardian semis to modern city-centre apartments.",
    avgPrice: 250000,
    avgPriceFormatted: "£250,000",
    yoyChange: 4.8,
    yoyChangeFormatted: "+4.8%",
    activeListings: 380,
    avgDaysToSell: 32,
    medianPrice: 215000,
    transactionsLast12m: 2800,
    priceByType: {
      D: 450000,
      S: 270000,
      T: 210000,
      F: 165000,
      O: 185000,
    },
    boroughs: [
      {
        name: "Edgbaston",
        slug: "edgbaston",
        avgPrice: "£380,000",
        description:
          "Birmingham's most prestigious residential district, home to the university, private schools, and substantial Victorian villas in a leafy parkland setting.",
      },
      {
        name: "Jewellery Quarter",
        slug: "jewellery-quarter",
        avgPrice: "£240,000",
        description:
          "A thriving urban village within walking distance of the city centre, known for its heritage jewellery trade, independent bars, and converted workshops.",
      },
      {
        name: "Moseley",
        slug: "moseley",
        avgPrice: "£290,000",
        description:
          "A popular bohemian suburb with a strong arts community, Victorian terraces, and regular farmers' markets attracting young professionals and families.",
      },
      {
        name: "Harborne",
        slug: "harborne",
        avgPrice: "£340,000",
        description:
          "One of Birmingham's most sought-after suburbs, offering excellent schools, a well-regarded high street, and good links to the Queen Elizabeth hospital campus.",
      },
    ],
    transport: [
      {
        name: "Birmingham New Street",
        type: "rail",
        detail: "Major intercity hub with direct services to London Euston in 1h 20m",
        emoji: "🚆",
      },
      {
        name: "HS2 Curzon Street",
        type: "rail",
        detail: "Future high-speed station cutting London journey time to under 50 minutes",
        emoji: "🚄",
      },
      {
        name: "Midland Metro",
        type: "tram",
        detail: "Light rail network linking city centre to West Bromwich and Wolverhampton",
        emoji: "🚊",
      },
    ],
    coordinates: { lat: 52.4862, lng: -1.8904 },
    postcodePrefix: "B",
  },

  bristol: {
    slug: "bristol",
    name: "Bristol",
    county: "Bristol",
    region: "South West",
    population: "470,000",
    description:
      "Bristol consistently ranks among the UK's most desirable cities to live in, with a property market that has outperformed the national average for over a decade. Clifton and Redland command premium prices while emerging neighbourhoods like Stokes Croft offer buyers a foothold in this vibrant city.",
    avgPrice: 385000,
    avgPriceFormatted: "£385,000",
    yoyChange: 5.3,
    yoyChangeFormatted: "+5.3%",
    activeListings: 230,
    avgDaysToSell: 27,
    medianPrice: 335000,
    transactionsLast12m: 1650,
    priceByType: {
      D: 680000,
      S: 420000,
      T: 340000,
      F: 260000,
      O: 295000,
    },
    boroughs: [
      {
        name: "Clifton",
        slug: "clifton",
        avgPrice: "£590,000",
        description:
          "Bristol's most prestigious neighbourhood, famous for its Georgian townhouses, the Clifton Suspension Bridge, and a vibrant village atmosphere.",
      },
      {
        name: "Redland",
        slug: "redland",
        avgPrice: "£450,000",
        description:
          "A genteel residential area popular with academics and professionals, offering large Victorian semis, excellent schools, and easy access to the university.",
      },
      {
        name: "Bedminster",
        slug: "bedminster",
        avgPrice: "£290,000",
        description:
          "An up-and-coming south Bristol neighbourhood with strong community spirit, independent shops on North Street, and a growing reputation for street art.",
      },
      {
        name: "Stokes Croft",
        slug: "stokes-croft",
        avgPrice: "£310,000",
        description:
          "Bristol's creative heartland, defined by colourful murals, artist studios, and an increasingly attractive property market for young buyers.",
      },
    ],
    transport: [
      {
        name: "Bristol Temple Meads",
        type: "rail",
        detail: "Mainline station with direct services to London Paddington in 1h 45m",
        emoji: "🚆",
      },
      {
        name: "M4/M5 Motorway",
        type: "bus",
        detail: "Direct motorway connections to London, Cardiff, and the South West",
        emoji: "🚌",
      },
      {
        name: "Bristol Airport",
        type: "airport",
        detail: "Regional airport 12 miles south of city with 100+ European destinations",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 51.4545, lng: -2.5879 },
    postcodePrefix: "BS",
  },

  leeds: {
    slug: "leeds",
    name: "Leeds",
    county: "West Yorkshire",
    region: "Yorkshire and the Humber",
    population: "800,000",
    description:
      "Leeds is one of the UK's fastest-growing cities, with a financial services sector second only to London and a property market that offers exceptional value for commuters and investors alike. Headingley and Chapel Allerton are perennial favourites while Kirkstall attracts buyers seeking space.",
    avgPrice: 250000,
    avgPriceFormatted: "£250,000",
    yoyChange: 5.7,
    yoyChangeFormatted: "+5.7%",
    activeListings: 295,
    avgDaysToSell: 30,
    medianPrice: 215000,
    transactionsLast12m: 2400,
    priceByType: {
      D: 460000,
      S: 275000,
      T: 195000,
      F: 165000,
      O: 180000,
    },
    boroughs: [
      {
        name: "Headingley",
        slug: "headingley",
        avgPrice: "£290,000",
        description:
          "A lively north Leeds suburb synonymous with student life and cricket, offering Victorian back-to-backs and semis within easy reach of the city centre.",
      },
      {
        name: "Roundhay",
        slug: "roundhay",
        avgPrice: "£380,000",
        description:
          "A premium north Leeds suburb anchored by the famous Roundhay Park, attracting families with its large Edwardian properties and highly rated schools.",
      },
      {
        name: "Chapel Allerton",
        slug: "chapel-allerton",
        avgPrice: "£310,000",
        description:
          "A trendy north Leeds village with a café culture, independent boutiques, and strong demand from young professionals priced out of Roundhay.",
      },
      {
        name: "Kirkstall",
        slug: "kirkstall",
        avgPrice: "£220,000",
        description:
          "A west Leeds neighbourhood undergoing steady gentrification, popular for its riverside walks, Victorian terraces, and competitive price point.",
      },
    ],
    transport: [
      {
        name: "Leeds Station",
        type: "rail",
        detail: "Busiest rail station outside London with direct services to London King's Cross in 2h 10m",
        emoji: "🚆",
      },
      {
        name: "A1(M) Motorway",
        type: "bus",
        detail: "Direct motorway access to London and Edinburgh via the A1 corridor",
        emoji: "🚌",
      },
      {
        name: "Leeds Bradford Airport",
        type: "airport",
        detail: "Regional airport with domestic and European connections, 30 mins from city",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 53.8008, lng: -1.5491 },
    postcodePrefix: "LS",
  },

  edinburgh: {
    slug: "edinburgh",
    name: "Edinburgh",
    county: "City of Edinburgh",
    region: "Scotland",
    population: "530,000",
    description:
      "Edinburgh's property market is uniquely competitive, with Scotland's offers-over system frequently driving sale prices well above asking. The New Town's Georgian townhouses and tenement flats across the city remain in perennial demand from professionals, investors, and international buyers.",
    avgPrice: 340000,
    avgPriceFormatted: "£340,000",
    yoyChange: 7.2,
    yoyChangeFormatted: "+7.2%",
    activeListings: 195,
    avgDaysToSell: 25,
    medianPrice: 290000,
    transactionsLast12m: 1450,
    priceByType: {
      D: 620000,
      S: 380000,
      T: 310000,
      F: 245000,
      O: 270000,
    },
    boroughs: [
      {
        name: "Leith",
        slug: "leith",
        avgPrice: "£280,000",
        description:
          "Edinburgh's former port district, now a thriving waterfront neighbourhood known for its Michelin-starred restaurants, creative scene, and strong investment appeal.",
      },
      {
        name: "Stockbridge",
        slug: "stockbridge",
        avgPrice: "£430,000",
        description:
          "A village-within-a-city feel just north of the New Town, beloved for its Sunday market, independent shops, and elegant Georgian and Victorian tenements.",
      },
      {
        name: "Morningside",
        slug: "morningside",
        avgPrice: "£480,000",
        description:
          "Edinburgh's most prestigious suburb, synonymous with large stone villas, private schools, and a genteel high street south of the Meadows.",
      },
      {
        name: "New Town",
        slug: "new-town",
        avgPrice: "£520,000",
        description:
          "The UNESCO-listed Georgian grid at the heart of Edinburgh, offering grand townhouses and principal floor flats that represent some of Scotland's finest addresses.",
      },
    ],
    transport: [
      {
        name: "Edinburgh Waverley",
        type: "rail",
        detail: "Main intercity station with Avanti and LNER services to London in 4h 20m",
        emoji: "🚆",
      },
      {
        name: "Edinburgh Tram",
        type: "tram",
        detail: "Tram line connecting Edinburgh Airport to Newhaven via the city centre",
        emoji: "🚊",
      },
      {
        name: "Edinburgh Airport",
        type: "airport",
        detail: "Scotland's busiest airport with direct flights to 150+ destinations worldwide",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 55.9533, lng: -3.1883 },
    postcodePrefix: "EH",
  },

  oxford: {
    slug: "oxford",
    name: "Oxford",
    county: "Oxfordshire",
    region: "South East",
    population: "155,000",
    description:
      "Oxford's property market is defined by its world-famous university and a scarcity of developable land within the green belt, keeping prices high and supply tight. North Oxford's Victorian villas and the emerging East Oxford market attract a mix of academics, professionals, and London commuters.",
    avgPrice: 515000,
    avgPriceFormatted: "£515,000",
    yoyChange: 4.1,
    yoyChangeFormatted: "+4.1%",
    activeListings: 145,
    avgDaysToSell: 33,
    medianPrice: 450000,
    transactionsLast12m: 780,
    priceByType: {
      D: 920000,
      S: 580000,
      T: 460000,
      F: 330000,
      O: 380000,
    },
    boroughs: [
      {
        name: "Jericho",
        slug: "jericho",
        avgPrice: "£590,000",
        description:
          "Oxford's most fashionable neighbourhood, a compact Victorian enclave west of the city centre prized for its independent cafés, bookshops, and canal walks.",
      },
      {
        name: "Summertown",
        slug: "summertown",
        avgPrice: "£680,000",
        description:
          "North Oxford's premier residential district with large detached houses, strong school catchments, and a smart high street popular with university staff.",
      },
      {
        name: "Cowley",
        slug: "cowley",
        avgPrice: "£360,000",
        description:
          "East Oxford's diverse and increasingly gentrified neighbourhood offering better value terraced properties and a vibrant independent restaurant scene.",
      },
    ],
    transport: [
      {
        name: "Oxford Station",
        type: "rail",
        detail: "Direct Chiltern and GWR services to London Paddington and Marylebone in under 1 hour",
        emoji: "🚆",
      },
      {
        name: "A34/M40",
        type: "bus",
        detail: "Major road corridor linking Oxford to Birmingham and the M25/London",
        emoji: "🚌",
      },
    ],
    coordinates: { lat: 51.752, lng: -1.2577 },
    postcodePrefix: "OX",
  },

  cambridge: {
    slug: "cambridge",
    name: "Cambridge",
    county: "Cambridgeshire",
    region: "East of England",
    population: "145,000",
    description:
      "Cambridge commands the highest property prices outside London and the South East, driven by its globally renowned university and a booming life sciences and technology cluster known as Silicon Fen. Limited supply within the city boundary keeps competition fierce across all price points.",
    avgPrice: 500000,
    avgPriceFormatted: "£500,000",
    yoyChange: 4.5,
    yoyChangeFormatted: "+4.5%",
    activeListings: 120,
    avgDaysToSell: 29,
    medianPrice: 435000,
    transactionsLast12m: 720,
    priceByType: {
      D: 890000,
      S: 560000,
      T: 450000,
      F: 310000,
      O: 360000,
    },
    boroughs: [
      {
        name: "Newnham",
        slug: "newnham",
        avgPrice: "£680,000",
        description:
          "An affluent west Cambridge neighbourhood adjacent to the university, characterised by large Arts and Crafts houses and access to the Grantchester Meadows walks.",
      },
      {
        name: "Chesterton",
        slug: "chesterton",
        avgPrice: "£520,000",
        description:
          "A well-connected north Cambridge suburb with Victorian terraces, riverside access on the Cam, and easy cycling distance to the science parks.",
      },
      {
        name: "Romsey",
        slug: "romsey",
        avgPrice: "£440,000",
        description:
          "A popular south Cambridge residential area offering good value Victorian and Edwardian terraces within cycling distance of the city and rail station.",
      },
    ],
    transport: [
      {
        name: "Cambridge Station",
        type: "rail",
        detail: "Direct THAMESLINK and GN services to London King's Cross in 50 minutes",
        emoji: "🚆",
      },
      {
        name: "Guided Busway",
        type: "bus",
        detail: "World's longest guided busway linking Cambridge to St Ives and Huntingdon",
        emoji: "🚌",
      },
      {
        name: "M11",
        type: "bus",
        detail: "Motorway corridor to London Stansted Airport and the M25",
        emoji: "🚌",
      },
    ],
    coordinates: { lat: 52.2053, lng: 0.1218 },
    postcodePrefix: "CB",
  },

  liverpool: {
    slug: "liverpool",
    name: "Liverpool",
    county: "Merseyside",
    region: "North West",
    population: "500,000",
    description:
      "Liverpool offers some of the best rental yields and lowest entry prices of any major UK city, attracting significant buy-to-let investment alongside a growing owner-occupier market. The Baltic Triangle has transformed into a tech and creative quarter, driving gentrification across the city centre.",
    avgPrice: 200000,
    avgPriceFormatted: "£200,000",
    yoyChange: 5.9,
    yoyChangeFormatted: "+5.9%",
    activeListings: 340,
    avgDaysToSell: 35,
    medianPrice: 168000,
    transactionsLast12m: 2200,
    priceByType: {
      D: 380000,
      S: 220000,
      T: 170000,
      F: 130000,
      O: 145000,
    },
    boroughs: [
      {
        name: "Baltic Triangle",
        slug: "baltic-triangle",
        avgPrice: "£185,000",
        description:
          "Liverpool's fastest-rising neighbourhood, a former warehouse district now buzzing with tech companies, creative studios, and new-build apartment developments.",
      },
      {
        name: "Aigburth",
        slug: "aigburth",
        avgPrice: "£270,000",
        description:
          "A desirable south Liverpool suburb along the Mersey with Victorian semis, excellent schools, and popular parks drawing young families.",
      },
      {
        name: "Woolton",
        slug: "woolton",
        avgPrice: "£340,000",
        description:
          "Liverpool's most prestigious village suburb, known for its association with The Beatles, large detached properties, and a relaxed village centre.",
      },
    ],
    transport: [
      {
        name: "Liverpool Lime Street",
        type: "rail",
        detail: "Main intercity station with direct services to London Euston in 2h 10m",
        emoji: "🚆",
      },
      {
        name: "Merseyrail",
        type: "rail",
        detail: "Electrified suburban rail network covering 68 stations across Merseyside",
        emoji: "🚆",
      },
      {
        name: "Liverpool John Lennon Airport",
        type: "airport",
        detail: "City airport with easyJet and Ryanair routes to 60+ European destinations",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 53.4084, lng: -2.9916 },
    postcodePrefix: "L",
  },

  glasgow: {
    slug: "glasgow",
    name: "Glasgow",
    county: "City of Glasgow",
    region: "Scotland",
    population: "635,000",
    description:
      "Glasgow's property market delivers outstanding value by UK standards, with tenement flats in the West End and Merchant City attracting strong demand from young professionals. The city's ongoing regeneration and improving transport links continue to drive price growth across all districts.",
    avgPrice: 190000,
    avgPriceFormatted: "£190,000",
    yoyChange: 6.8,
    yoyChangeFormatted: "+6.8%",
    activeListings: 285,
    avgDaysToSell: 26,
    medianPrice: 162000,
    transactionsLast12m: 2600,
    priceByType: {
      D: 380000,
      S: 220000,
      T: 175000,
      F: 130000,
      O: 150000,
    },
    boroughs: [
      {
        name: "West End",
        slug: "west-end",
        avgPrice: "£290,000",
        description:
          "Glasgow's most desirable area, centred on the University of Glasgow, Byres Road, and the Botanic Gardens, popular with academics and professionals.",
      },
      {
        name: "Merchant City",
        slug: "merchant-city",
        avgPrice: "£195,000",
        description:
          "Glasgow's stylish city-centre cultural quarter with converted Victorian warehouses, designer bars, restaurants, and loft-style apartments.",
      },
      {
        name: "Shawlands",
        slug: "shawlands",
        avgPrice: "£235,000",
        description:
          "A vibrant south side neighbourhood popular with young professionals for its independent food and drink scene and well-preserved tenement stock.",
      },
    ],
    transport: [
      {
        name: "Glasgow Central",
        type: "rail",
        detail: "Scotland's busiest station with ScotRail and Avanti services to London in 4h 30m",
        emoji: "🚆",
      },
      {
        name: "Glasgow Subway",
        type: "underground",
        detail: "The world's third-oldest underground railway, serving 15 stops in a circular loop",
        emoji: "🚇",
      },
      {
        name: "Glasgow Airport",
        type: "airport",
        detail: "Scotland's second busiest airport with transatlantic and European routes",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 55.8642, lng: -4.2518 },
    postcodePrefix: "G",
  },

  nottingham: {
    slug: "nottingham",
    name: "Nottingham",
    county: "Nottinghamshire",
    region: "East Midlands",
    population: "330,000",
    description:
      "Nottingham offers some of the best value in the East Midlands, with a large student population supporting a healthy buy-to-let market and a city-centre regeneration programme attracting new investment. The Hockley creative quarter and West Bridgford suburb represent the city's two distinct faces.",
    avgPrice: 220000,
    avgPriceFormatted: "£220,000",
    yoyChange: 4.3,
    yoyChangeFormatted: "+4.3%",
    activeListings: 255,
    avgDaysToSell: 34,
    medianPrice: 188000,
    transactionsLast12m: 1650,
    priceByType: {
      D: 390000,
      S: 240000,
      T: 185000,
      F: 140000,
      O: 160000,
    },
    boroughs: [
      {
        name: "Hockley",
        slug: "hockley",
        avgPrice: "£195,000",
        description:
          "Nottingham's creative and independent shopping district in the Lace Market, popular with young professionals seeking city-centre apartments and converted warehouse living.",
      },
      {
        name: "West Bridgford",
        slug: "west-bridgford",
        avgPrice: "£310,000",
        description:
          "Nottinghamshire's most sought-after suburb south of the Trent, known for outstanding schools, leafy streets, and proximity to Trent Bridge cricket ground.",
      },
      {
        name: "Beeston",
        slug: "beeston",
        avgPrice: "£235,000",
        description:
          "A well-connected west Nottingham suburb adjacent to the university, offering Victorian semis, good tram access, and a popular town centre.",
      },
    ],
    transport: [
      {
        name: "Nottingham Station",
        type: "rail",
        detail: "Direct East Midlands Railway services to London St Pancras in 1h 45m",
        emoji: "🚆",
      },
      {
        name: "NET Tram",
        type: "tram",
        detail: "Nottingham Express Transit covering 51 stops across three lines",
        emoji: "🚊",
      },
      {
        name: "East Midlands Airport",
        type: "airport",
        detail: "Regional airport 15 miles south with short-haul and charter routes",
        emoji: "✈️",
      },
    ],
    coordinates: { lat: 52.9548, lng: -1.1581 },
    postcodePrefix: "NG",
  },

  sheffield: {
    slug: "sheffield",
    name: "Sheffield",
    county: "South Yorkshire",
    region: "Yorkshire and the Humber",
    population: "590,000",
    description:
      "Sheffield blends industrial heritage with outstanding natural scenery, sitting on the edge of the Peak District National Park. The city's property market punches well above its weight for value, with Kelham Island's transformation from steel works to hipster hub underpinning strong demand from young buyers.",
    avgPrice: 215000,
    avgPriceFormatted: "£215,000",
    yoyChange: 5.1,
    yoyChangeFormatted: "+5.1%",
    activeListings: 265,
    avgDaysToSell: 31,
    medianPrice: 182000,
    transactionsLast12m: 1900,
    priceByType: {
      D: 390000,
      S: 235000,
      T: 175000,
      F: 130000,
      O: 150000,
    },
    boroughs: [
      {
        name: "Kelham Island",
        slug: "kelham-island",
        avgPrice: "£215,000",
        description:
          "Sheffield's most fashionable neighbourhood on a man-made island, with converted steel mills turned into craft breweries, galleries, and trendy apartment blocks.",
      },
      {
        name: "Crookes",
        slug: "crookes",
        avgPrice: "£240,000",
        description:
          "A popular west Sheffield suburb on the hill above the city, offering Victorian terraces, good schools, and an authentic local community feel.",
      },
      {
        name: "Ecclesall",
        slug: "ecclesall",
        avgPrice: "£350,000",
        description:
          "Sheffield's leafy and affluent south-west corridor, home to the highly regarded Ecclesall Road café strip and large Victorian and Edwardian family homes.",
      },
    ],
    transport: [
      {
        name: "Sheffield Station",
        type: "rail",
        detail: "Direct EMR and CrossCountry services to London St Pancras in 2h 5m",
        emoji: "🚆",
      },
      {
        name: "Supertram",
        type: "tram",
        detail: "Four-line tram network covering 50 stops across the Sheffield city region",
        emoji: "🚊",
      },
      {
        name: "M1 Motorway",
        type: "bus",
        detail: "Direct motorway access south to London and north to Leeds via the M1",
        emoji: "🚌",
      },
    ],
    coordinates: { lat: 53.3811, lng: -1.4701 },
    postcodePrefix: "S",
  },
};

export const CITY_SLUGS: string[] = Object.keys(CITIES);

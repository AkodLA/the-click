/**
 * T24: a picture for every word. Pictures are emoji on purpose:
 *  - they match the rest of Snakk (tiles, scenarios and packs already use emoji),
 *  - they look right in light AND dark mode, at any size, on every phone,
 *  - no image files, no licences, no network, nothing for the CSP to block.
 * The word card shows the picture big, in a soft rounded tile; the picture quiz shows it alone.
 * Abstract words get the clearest emoji we could find; if none fits, leave the word out (no picture is
 * better than a misleading one).
 */
export const WORD_PICTURES: Record<string, string> = {
  // health
  "health-vakt": "🕘", "health-pasient": "🛌", "health-beboer": "👵", "health-medisin": "💊",
  "health-vondt": "🤕", "health-rapport": "📋", "health-hansker": "🧤", "health-sykepleier": "🧑‍⚕️",
  // construction
  "construction-hjelm": "⛑️", "construction-verneutstyr": "🦺", "construction-stillas": "🏗️", "construction-bas": "👷",
  "construction-verktoy": "🧰", "construction-bore": "🪛", "construction-betong": "🧱", "construction-matpause": "🥪",
  // logistics
  "logistics-lager": "🏭", "logistics-pall": "📦", "logistics-plukke": "🛒",
  "logistics-ordre": "🧾", "logistics-skift": "🔄", "logistics-hylle": "🗄️", "logistics-forsiktig": "⚠️",
  // hospitality
  "hospitality-bestilling": "📝", "hospitality-regning": "🧾", "hospitality-allergi": "🥜", "hospitality-kjokken": "🍳",
  "hospitality-gjest": "🛎️", "hospitality-bord": "🍽️", "hospitality-sjekke-inn": "🏨", "hospitality-servere": "🍲",
  // it
  "it-mote": "👥", "it-frist": "⏰", "it-oppgave": "✅", "it-feil": "🐛",
  "it-teste": "🧪", "it-losning": "💡", "it-hjemmekontor": "🏡", "it-kollega": "🧑‍💻",
  // education
  "education-barnehage": "🧸", "education-laerer": "🧑‍🏫", "education-lekser": "📚", "education-friminutt": "🛝",
  "education-matpakke": "🥪", "education-tur": "🥾", "education-henting": "👋", "education-foreldremote": "🗓️",
  // cleaning
  "cleaning-vaske": "🧽", "cleaning-stovsuge": "🧹", "cleaning-soppel": "🗑️", "cleaning-vaskemiddel": "🧴",
  "cleaning-glatt": "⚠️", "cleaning-nokkel": "🔑", "cleaning-ferdig": "✔️", "cleaning-torke-stov": "🪶",
  // transport
  "transport-sjafor": "🧑‍✈️", "transport-rute": "🗺️", "transport-levering": "🚚", "transport-forsinket": "⏳",
  "transport-holdeplass": "🚏", "transport-billett": "🎫", "transport-forerkort": "🪪", "transport-ko": "🚗",
  // student
  "student-time": "🏫", "student-prove": "📝", "student-karakter": "🅰️", "student-timeplan": "📅",
  "student-klassekamerat": "🧑‍🤝‍🧑", "student-kantine": "🍱", "student-gruppearbeid": "👥", "student-fravaer": "🚪",
  // football
  "football-kamp": "⚽", "football-mal": "🥅", "football-lag": "👕", "football-trening": "🏃",
  "football-heie": "📣", "football-dommer": "🟨",
  // cooking
  "cooking-middag": "🍝", "cooking-smake": "😋", "cooking-koke": "♨️", "cooking-steke": "🍳",
  "cooking-oppskrift": "📖", "cooking-ovn": "🔥",
  // music
  "music-sang": "🎵", "music-konsert": "🎤", "music-spille": "🎸", "music-synge": "🎙️",
  "music-band": "🥁", "music-ove": "🎼",
  // gaming
  "gaming-spill": "🎮", "gaming-vinne": "🏆", "gaming-tape": "💀", "gaming-niva": "📶",
  "gaming-lagre": "💾", "gaming-lagkamerat": "🤝",
  // outdoors
  "outdoors-tur": "🥾", "outdoors-fjell": "⛰️", "outdoors-hytte": "🛖", "outdoors-ski": "🎿",
  "outdoors-sekk": "🎒", "outdoors-utsikt": "🌄",
  // family
  "family-hjemme": "🏠", "family-bursdag": "🎂", "family-besoke": "🚪", "family-barnebarn": "👶",
  "family-svigerfamilie": "👨‍👩‍👧", "family-familieselskap": "🥳",
  // seasons
  "autumn-host": "🍂", "autumn-regn": "🌧️", "autumn-paraply": "☂️", "autumn-morkt": "🌑",
  "autumn-kakao": "☕", "autumn-ullgenser": "🧶", "autumn-lys": "🕯️",
  "christmas-jul": "🎄", "christmas-julaften": "🌟", "christmas-gave": "🎁", "christmas-pepperkaker": "🍪",
  "christmas-nisse": "🎅", "christmas-sno": "❄️",
  "17mai-nasjonaldag": "🎉", "17mai-flagg": "🇳🇴", "17mai-bunad": "👗", "17mai-barnetog": "🥁",
  "17mai-is": "🍦", "17mai-hurra": "🙌",
};

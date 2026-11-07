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
  "construction-verktoy": "🧰", "construction-bore": "🪛", "construction-betong": "🪨", "construction-matpause": "🥪",
  // logistics
  "logistics-lager": "🏭", "logistics-pall": "🪵", "logistics-plukke": "🛒",
  "logistics-ordre": "🧾", "logistics-skift": "🔄", "logistics-hylle": "🗄️", "logistics-forsiktig": "⚠️",
  // hospitality
  "hospitality-bestilling": "📝", "hospitality-regning": "🧾", "hospitality-allergi": "🥜", "hospitality-kjokken": "🍳",
  "hospitality-gjest": "🛎️", "hospitality-bord": "🍽️", "hospitality-sjekke-inn": "🏨", "hospitality-servere": "🍲",
  // it
  "it-mote": "👥", "it-frist": "⏰", "it-oppgave": "✅", "it-feil": "🐛",
  "it-teste": "🧪", "it-losning": "💡", "it-hjemmekontor": "🏡", "it-kollega": "🧑‍💻",
  // education
  "education-barnehage": "🧸", "education-laerer": "🧑‍🏫", "education-lekser": "📚", "education-friminutt": "🛝",
  "education-matpakke": "🥪", "education-tur": "🥾", "education-henting": "👋", "education-foreldremote": "👪",
  // cleaning
  "cleaning-vaske": "🫧", "cleaning-soppel": "🗑️", "cleaning-vaskemiddel": "🧴",
  "cleaning-glatt": "⚠️", "cleaning-nokkel": "🔑", "cleaning-ferdig": "✔️", "cleaning-torke-stov": "🪶",
  // transport
  "transport-sjafor": "🧑‍✈️", "transport-rute": "🗺️", "transport-levering": "🚚", "transport-forsinket": "⏳",
  "transport-holdeplass": "🚏", "transport-billett": "🎫", "transport-forerkort": "🪪", "transport-ko": "🚗",
  // student
  "student-time": "🏫", "student-prove": "📋", "student-karakter": "🅰️", "student-timeplan": "📅",
  "student-klassekamerat": "🧑‍🤝‍🧑", "student-kantine": "🍱", "student-gruppearbeid": "👥", "student-fravaer": "🚪",
  // football
  "football-kamp": "🆚", "football-mal": "🥅", "football-lag": "👕", "football-trening": "🏃",
  "football-heie": "📣", "football-dommer": "🟨",
  // cooking
  "cooking-middag": "🍝", "cooking-smake": "😋", "cooking-koke": "♨️", "cooking-steke": "🥓",
  "cooking-oppskrift": "📖", "cooking-ovn": "🔥",
  // music
  "music-sang": "🎵", "music-konsert": "🎤", "music-spille": "🎶", "music-synge": "🎙️",
  "music-band": "🧑‍🎤", "music-ove": "🎼",
  // gaming
  "gaming-spill": "🕹️", "gaming-vinne": "🏆", "gaming-tape": "💀", "gaming-niva": "📶",
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
  // T24 round 4: new words in field and interest packs
  "health-blodtrykk": "🩸",
  "health-rullestol": "🦽",
  "health-termometer": "🌡️",
  "health-sproyte": "💉",
  "construction-hammer": "🔨",
  "construction-stige": "🪜",
  "construction-murstein": "🧱",
  "construction-tegning": "📐",
  "logistics-eske": "📦",
  "logistics-skanner": "📟",
  "logistics-varer": "🛍️",
  "logistics-lastebil": "🚛",
  "hospitality-meny": "📜",
  "hospitality-servitor": "🤵",
  "hospitality-oppvask": "🫧",
  "hospitality-dessert": "🍰",
  "it-passord": "🔐",
  "it-skjerm": "🖥️",
  "it-oppdatering": "🔄",
  "it-tastatur": "⌨️",
  "education-sekk": "🎒",
  "education-blyant": "✏️",
  "education-klasserom": "🏫",
  "education-ukeplan": "🗓️",
  "cleaning-botte": "🪣",
  "cleaning-mopp": "🧹",
  "cleaning-svamp": "🧽",
  "cleaning-hansker": "🧤",
  "transport-rundkjoring": "🔃",
  "transport-parkering": "🅿️",
  "transport-trafikklys": "🚦",
  "transport-bompenger": "💳",
  "student-forelesning": "👩‍🏫",
  "student-eksamen": "📝",
  "student-hybel": "🛏️",
  "student-pensum": "📚",
  "football-ball": "⚽",
  "football-fotballsko": "👟",
  "football-straffe": "🎯",
  "football-tribune": "🏟️",
  "cooking-kniv": "🔪",
  "cooking-panne": "🍳",
  "cooking-salt": "🧂",
  "cooking-kjele": "🥘",
  "music-gitar": "🎸",
  "music-piano": "🎹",
  "music-hodetelefoner": "🎧",
  "music-trommer": "🥁",
  "gaming-kontroller": "🎮",
  "gaming-runde": "🔁",
  "gaming-poeng": "💯",
  "gaming-terning": "🎲",
  "outdoors-kompass": "🧭",
  "outdoors-bal": "🔥",
  "outdoors-sovepose": "🛌",
  "outdoors-termos": "🫖",
  "family-tvilling": "👯",
  "family-barneselskap": "🎈",
  "family-kusine": "👩‍👧",
  "family-onkel": "👨‍🦳",
};

/**
 * T25: a picture for each phrase, shown as a small tile on the phrase card (same tile style as words).
 * The picture shows the SITUATION, not the words. Grammar and filler words («ass», «typ», «du not De»)
 * have no honest picture, so they get none.
 */
export const PHRASE_PICTURES: Record<string, string> = {
  halla: "👋", "skjer-a": "🤙", digg: "😋", sykt: "🤯", kjempe: "💪", chille: "🛋️", laettis: "😂",
  snakkes: "👋", "takk-for-sist": "🤗", "jeg-lurer-pa": "🤔", "gidder-ikke": "🥱", kos: "🕯️", "ha-det": "👋",
  gjerne: "🙂", unnskyld: "🙇", "en-gang-til": "🔁", saktere: "🐢", greit: "👌", "bare-hyggelig": "😊",
  "takk-for-maten": "🍽️", jo: "✅", uff: "😟", fett: "😎", kjipt: "😞", kompis: "🧑‍🤝‍🧑", "vil-gjerne": "🙋",
  mvh: "✉️", dessverre: "📅", "hvordan-gar-det": "🙂", "bra-takk": "👍", "kan-jeg-fa": "☕", "vaer-sa-snill": "🙏",
  "vaer-sa-god": "🤲", "takk-i-like-mate": "🔄", "god-helg": "🎉", "ha-en-fin-dag": "🌞", "beklager-sen": "⏰",
  "jeg-forstar-ikke": "😕", "hva-betyr": "❓", "hvor-er": "🧭", "hva-koster": "🏷️", "jeg-heter": "📛",
  "hyggelig-a-mote": "🤝", "det-gar-fint": "👌", "null-stress": "😌", "kos-deg": "🥳", "god-bedring": "🤒",
  gratulerer: "🎂", "jeg-ringer-fordi": "📞", "jeg-gleder-meg": "🤩", "det-gjor-ikke-noe": "🙂", "det-ordner-seg": "🌈",
  "har-du-lyst": "💬", "blir-du-med": "🙌", "hva-driver-du-med": "💼", "kjor-pa": "🚀", "helt-konge": "👑",
  aesj: "🤢", "nei-sa-hyggelig": "😃", skal: "🥂", "lykke-til": "🍀", "takk-for-i-dag": "🏁", ses: "✌️",
  "jeg-viser-til": "📄", "kunne-du": "🙏", "jeg-trenger-hjelp": "🆘", "jeg-har-vondt-i": "🤕", "har-dere": "🏪",
  "jeg-bare-ser": "👀", "kan-jeg-betale-med-vipps": "📱", "jeg-er-pa-vei": "🏃", hae: "😮", "ikke-sant": "💯",
  "sann-passe": "🤷", herlig: "😍", skikkelig: "⬆️", "jeg-skal-tenke-pa-det": "💭", "kan-du-sende-meg": "📧",
  "vi-hores": "📞", "helt-enig": "🤝", "ga-rett-pa-sak": "🎯", "vann-over-hodet": "🌊", "to-fluer": "🪰",
  "trakke-i-salaten": "🥗", "legge-seg-flat": "🙇", "midt-i-smoroyet": "🧈", "snakke-rett-fra-levra": "🗣️",
  "det-sitter-langt-inne": "😣", "ikke-for-a-skryte": "😏", "na-snakker-vi": "🍕", "det-er-bare-a-sette-i-gang": "▶️",
};

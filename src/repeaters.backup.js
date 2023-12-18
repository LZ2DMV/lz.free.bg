var addressPoints = [
  //[42.63694, 23.24388, "LZ0ATV", "<b>LZ0ATV</b>, София - хотел Копито<br/><br/>Надморска височина: 1326 м<br/>QTH: KN12OP<br/><br/><hr><center>RX: <b>439.425</b> MHz<br/>TX: <b>431.825</b> MHz<br/>Тон: <b>79.7</b></center>","София - хотел Копито",["https://i.imgur.com/CcNd2mc.png", "41.73762", "22.02141", "43.53626", "24.46635"]],
  [42.63689, 23.24388, "LZ0TUK", "<b>LZ0TUK</b>, КРТЦ Копитото - София<br/><br/>Надморска височина: 1345 м<br/>QTH: KN12OP<br/>EchoLink #: <b>438100</b><br/><br/><hr><center>RX: <b>438.100</b> MHz<br/>TX: <b>430.500</b> MHz<br/>Тон: <b>79.7</b></center>", "КРТЦ Копитото - София"],
  [42.179336, 23.585146, "LZ0BGM", "<b>LZ0BGM</b>, връх Мусала<br/><br/>Надморска височина: 2925 м<br/>QTH: KN12TE<br/>EchoLink #: <b>6112</b><br/><br/><hr><center>RX: <b>439.300</b> MHz<br/>TX: <b>431.700</b> MHz<br/>Тон: <b>79.7</b></center>", "връх Мусала", ["https://i.imgur.com/SODrI6Q.png", "39.42111", "19.94443", "44.82196", "27.2259"]], //<br/><br/>+ радиолинк с <a href='?callsign=LZ0BGN'><b>LZ0BGN</b></a>, <a href='?callsign=LZ0BGY'><b>LZ0BGY</b></a>, <a href='?callsign=LZ0UHF'><b>LZ0UHF</b></a>, <a href='?callsign=LZ0PRS'><b>LZ0PRS</b></a>, <a href='?callsign=LZ0BGR'><b>LZ0BGR</b></a> и <a href='?callsign=LZ0DOE'><b>LZ0DOE</b></a><br/><i>за изкл. на линка - DTMF 300, за вкл. - DTMF 300 #</i>
  [43.133355, 23.118725, "LZ0BGN", "<b>LZ0BGN</b>, НУРТС - връх Петрохан<br/><br/>Надморска височина: 1638 м<br/>QTH: KN13ND<br/><br/><hr><center>RX: <b>439.200</b> MHz<br/>TX: <b>431.600</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - връх Петрохан", ["https://i.imgur.com/shnIOBt.png", "42.23403", "21.88638", "44.03268", "24.35107"]],
  [42.717692, 24.917145, "LZ0BOT", "<b>LZ0BOT</b>, НУРТС - Ботев връх<br/><br/>Надморска височина: 2376 м<br/>QTH: KN22LR<br/>Тип: <b>R2</b>, <img src='bulgaria-icon.png' title='Ретранслатор с национално значение'><br/>EchoLink #: <b>9870</b><br/><br/><hr><center>RX: <b>145.650</b> MHz<br/>TX: <b>145.050</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Ботев връх", ["https://i.imgur.com/MoIiMae.png", "40.01973", "21.24497", "45.41566", "28.58932"]],
  [42.717692, 24.917145, "LZ0HAM", "<b>LZ0HAM</b>, НУРТС - Ботев връх</font><br/><br/>Надморска височина: 2376 м<br/>QTH: KN22LR<br/><br/><hr><center>RX: <b>439.500</b> MHz<br/>TX: <b>431.900</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - Ботев връх"],
  [42.63694, 23.24388, "LZ0CBK", "<b>LZ0CBK</b>, Хотел Копитото<br/><br/>Надморска височина: 1303 м<br/>QTH: KN12OP<br/><br/><hr><center>RX: <b>438.600</b> MHz<br/>TX: <b>431.000</b> MHz<br/>Тон: <b>няма</b></center>", "Хотел Копитото"],
  [42.563833, 23.278667, "LZ0BGR", "<b>LZ0BGR</b>, София - връх Черни връх<br/><br/>Надморска височина: 2272 м<br/>QTH: KN12PN<br/>EchoLink #: <b>439000</b><br/><br/><hr><center>RX: <b>439.000</b> MHz<br/>TX: <b>431.400</b> MHz<br/>Тон: <b>79.7</b></center>", "София - връх Черни връх", ["https://i.imgur.com/bp17TOL.png", "39.80493", "19.61556", "45.20591", "26.94877"]],
  //[42.786713, 25.96007, "LZ0CHM", "<b>LZ0CHM</b>, Сливен - хижа Чумерна<br/><br/>Надморска височина: 1379 м<br/>QTH: KN22XS<br/><br/><hr><center>RX: <b>439.375</b> MHz<br/>TX: <b>431.775</b> MHz<br/>Тон: <b>79.7</b></center>","Сливен - хижа Чумерна"],
  [42.78217, 25.97307, "LZ0CUM", "<b>LZ0CUM</b>, Сливен - връх Чумерна<br/><br/>Надморска височина: 1379 м<br/>QTH: KN22XS<br/>Тип: <b>R3</b>, <img src='bulgaria-icon.png' title='Ретранслатор с национално значение'><br/><br/><hr><center>RX: <b>145.675</b> MHz<br/>TX: <b>145.075</b> MHz<br/>Тон: <b>няма</b></center>", "Сливен - хижа Чумерна"], //["https://i.imgur.com/4u51C5h.png", "41.88739", "24.73465", "43.68604", "27.18549"] //42.786713, 25.96007
  [42.688614, 23.356331, "LZ0TRI", "<b>LZ0TRI</b>, София - кв. Редута<br/><br/>Надморска височина: 582 м<br/>QTH: KN12QQ<br/>Тип: <b>R3</b><br/><br/><hr><center>RX: <b>145.675</b> MHz<br/>TX: <b>145.075</b> MHz<br/>Тон: <b>няма</b></center>", "София - кв. Редута"],
  [41.3470492, 23.1881941, "LZ0KON", "<b>LZ0KON</b>, хижа „Конгур“, Беласица, над гр. Петрич<br/><br/>Надморска височина: 1283 м<br/>QTH: KN11OI<br/>Тип: <b>R4</b><br/><br/><hr><center>RX: <b>145.700</b> MHz<br/>TX: <b>145.100</b> MHz<br/>Тон: <b>79.7</b></center>", "Беласица - гр. Петрич", ["https://i.imgur.com/youbMP6.png", "38.59081", "19.59437", "43.99137", "26.78202"]],
  [42.6495, 23.249, "LZ0FSB", "<b>LZ0FSB</b>, София - кв. Бояна<br/><br/>Надморска височина: 795 м<br/>QTH: KN12OP<br/><br/><hr><center>RX: <b>439.150</b> MHz<br/>TX: <b>431.550</b> MHz<br/>Тон: <b>85.4</b></center>", "София - кв. Бояна"],
  [41.570715, 23.612873, "LZ0ORL", "<b>LZ0ORL</b>, НУРТС - връх Ореляк - Гоце Делчев<br/><br/>Надморска височина: 2069 м<br/>QTH: KN11TN<br/>EchoLink #: <b>508360</b><br/>Тип: <b>R7</b><br/><br/><hr><center>RX: <b>145.775</b> MHz<br/>TX: <b>145.175</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - връх Ореляк - Гоце Делчев", ["https://i.imgur.com/iIjy8GN.png", "38.81399", "20.00663", "44.21463", "27.22612"]],
  [42.000116, 24.727505, "LZ0GEO", "<b>LZ0GEO</b>, Пловдив - стъкларски завод до хижа Здравец<br/><br/>Надморска височина: 1281 м<br/>QTH: KN22IA<br/><br/><hr><center>RX: <b>438.900</b> MHz<br/>TX: <b>431.300</b> MHz<br/>Тон: <b>74.4</b></center>", "Пловдив - стъкларски завод до хижа Здравец"],
  [41.9395, 25.55533, "LZ0HAS", "<b>LZ0HAS</b>, Хасково<br/><br/>Надморска височина: 212 м<br/>QTH: KN21SW<br/><br/><hr><center>RX: <b>439.350</b> MHz<br/>TX: <b>431.750</b> MHz<br/>Тон: <b>79.7</b></center>", "Хасково"],
  [42.8100, 23.4266, "LZ0IOS", "<b>LZ0IOS</b>, село Русиа (до Кремиковци)<br/><br/>Надморска височина: 680 м<br/>QTH: KN12RT<br/><br/><hr><center>RX: <b>439.075</b> MHz<br/>TX: <b>431.475</b> MHz<br/>Тон: <b>79.7</b></center>", "село Русиа (до Кремиковци)"],
  [41.671886, 25.40484, "LZ0IVA", "<b>LZ0IVA</b>, Кърджали<br/><br/>Надморска височина: 599 м<br/>QTH: KN12RT<br/><br/><hr><center>RX: <b>439.325</b> MHz<br/>TX: <b>431.725</b> MHz<br/>Тон: <b>91.5</b></center>", "Кърджали"],
  [42.8755, 25.3073, "LZ0KAC", "<b>LZ0KAC</b>, Габрово<br/><br/>Надморска височина: 530 м<br/>QTH: KN22PV<br/>EchoLink #: <b>307150</b><br/>Тип: <b>R0</b><br/><br/><hr><center>RX: <b>145.600</b> MHz<br/>TX: <b>145.000</b> MHz<br/>Тон: <b>няма</b></center>", "Габрово", ["https://i.imgur.com/vYdMKnm.png", "41.51132", "23.46669", "44.20994", "27.14824"]], //["https://i.imgur.com/xSsNUJQ.png", "40.11582", "21.62587", "45.51692", "28.98896"]
  [43.43750, 23.3044, "LZ0KOM", "<b>LZ0KOM</b>, м. Пъстрина, над Монтана<br/><br/>Надморска височина: 563 м<br/>QTH: KN13OJ<br/>EchoLink #: <b>694038</b><br/>Тип: <b>R7</b><br/><br/><hr><center>RX: <b>145.775</b> MHz<br/>TX: <b>145.175</b> MHz<br/>Тон: <b>няма</b></center>", "м. Пъстрина, над Монтана"],
  [42.690105, 23.307299, "LZ0MAI", "<b>LZ0MAI</b>, София - болница Пирогов<br/><br/>Надморска височина: 568 м<br/>QTH: KN12PQ<br/><br/><hr><center>RX: <b>439.575</b> MHz<br/>TX: <b>431.975</b> MHz<br/>Тон: <b>няма</b></center>", "София - болница Пирогов"],
  [42.754369, 25.305835, "LZ0MAR", "<b>LZ0MAR</b>, НУРТС - връх Шипка - Габрово<br/><br/>Надморска височина: 1284 м<br/>QTH: KN22PS<br/>EchoLink #: <b>309503</b><br/><br/><hr><center>RX: <b>439.125</b> MHz<br/>TX: <b>431.525</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - връх Шипка - Габрово", ["https://i.imgur.com/FG6VeIs.png", "39.99501", "21.6314", "45.39606", "28.98009"]],
  [42.852073, 23.270673, "LZ0MSS", "<b>LZ0MSS</b>, София - Балша<br/><br/>Надморска височина: 674 м<br/>QTH: KN12PU<br/><br/><hr><center>RX: <b>438.850</b> MHz<br/>TX: <b>431.250</b> MHz<br/>Тон: <b>85.4</b></center>", "София - Балша"],
  [41.6368423, 24.6794481, "LZ0NAO", "<b>LZ0NAO</b>, НУРТС - връх Снежанка<br/><br/>Надморска височина: 2082 м<br/>QTH: KN21IP<br/>Тип: <b>R15</b><br/><br/><hr><center>RX: <b>145.375</b> MHz<br/>TX: <b>144.775</b> MHz<br/>Тон: <b>91.5</b></center>", "НУРТС - връх Снежанка", ["https://i.imgur.com/w7yYY4S.png", "44.28063", "28.28939", "38.87997", "21.06951"]],
  [42.137093, 24.731789, "LZ0PLD", "<b>LZ0PLD</b>, Пловдив - Джендем тепе<br/><br/>Надморска височина: 257 м<br/>QTH: KN22ID<br/>EchoLink #: <b>493997</b><br/><br/><hr><center>RX: <b>438.800</b> MHz<br/>TX: <b>431.200</b> MHz<br/>Тон: <b>79.7</b></center>", "Пловдив - Джендем тепе"],
  [43.2382, 25.3067, "LZ0PLK", "<b>LZ0PLK</b>, Павликени<br/><br/>Надморска височина: 292 м<br/>QTH: KN23PD<br/>EchoLink #: <b>733137</b><br/><br/><hr><center>RX: <b>439.425</b> MHz<br/>TX: <b>431.825</b> MHz<br/>Тон (RX+TX): <b>103.5</b></center>", "Павликени"],
  [43.556500, 26.53400, "LZ0RAZ", "<b>LZ0RAZ</b>, НУРТС - Разград<br/><br/>Надморска височина: 420 м<br/>QTH: KN33GN<br/><br/><hr><center>RX: <b>439.100</b> MHz<br/>TX: <b>431.500</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - Разград"],
  [42.467398, 27.400068, "LZ0RCB", "<b>LZ0RCB</b>, Бургас - м. Чиплака<br/><br/>Надморска височина: 134 м<br/>QTH: KN32QL<br/>Тип: <b>R0</b><br/><br/><hr><center>RX: <b>145.600</b> MHz<br/>TX: <b>145.000</b> MHz<br/>Тон: <b>няма</b></center>", "Бургас - м. Чиплака", ["https://i.imgur.com/ooGzBtS.png", "39.70872", "23.74261", "45.10965", "31.05752"]],
  [42.467398, 27.400068, "LZ0RDB", "<b>LZ0RDB</b>, Бургас - м. Чиплака<br/><br/>Надморска височина: 134 м<br/>QTH: KN32QL<br/><br/><hr><center>RX: <b>439.200</b> MHz<br/>TX: <b>431.600</b> MHz<br/>Тон: <b>79.7</b></center>", "Бургас - м. Чиплака", ["https://i.imgur.com/rdoyn5d.png", "39.70872", "23.74261", "45.10965", "31.05752"]],
  [43.548885, 27.816214, "LZ0RHA", "<a href='http://lz4ha.com/joomla/my-constructions/67' target='_blank'><b>LZ0RHA</b></a>, НУРТС - гр. Добрич<br/><br/>Надморска височина: 261 м<br/>QTH: KN33VN<br/>EchoLink #: <b>743445</b><br/><br/><hr><center>RX: <b>438.800</b> MHz<br/>TX: <b>431.200</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - гр. Добрич"], //["https://i.imgur.com/0kjQiyQ.png", "42.69348", "26.62729", "44.49212", "29.11071"]],
  [43.548885, 27.816214, "LZ0RNA", "<a href='http://lz4ha.com/joomla/my-constructions/83' target='_blank'><b>LZ0RNA</b></a>, НУРТС - гр. Добрич<br/><br/>Надморска височина: 261 м<br/>QTH: KN33VN<br/>Тип: <b>R5</b><br/><br/><hr><center>RX: <b>145.725</b> MHz<br/>TX: <b>145.125</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - гр. Добрич"], //["https://i.imgur.com/x0p15Tg.png", "41.72703", "25.3362", "45.32592", "30.2998"]],
  [43.1022, 25.6750, "LZ0ARB", "<b>LZ0ARB</b>, с. Арбанаси -  Радиопредавателен център „Резонанс“<br/><br/>Надморска височина: 420 м<br/>QTH: KN23UC<br/>EchoLink #: <b>351225</b><br/><br/><hr><center>RX: <b>439.450</b> MHz<br/>TX: <b>431.850</b> MHz<br/>Тон: <b>няма</b></center>", "с. Арбанаси", ["https://i.imgur.com/Tc773TM.png", "40.40424", "21.97985", "45.80016", "29.37015"]],
  [43.1247, 25.6669, "LZ0RGO", "<b>LZ0RGO</b>, Горна Оряховица - вила „Раховец“ - crossband<br/><br/>Надморска височина: 332 м<br/>QTH: KN23UC<br/><br/><hr><center>RX: <b>145.575</b> MHz<br/>TX: <b>438.025</b> MHz<br/>Тон: <b>няма</b></center>", "Горна Оряховица - crossband", ["https://i.imgur.com/Lk3Qhgf.png", "40.36453", "21.97039", "45.76571", "29.37094"]], //["https://i.imgur.com/Lk3Qhgf.png", "40.36453", "21.97039", "45.76571", "29.36341"]
  [42.287, 22.6948, "LZ0RKN", "<b>LZ0RKN</b></a>, Кюстендил<br/><br/>Надморска височина: 510 м<br/>QTH: KN12HH<br/>Тип: <b>R13</b><br/><br/><hr><center>RX: <b>145.325</b> MHz<br/>TX: <b>144.725</b> MHz<br/>Тон: <b>няма</b></center>", "Кюстендил", ["https://i.imgur.com/kDguFY7.png", "39.99711", "19.65566", "44.49657", "25.73394"]],
  [41.6368423, 24.6794481, "LZ0ROJ", "<b>LZ0ROJ</b>, НУРТС - връх Снежанка<br/><br/>Надморска височина: 2082 м<br/>QTH: KN21IP<br/><br/><hr><center>RX: <b>438.650</b> MHz<br/>TX: <b>431.050</b> MHz<br/>Тон: <b>91.5</b></center>", "НУРТС - връх Снежанка"],
  [44.101992, 27.258113, "LZ0RSL", "<b>LZ0RSL</b>, Силистра<br/><br/>Надморска височина: 196 м<br/>QTH: KN34PC<br/>Тип: <b>R7</b><br/><br/><hr><center>RX: <b>145.775</b> MHz<br/>TX: <b>145.175</b> MHz<br/>Тон: <b>няма</b></center>", "Силистра", ["https://i.imgur.com/LWBfVGi.png", "42.27513", "24.7534", "45.87409", "29.76283"]],
  [43.8244, 25.9577, "LZ0RUS", "<b>LZ0RUS</b>, Русе<br/><br/>Надморска височина: 145 м<br/>QTH: KN23XT<br/>EchoLink #: <b>8223</b><br/>Тип: <b>R1</b><br/><br/><hr><center>RX: <b>145.625</b> MHz<br/>TX: <b>145.025</b> MHz<br/>Тон: <b>няма</b></center>", "Русе", ["https://i.imgur.com/qRUY20h.png", "41.06263", "22.21814", "46.46408", "29.69726"]],
  [42.79857, 27.65553, "LZ0SEA", "<b>LZ0SEA</b>, НУРТС - връх Еделвайс - Слънчев бряг<br/><br/>Надморска височина: 513 м<br/>QTH: KN32TT<br/>EchoLink #: <b>439100</b><br/><br/><hr><center>RX: <b>439.100</b> MHz<br/>TX: <b>431.500</b> MHz<br/>Тон: <b>79.7</b></center>", "връх Еделвайс - Слънчев бряг", ["https://i.imgur.com/HPIo53r.png", "40.03915", "23.97856", "45.44020", "31.3325"]], //["https://i.imgur.com/MgIp8L1.png", "40.10061", "23.97856", "45.49653", "31.3325"]
  [42.71474700, 26.36412900, "LZ0SLU", "<b>LZ0SLU</b>, НУРТС - м-т Карандила - Сливен<br/><br/>Надморска височина: 1033 м<br/>QTH: KN32ER<br/>Тип: <b>R74</b><br/><br/><hr><center>RX: <b>438.750</b> MHz<br/>TX: <b>431.150</b> MHz<br/>Тон: <b>79.7</b></center>", "НУРТС - Карандила"],
  [42.71474700, 26.36412900, "LZ0SLV", "<b>LZ0SLV</b>, НУРТС - м-т Карандила - Сливен<br/><br/>Надморска височина: 1033 м<br/>QTH: KN32ER<br/>EchoLink #: <b>222848</b><br/>Тип: <b>R4</b><br/><br/><hr><center>RX: <b>145.700</b> MHz<br/>TX: <b>145.100</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Карандила", ["https://i.imgur.com/G4iEn8B.png", "40.01678", "22.69213", "45.41271", "30.03613"]],
  [43.2523, 26.9275, "LZ0SMM", "<b>LZ0SMM</b>, Шумен<br/><br/>Надморска височина: 464 м<br/>QTH: KN33LG<br/><br/><hr><center>RX: <b>145.350</b> MHz<br/>TX: <b>144.750</b> MHz<br/>Тон: <b>няма</b></center>", "Шумен", ["https://i.imgur.com/6cUjBj9.png", "40.49185", "23.22325", "45.89307", "30.63928"]],
  [43.251373, 26.926219, "LZ0SMN", "<b>LZ0SMN</b>, Шумен<br/><br/>Надморска височина: 455 м<br/>QTH: KN33LG<br/><br/><hr><center>RX: <b>438.700</b> MHz<br/>TX: <b>431.100</b> MHz<br/>Тон: <b>91.5</b></center>", "Шумен", ["https://i.imgur.com/K74b0HK.png", "40.49092", "23.22203", "45.89215", "30.63941"]],
  [41.5601, 24.6830, "LZ0SMO", "<b>LZ0SMO</b>, Смолян - Кайнадина<br/><br/>Надморска височина: 1608 м<br/>QTH: KN21IN<br/>EchoLink #: <b>805934</b><br/>Тип: <b>R0</b><br/><br/><hr><center>RX: <b>145.600</b> MHz<br/>TX: <b>145.000</b> MHz<br/>Тон: <b>91.5</b></center>", "Смолян - Кайнадина", ["https://i.imgur.com/hkAxPtX.png", "38.80340", "21.07735", "44.20403", "28.28865"]],
  [41.44343, 25.48219, "LZ0STV", "<b>LZ0STV</b>, НУРТС - връх Стръмни Рид<br/><br/>Надморска височина: 991 м<br/>QTH: KN21RK<br/>Тип: <b>RV26</b><br/><br/><hr><center>RX: <b>145.325</b> MHz<br/>TX: <b>144.725</b> MHz<br/>Тон: <b>няма</b></center>", "връх Стръмни Рид", ["https://i.imgur.com/sC6sYwQ.png", "38.68698", "21.88303", "44.08758", "29.08135"]],
  [42.622180, 23.260018, "LZ0UHF", "<b>LZ0UHF</b>, Витоша - София<br/><br/>Надморска височина: 1461 м<br/>QTH: KN12OP<br/>EchoLink #: <b>439400</b><br/><br/><hr><center>RX: <b>439.400</b> MHz<br/>TX: <b>431.800</b> MHz<br/>Тон: <b>79.7</b></center>", "Витоша - София"],
  [42.622180, 23.260018, "LZ0VHF", "<b>LZ0VHF</b>, Витоша - София<br/><br/>Надморска височина: 1461 м<br/>QTH: KN12OP<br/>Тип: <b>R0</b><br/><br/><hr><center>RX: <b>145.600</b> MHz<br/>TX: <b>145.000</b> MHz<br/>Тон: <b>няма</b></center>", "Витоша - София"],
  [43.235984, 27.945579, "LZ0VAR", "<b>LZ0VAR</b>, НУРТС - Франгата - Варна<br/><br/>Надморска височина: 299 м<br/>QTH: KN33XF<br/>Тип: <b>R7</b><br/><br/><hr><center>RX <b><font color='red'>* </font></b>: <b>145.775</b> MHz<br/>TX: <b>145.175</b> MHz<br/>Crossband вход: <b>430.340 MHz</b><br/>Тон: <b>няма</b><br/><br/><b><font color='red'>* </font></b>Приемникът е разделен от предавателя и се намира в кв. Галата, на локацията на <a href='#' onclick='map.closePopup(); searchLayers(\"LZ0VNA\");'><b>LZ0VNA</b></a>.<br/>Свързан е с R7 през crossband входа на <b>430.340 MHz</b> (2 W).</center>", "Франгата - Варна"],
  [43.22, 23.55417, "LZ0VRC", "<b>LZ0VRC</b>, Враца<br/><br/>Надморска височина: 339 м<br/>QTH: KN13SF<br/><br/><hr><center>RX: <b>439.150</b> MHz<br/>TX: <b>431.550</b> MHz<br/>Тон: <b>79.7</b></center>", "Враца"],
  [43.1640, 27.9040, "LZ0RDP", "<b>LZ0RDP</b>, Варна - кв. Боровец<br/><br/>Надморска височина: 180 м<br/>QTH: KN33WD<br/><br/><hr><center>RX: <b>439.000</b> MHz<br/>TX: <b>431.400</b> MHz<br/>Тон: <b>няма</b><br/><br/>Zello канал (само RX): <b>LZ0RDP</b>,<br/>парола - Userlz0rdp</center>", "Варна - кв.Боровец", ["https://i.imgur.com/YtQ4cwR.png", "40.40375", "24.20511", "45.80495", "31.60989"]],
  [42.000116, 24.727505, "LZ0VRF", "<b>LZ0VRF</b>, Пловдив - стъкларски завод до хижа Здравец<br/><br/>Надморска височина: 1281 м<br/>QTH: KN22IA<br/>Тип: <b>R5</b><br/><br/><hr><center>RX: <b>145.725</b> MHz<br/>TX: <b>145.125</b> MHz<br/>Тон: <b>няма</b></center>", "Пловдив - стъкларски завод до хижа Здравец"],
  [42.69024, 23.30735, "LZ0WAG", "<b>LZ0WAG</b>, София - болница Пирогов<br/><br/>Надморска височина: 568 м<br/>QTH: KN22IA<br/>EchoLink #: <b>291915</b><br/>Тип: <b>RV28 (R14)</b><br/><br/><hr><center>RX: <b>145.350</b> MHz<br/>TX: <b>144.750</b> MHz<br/>Тон: <b>няма</b></center>", "София - болница Пирогов"],
  //[43.154318, 23.584261, "LZ0WOL", "<b>LZ0WOL</b></a>, Враца<br/><br/>Надморска височина: 1049 м<br/>QTH: KN13TD<br/>Тип: <b>R4</b><br/><br/><hr><center>RX: <b>145.700</b> MHz<br/>TX: <b>145.100</b> MHz<br/>Тон: <b>няма</b></center>","Враца"],
  [43.093511, 27.378397, "LZ0RAB", "<b>LZ0RAB</b>, НУРТС - Рояк - Провадия<br/><br/>Надморска височина: 350 м<br/>QTH: KN33QC<br/>Тип: <b>R1</b><br/><br/><hr><center>RX: <b> 145.625</b> MHz<br/>TX: <b>145.025</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Рояк - Провадия", ["https://i.imgur.com/9lK3VqB.png", "41.72934", "25.53108", "44.42795", "29.22571"]],
  [42.563833, 23.278667, "LZ0DOE", "<b>LZ0DOE</b>, София - връх Черни връх<br/><br/>Надморска височина: 2260 м<br/>QTH: KN12PN<br/>EchoLink #: <b>6111</b><br/>Тип: <b>R1</b><br/><br/><hr><center>RX: <b> 145.625</b> MHz<br/>TX: <b>145.025</b> MHz<br/>Тон: <b>няма</b><br/><br/>+ радиолинк с <a href='?callsign=LZ0BGY'><b>LZ0BGY</b></a><br/><i>за изкл. на линка - DTMF 600, за вкл. - DTMF 600 #</i></center>", "София - връх Черни връх", ["https://i.imgur.com/EyBqfYZ.png", "39.80493", "19.61556", "45.20591", "26.94877"]],
  [42.179166, 23.585166, "LZ0ZAA", "<b>LZ0ZAA</b>, връх Мусала<br/><font color='red'>(временно неактивен)</font><br/><br/>Надморска височина: 2925 м<br/>QTH: KN12TE<br/>Тип: <b>R6</b><br/><br/><hr><center>RX: <b>145.750</b> MHz<br/>TX: <b>145.150</b> MHz<br/>Тон: <b>няма</b></center>", "връх Мусала"],
  [43.0625, 25.625, "LZ0TNW", "<b>LZ0TNW</b>, Велико Търново - частен дом<br /><br/>Надморска височина: 220 м<br/>QTH: KN23TB<br/>Тип: <b>R7</b><br/><br/><hr><center>RX: <b>145.775</b> MHz<br/>TX: <b>145.175</b> MHz<br/>Тон: <b>няма</b><br/><br/>+ <b>двупосочен crossband</b><br/><b>145.775 MHz</b> <-> <b>431.025 MHz</b></center>", "Велико Търново"],
  [42.045899, 25.577803, "LZ0DIM", "<b>LZ0DIM</b>, Димитровград<br/><br/>Надморска височина: 134 м<br/>QTH: KN21SB<br/><br/><hr><center>RX: <b>439.475</b> MHz<br/>TX: <b>431.875</b> MHz<br/>Тон: <b>няма</b></center>", "Димитровград"],
  [43.04222, 24.06361, "LZ0BGY", "<b>LZ0BGY</b>, връх Драгоица, над гр. Ябланица<br/><br/>Надморска височина: 956 м<br/>QTH: KN23AA<br/><br/><hr><center>RX: <b>439.600</b> MHz<br/>TX: <b>432.000</b> MHz<br/>Тон: <b>79.7</b><br/><br/>+ радиолинк с <a href='?callsign=LZ0DOE'><b>LZ0DOE</b></a></center>", "връх Драгоица, над гр. Ябланица", ["https://i.imgur.com/7lzLg8G.png", "40.28225", "20.37207", "45.68339", "27.75515"]],
  //[41.929667, 24.680667, "LZ0PRS", "<b>LZ0PRS</b>, м. Бяла черква, Родопи<br/><br/>Надморска височина: 1600 м<br/>QTH: KN21IW<br/><br/><hr><center>RX: <b>438.400</b> MHz<br/>TX: <b>430.800</b> MHz<br/>Тон: <b>79.7</b></center>","м. Бяла черква, Родопи", ["https://i.imgur.com/dByghM0.png", "39.64031", "21.65862", "44.13971", "27.70272"]],
  [42.657709, 24.804253, "LZ0BSK", "<b>LZ0BSK</b>, гр. Карлово - водна електроцентрала<br/><br/>Надморска височина: 830 м<br/>QTH: KN22JP<br/><br/><hr><center>RX: <b>438.850</b> MHz<br/>TX: <b>431.250</b> MHz<br/>Тон: <b>няма</b></center>", "гр. Карлово - водна електроцентрала", ["https://i.imgur.com/BMLxo4S.png", "40.83227", "22.3585", "44.43107", "27.25001"]],
  [41.77083, 23.45833, "LZ0BAN", "<b>LZ0BAN</b>, Банско - връх Тодорка<br/><br/>Надморска височина: 1715 м<br/>QTH: KN11RS<br/><br/><hr><center>RX: <b>439.150</b> MHz<br/>TX: <b>431.550</b> MHz<br/>Тон: <b>79.7</b></center>", "Банско - връх Тодорка"],
  [42.002577, 24.878003, "LZ0ASG", "<b>LZ0ASG</b>, Асеновград - хълм, южно над града<br/><br/>Надморска височина: 328 м<br/>QTH: KN22KA<br/><br/><hr><center>RX: <b>439.600</b> MHz<br/>TX: <b>432.000</b> MHz<br/>Тон: <b>79.7</b></center>", "Асеновград"],
  //[42.308234, 27.759274, "LZ0ESE", "<b>LZ0ESE</b></a>, Приморско - връх Китка<br/><br/>Надморска височина: 214.7 м<br/>QTH: KN32VH<br/><br/><hr><center>RX: <b>439.125</b> MHz<br/>TX: <b>431.525</b> MHz<br/>Тон: <b>79.7</b></center>","Приморско - връх Китка", ["https://i.imgur.com/dcPhAet.png", "39.54933", "24.10967", "44.95022", "31.40599"]],
  [41.733941, 23.524224, "LZ0HIT", "<b>LZ0HIT</b>, гр. Добринище - хижа Безбог<br/><br/>Надморска височина: 2240 м<br/>QTH: KN11SR<br/>Тип: <b>RV63</b><br/><br/><hr><center>RX: <b>145.7875</b> MHz<br/>TX: <b>145.1875</b> MHz<br/>Тон: <b>79.7</b></center>", "гр. Добринище - хижа Безбог", ["https://i.imgur.com/oHyMeNe.png", "38.97686", "19.90883", "44.37755", "27.13962"]],

]

var DStarPoints = [
  [43.2528, 26.9277, "LZ0DAH", "<b>LZ0DAH</b>, Шумен<br/><br/>Надморска височина: 470 м<br/>QTH: KN33LG<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.400</b> MHz<br/>TX: <b>430.800</b> MHz<br/>Тон: <b>няма</b></center>", "Шумен"],
  [42.636978, 23.243964, "LZ0DAA", "<b>LZ0DAA</b>, НУРТС - София - Копитото<br/><br/>Надморска височина: 1327 м<br/>QTH: KN12OP<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.525</b> MHz<br/>TX: <b>430.925</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - София - Копитото"],
  [42.636978, 23.243964, "LZ0DAB", "<b>LZ0DAB</b>, НУРТС - София - Копитото<br/><br/>Надморска височина: 1327 м<br/>QTH: KN12OP<br/>EchoLink #: <b>5888</b><br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.550</b> MHz<br/>TX: <b>430.950</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - София - Копитото"],
  [42.798833, 27.654926, "LZ0DAD", "<b>LZ0DAD</b>, НУРТС - вр.Еделвайс - Слънчев бряг<br/><br/>Надморска височина: 513 м<br/>QTH: KN32TT<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font> + <font color='blue'>DMR</font></b><br /><br />RX: <b>438.500</b> MHz<br/>TX: <b>430.900</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - вр.Еделвайс - Слънчев бряг"],
  [42.1167, 27.8517, "LZ0DAF", "<b>LZ0DAF</b>, връх Папия<br/><br/>Надморска височина: 550 м<br/>QTH: KN32WC<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font> + <font color='blue'>DMR</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>", "връх Папия"],
  //[42.735250, 22.906839, "LZ0DAM", "<b>LZ0DAM</b>, Брезник<br/><br/>Надморска височина: 823 м<br/>QTH: KN12OP92SP<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>","Брезник"],
  [41.5705, 23.6132, "LZ0DAO", "<b>LZ0DAO</b>, връх Ореляк<br/><br/>Надморска височина: 2075 м<br/>QTH: KN11TN<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>", "връх Ореляк"],
  [41.9968, 24.7202, "LZ0DAP", "<b>LZ0DAP</b>, НУРТС - Здравец - Пловдив<br/><br/>Надморска височина: 1290 м<br/>QTH: KN21IX69KE<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.500</b> MHz<br/>TX: <b>430.900</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Здравец - Пловдив"],
  [41.7579, 23.4349, "LZ0DAT", "<b>LZ0DAT</b>, връх Тодорка<br/><br/>Надморска височина: 2523 м<br/>QTH: KN12RS<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.525</b> MHz<br/>TX: <b>431.925</b> MHz<br/>Тон: <b>няма</b></center>", "връх Тодорка"],
  [43.235984, 27.945579, "LZ0DAV", "<b>LZ0DAV</b>, НУРТС - Франгата - Варна<br/><br/>Надморска височина: 452 м<br/>QTH: KN33XF<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.550</b> MHz<br/>TX: <b>430.950</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Франгата - Варна"],
  //[41.9000, 25.2994, "LZ0DAX", "<b>LZ0DAX</b>, НУРТС - Аида - Хасково<br/><br/>Надморска височина: 835 м<br/>QTH: KN21PV<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.350</b> MHz<br/>TX: <b>438.350</b> MHz<br/>Тон: <b>няма</b></center>","НУРТС - Аида - Хасково"],
  [42.46736, 27.40006, "LZ0DBS", "<b>LZ0DBS</b>, Бургас - м. Чиплака<br/><br/>Надморска височина: 134 м<br/>QTH: KN32QL<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.600</b> MHz<br/>TX: <b>432.000</b> MHz<br/>Тон: <b>няма</b></center>", "Бургас - м. Чиплака"],
  [43.5565, 26.5340, "LZ0DRZ", "<b>LZ0DRZ</b>, НУРТС - Разград<br/><br/>Надморска височина: 375 м<br/>QTH: KN33GN<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Разград"],
  [42.56683, 23.28816, "LZ0DSR", "<b>LZ0DSR</b>, София - връх Черни връх<br/><br/>Надморска височина: 2267 м<br/>QTH: KN12PN<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.175</b> MHz<br/>TX: <b>431.575</b> MHz<br/>Тон: <b>няма</b></center>", "София - връх Черни връх"],
  [42.717605, 24.917091, "LZ0DVB", "<b>LZ0DVB</b>, НУРТС - Ботев връх<br/><br/>Надморска височина: 2376 м<br/>QTH: KN22LR<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.550</b> MHz<br/>TX: <b>431.950</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Ботев връх"],
  [42.5626, 23.2858, "LZ0SUN", "<b>LZ0SUN</b>, София - вр. Черни връх<br/><br/>Надморска височина: 2271 м<br/>QTH: KN12PN<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.425</b> MHz<br/>TX: <b>430.825</b> MHz<br/>Тон: <b>няма</b></center>", "София - вр. Черни връх"],
  //[42.4736, 25.6668, "LZ0DAC", "<b>LZ0DAC</b>, НУРТС - Хрищени - Стара Загора<br/><br/>Надморска височина: 630 м<br/>QTH: KN22UL<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>","НУРТС - Хрищени - Стара Загора", ["https://i.imgur.com/t6CoIXl.png", "39.71489", "22.00898", "45.11584", "29.32462"]],
  [42.7146, 26.3629, "LZ0DSN", "<b>LZ0DSN</b>, НУРТС - м-т Карандила - Сливен<br/><br/>Надморска височина: 1030 м<br/>QTH: KN32ER<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.550</b> MHz<br/>TX: <b>430.950</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Карандила"],
  [42.493661, 27.472127, "LZ0DBU", "<b>LZ0DBU</b>, Бургас<br/><br/>Надморска височина: ? м<br/>QTH: ?<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.525</b> MHz<br/>TX: <b>431.925</b> MHz<br/>Тон: <b>няма</b></center>", "Бургас"],
  [42.17919, 23.58528, "LZ0DAM", "<b>LZ0DAM</b>, връх Мусала<br/><br/>Надморска височина: ? м<br/>QTH: KN12TE<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>439.275</b> MHz<br/>TX: <b>431.675</b> MHz<br/>Тон: <b>няма</b><br/><br/>Линк към реф. <b>XLX-359</b> и <b>BM 284359</b>.</center>", "връх Мусала"],
  [43.7345, 23.9591, "LZ0DUN", "<b>LZ0DUN</b>, гр. Оряхово<br/><br/>Надморска височина: ? м<br/>QTH: KN13XR<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.800</b> MHz<br/>TX: <b>431.200</b> MHz<br/>Тон: <b>няма</b><br/><br/>Линк към реф. <b>XLX-359</b> и <b>BM 284359</b>.</center>", "гр. Оряхово"],
  [41.346500, 23.188333, "LZ0DPE", "<b>LZ0DPE</b>, над гр. Петрич<br/><br/>Надморска височина: 1300 м<br/>QTH: KN11OI<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.200</b> MHz<br/>TX: <b>430.600</b> MHz<br/>Тон: <b>няма</b><br/><br/>Линк към реф. <b>XLX-359</b> и <b>BM 284359</b>.</center>", "гр. Петрич", ["https://i.imgur.com/oa0ploT.png", "38.59026", "19.59454", "43.99082", "26.78213"]],
  [41.927876, 25.545318, "LZ0DAX", "<b>LZ0DAX</b>, НУРТС - Хасково<br/><br/>Надморска височина: 840 м<br/>QTH: KN21SW<br/><br/><hr><center>Режим: <b>цифров, <font color='green'>D-Star</font></b><br /><br />RX: <b>438.350</b> MHz<br/>TX: <b>430.750</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Хасково"],

]

var DMRPoints = [
  [42.63694, 23.24388, "LZ0ATV", "<b>LZ0ATV</b>, София - хотел Копито<br/><br/>Надморска височина: 1326 м<br/>QTH: KN12OP<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.425</b> MHz<br/>TX: <b>431.825</b> MHz<br/>Тон: <b>няма</b></center>", "София - хотел Копито", ["https://i.imgur.com/CcNd2mc.png", "41.73762", "22.02141", "43.53626", "24.46635"]],
  [42.717692, 24.917145, "LZ0HAM", "<b>LZ0HAM</b>, НУРТС - Ботев връх<br/><br/>Надморска височина: 2376 м<br/>QTH: KN22LR<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.500</b> MHz<br/>TX: <b>431.900</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Ботев връх"],
  [41.94, 25.55333, "LZ0SVV", "<b>LZ0SVV</b>, Хасково<br/><br/>Надморска височина: 252 м<br/>QTH: KN21SW<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>438.375</b> MHz<br/>TX: <b>430.775</b> MHz<br/>Тон: <b>няма</b></center>", "Хасково", ["https://i.imgur.com/Sf4ZK6D.png", "40.57643", "23.7398", "43.27500", "27.36686"]],
  [42.636978, 23.243964, "LZ0DMR", "<b>LZ0DMR</b>, НУРТС - Копитото - София<br/><br/>Надморска височина: 1327 м<br/>QTH: KN12OP<br/>EchoLink #: <b>4391</b><br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.100</b> MHz<br/>TX: <b>431.500</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Копитото - София"], //79.7
  [43.169122, 27.925275, "LZ0VDR", "<b>LZ0VDR</b>, Варна<br/><br/>Надморска височина: 123 м<br/>QTH: KN33XE<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>438.725</b> MHz<br/>TX: <b>431.125</b> MHz<br/>Тон: <b>няма</b></center>", "Варна", ["https://i.imgur.com/xtdYTTZ.png", "40.40884", "24.226", "45.81004", "31.6244"]],
  //[42.563833, 23.278667, "LZ0DDF", "<b>LZ0DDF</b>, Черни връх - станция ХМС<br/><br/>Надморска височина: 2239 м<br/>QTH: KN12PN<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.475</b> MHz<br/>TX: <b>431.875</b> MHz<br/>Тон: <b>няма</b></center>","Варна"],
  [41.996667, 24.720167, "LZ0ZAF", "<b>LZ0ZAF</b>, НУРТС - Здравец - Пловдив<br/><br/>Надморска височина: 1290 м<br/>QTH: KN21IX69KE<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>438.700</b> MHz<br/>TX: <b>431.100</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Здравец - Пловдив"],
  //[42.002709, 24.616888, "LZ0DLC", "<b>LZ0DLC</b>, с. Бойково - Пловдив<br/><br/>Надморска височина: 1100 м<br/>QTH: KN22HA<br/><br/><hr><center>Режим: <b>цифров + аналогов, <font color='blue'>DMR</font> и FM</b><br /><br />RX: <b>439.225</b> MHz<br/>TX: <b>431.625</b> MHz<br/>Тон (за аналоговия режим): <b>123.0</b></center>","с. Бойково - Пловдив"],
  [42.000116, 24.727505, "LZ0DLC", "<b>LZ0DLC</b>, Пловдив - стъкларски завод до хижа Здравец<br/><br/>Надморска височина: 1281 м<br/>QTH: KN22IA<br/><br/><hr><center>Режим: <b>цифров + аналогов, <font color='blue'>DMR</font> и FM</b><br /><br />RX: <b>439.225</b> MHz<br/>TX: <b>431.625</b> MHz<br/>Тон (за аналоговия режим): <b>123.0</b></center>", "Пловдив - стъкларски завод до хижа Здравец"],
  [42.3384, 24.2987, "LZ0RVA", "<b>LZ0RVA</b>, с. Сбор, Пазарджик<br/><br/>Надморска височина: 348 м<br/>QTH: KN22DI<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>438.950</b> MHz<br/>TX: <b>431.350</b> MHz<br/>Тон: <b>няма</b></center>", "с. Сбор, Пазарджик"],
  [42.6462, 23.2667, "LZ0XLX", "<b>LZ0XLX</b>, кв. Бояна, София<br/><br/>Надморска височина: 752 м<br/>QTH: KN12PP<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + <font color='purple'>Fusion</font></b><br /><br />RX: <b>438.625</b> MHz<br/>TX: <b>431.025</b> MHz<br/>Тон: <b>няма</b></center>", "кв. Бояна, София"],
  [43.8243, 25.9576, "LZ0DAR", "<b>LZ0DAR</b>, НУРТС - Русе<br/><br/>Надморска височина: 146 м<br/>QTH: KN23XT<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + <font color='purple'>Fusion</font> + <font color='green'>D-Star</font></b><br /><br />RX: <b>438.250</b> MHz<br/>TX: <b>430.650</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Русе", ["https://i.imgur.com/p1bceYA.png", "41.06253", "22.21804", "46.46397", "29.69715"]],
  [42.714385, 26.363366, "LZ0DDS", "<b>LZ0DDS</b>, НУРТС - м-т Карандила - Сливен<br/><br/>Надморска височина: 1033 м<br/>QTH: KN32ER<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + <font color='purple'>Fusion</font> + <font color='green'>D-Star</font></b><br /><br />RX: <b>439.625</b> MHz<br/>TX: <b>432.025</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - Карандила", ["https://i.imgur.com/DED3zuf.png", "40.88890", "23.91538", "44.48770", "28.81135"]],
  [43.1333, 23.1187, "LZ0DDA", "<b>LZ0DDA</b>, НУРТС - връх Петрохан<br/><br/>Надморска височина: 1651 м<br/>QTH: KN13ND<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + <font color='purple'>Fusion</font> + <font color='green'>D-Star</font></b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон: <b>няма</b></center>", "НУРТС - връх Петрохан", ["https://i.imgur.com/kZ4dSw1.png", "40.37312", "19.42167", "45.77430", "26.81573"]],
  [41.77194, 23.06388, "LZ0PRC", "<b>LZ0PRC</b>, РРТС Пъстрец (Алаборум)<br/><br/>Надморска височина: 1600 м<br/>QTH: KN11MS<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + аналогов (FM)</b><br /><br />RX: <b>439.100</b> MHz<br/>TX: <b>431.500</b> MHz<br/>Тон (аналог, RX+TX): <b>79.7</b></center>", "РРТС Пъстрец", ["https://i.imgur.com/uRE30OZ.png", "39.01477", "19.44635", "44.41548", "26.68141"]],
  [41.570715, 23.612873, "LZ0DGD", "<b>LZ0DGD</b>, връх Ореляк<br/><br/>Надморска височина: 2069 м<br/>QTH: KN11TN<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + аналогов (FM)</b><br /><br />RX: <b>438.450</b> MHz<br/>TX: <b>430.850</b> MHz<br/>Тон (аналог, RX+TX): <b>79.7</b><br/><br/>Мрежа DMR+ и XLX023.</center>", "връх Ореляк"],
  [42.181098, 24.932803, "LZ0PLC", "<b>LZ0PLC</b>, с. Маноле<br/><br/>Надморска височина: 210 м<br/>QTH: KN22LE<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + аналогов (FM)</b><br /><br />RX: <b>438.300</b> MHz<br/>TX: <b>430.700</b> MHz<br/>Тон (аналог, RX+TX): <b>123.0</b></center>", "с. Маноле"],
  [43.252521, 26.927662, "LZ0DDK", "<b>LZ0DDK</b>, Шумен<br/><br/>Надморска височина: 470 м<br/>QTH: KN33LG<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.575</b> MHz<br/>TX: <b>431.975</b> MHz<br/>Тон: <b>няма</b></center>", "Шумен"],
  [43.538240, 23.392920, "LZ0VLD", "<b>LZ0VLD</b>, с. Владимирово, обл. Монтана<br/><br/>Надморска височина: 138 м<br/>QTH: KN13QM<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font> + аналогов (FM)</b><br /><br />RX: <b>439.150</b> MHz<br/>TX: <b>431.550</b> MHz<br/>Тон (аналог): <b>79.7</b></center>", "с. Владимирово", ["https://i.imgur.com/tY4vG8U.png", "45.31083", "25.8741", "41.71194", "20.91174"]],
  [41.858164, 23.417976, "LZ0PNP", "<b>LZ0PNP</b>, м-т Бетоловото, Разлог<br/><br/>Надморска височина: 972 м<br/>QTH: KN11RU<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>438.350</b> MHz<br/>TX: <b>430.750</b> MHz<br/>Тон: <b>няма</b></center>", "м-т Бетоловото"],
  [43.56488, 27.8179, "LZ0DCH", "<a href='https://dobrich-ham.eu/repeaters/#dmr' target='_blank'><b>LZ0DCH</b></a>, ул. Панайот Хитов, Добрич<br/><br/>Надморска височина: 237 м<br/>QTH: KN33VN<br/><br/><hr><center>Режим: <b>цифров, <font color='blue'>DMR</font></b><br /><br />RX: <b>439.200</b> MHz<br/>TX: <b>431.600</b> MHz<br/>Тон: <b>няма</b></center>", "ул. Панайот Хитов, Добрич"],
]

var FusionPoints = [
  [43.1621, 27.9281, "LZ0VNA", "<b>LZ0VNA</b>, Варна - кв. Галата<br/><br/>Надморска височина: 169 м<br/>QTH: KN33XD29<br/><br/><hr><center>Режим: <b>цифров + аналогов, <font color='purple'>Fusion</font> и FM</b><br /><br />RX: <b>438.300</b> MHz<br/>TX: <b>430.700</b> MHz<br/>Тон: <b>79.7</b><br/><br/>Zello канал (само RX): <b>LZ0VNA-KNN</b>,<br/>парола - Userlz0vna</center>", "Варна - кв. Галата", ["https://i.imgur.com/BbARwMH.png", "40.46414", "24.22933", "45.86007", "31.62687"]],
  [42.179166, 23.585166, "LZ0BGM", "<b>LZ0BGM</b>, връх Мусала<br/><br/>Надморска височина: 2925 м<br/>QTH: KN12TE<br/><br/><hr><center>Режим: <b>цифров, <font color='purple'>Fusion</font></b><br /><br />RX: <b>439.350</b> MHz<br/>TX: <b>431.750</b> MHz<br/>Тон: <b>няма</b></center>", "връх Мусала"],
  [42.622180, 23.260018, "LZ0DSP", "<b>LZ0DSP</b>, Витоша - София<br/><br/>Надморска височина: 1461 м<br/>QTH: KN12OP<br/><br/><hr><center>Режим: <b>цифров, <font color='purple'>Fusion</font></b><br /><br />RX: <b>439.450</b> MHz<br/>TX: <b>431.850</b> MHz<br/>Тон: <b>няма</b></center>", "Витоша - София"],

]

var ParrotPoints = [
  [43.251259, 27.850084, "LZ2SEX", "<b>LZ2SEX - папагал</b>, Варна - кв. Владиславово<br/><br/>Надморска височина: 165 м<br/>QTH: KN33WG<br/><br/><hr><center>RX + TX: <b>145.400</b> MHz</center>", "Варна - кв. Владиславово", ["https://i.imgur.com/rIzhrS3.png", "42.34520", "26.61536", "44.14403", "29.08481"]],
  [43.1621, 27.9281, "LZ0PAR", "<b>LZ0PAR - папагал</b>, Варна - кв. Галата<br/>(2.5 W, изотропен излъчвател)<br/><br/>Надморска височина: 169 м<br/>QTH: KN33XD29<br/><br/><hr><center>RX + TX: <b>433.300</b> MHz<br/>Тон (RX + TX): <b>79.7</b></center>", "Варна - кв. Галата", ["https://i.imgur.com/HWXEasE.png", "42.25606", "26.69518", "44.05489", "29.16103"]],
  [42.83301, 23.6685, "?", "<b>? - папагали, група 145.475 MHz</b>, връх Мургаш, обл. София<br/><br/>Надморска височина: 1687 м<br/>QTH: KN12UT<br/><br/><hr><center>RX + TX: <b>145.475</b> MHz<br/>RX + TX: <b>435.475</b> MHz<br/>Тон: <b>88.5</b></center>", "връх Мургаш, обл. София"],
]
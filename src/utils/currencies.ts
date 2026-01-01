/**
 * Comprehensive list of major world currencies
 * Popular currencies are listed first for better UX
 */

// Popular/Major currencies (shown first)
export const POPULAR_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
  'CAD', // Canadian Dollar
  'AUD', // Australian Dollar
  'CHF', // Swiss Franc
  'BDT', // Bangladeshi Taka
] as const;

// All major currencies (popular + additional major currencies)
export const ALL_MAJOR_CURRENCIES = [
  // Popular currencies (already listed above, but included for completeness)
  ...POPULAR_CURRENCIES,
  
  // Additional major currencies
  'AED', // UAE Dirham
  'ARS', // Argentine Peso
  'BRL', // Brazilian Real
  'CLP', // Chilean Peso
  'COP', // Colombian Peso
  'CZK', // Czech Koruna
  'DKK', // Danish Krone
  'EGP', // Egyptian Pound
  'HKD', // Hong Kong Dollar
  'HUF', // Hungarian Forint
  'IDR', // Indonesian Rupiah
  'ILS', // Israeli Shekel
  'KRW', // South Korean Won
  'MXN', // Mexican Peso
  'MYR', // Malaysian Ringgit
  'NGN', // Nigerian Naira
  'NOK', // Norwegian Krone
  'NZD', // New Zealand Dollar
  'PHP', // Philippine Peso
  'PKR', // Pakistani Rupee
  'PLN', // Polish Zloty
  'QAR', // Qatari Riyal
  'RUB', // Russian Ruble
  'SAR', // Saudi Riyal
  'SEK', // Swedish Krona
  'SGD', // Singapore Dollar
  'THB', // Thai Baht
  'TRY', // Turkish Lira
  'TWD', // Taiwan Dollar
  'UAH', // Ukrainian Hryvnia
  'VND', // Vietnamese Dong
  'ZAR', // South African Rand
  
  // Additional currencies
  'AFN', // Afghan Afghani
  'ALL', // Albanian Lek (Note: This is a real currency, different from filter 'ALL')
  'AMD', // Armenian Dram
  'AOA', // Angolan Kwanza
  'AZN', // Azerbaijani Manat
  'BAM', // Bosnia-Herzegovina Convertible Mark
  'BGN', // Bulgarian Lev
  'BHD', // Bahraini Dinar
  'BIF', // Burundian Franc
  'BND', // Brunei Dollar
  'BOB', // Bolivian Boliviano
  'BSD', // Bahamian Dollar
  'BTN', // Bhutanese Ngultrum
  'BWP', // Botswanan Pula
  'BYN', // Belarusian Ruble
  'BZD', // Belize Dollar
  'CDF', // Congolese Franc
  'CRC', // Costa Rican Colón
  'CUP', // Cuban Peso
  'CVE', // Cape Verdean Escudo
  'DJF', // Djiboutian Franc
  'DOP', // Dominican Peso
  'DZD', // Algerian Dinar
  'ERN', // Eritrean Nakfa
  'ETB', // Ethiopian Birr
  'FJD', // Fijian Dollar
  'GEL', // Georgian Lari
  'GHS', // Ghanaian Cedi
  'GMD', // Gambian Dalasi
  'GNF', // Guinean Franc
  'GTQ', // Guatemalan Quetzal
  'GYD', // Guyanaese Dollar
  'HNL', // Honduran Lempira
  'HRK', // Croatian Kuna
  'HTG', // Haitian Gourde
  'IQD', // Iraqi Dinar
  'IRR', // Iranian Rial
  'ISK', // Icelandic Króna
  'JMD', // Jamaican Dollar
  'JOD', // Jordanian Dinar
  'KES', // Kenyan Shilling
  'KGS', // Kyrgystani Som
  'KHR', // Cambodian Riel
  'KMF', // Comorian Franc
  'KWD', // Kuwaiti Dinar
  'KZT', // Kazakhstani Tenge
  'LAK', // Laotian Kip
  'LBP', // Lebanese Pound
  'LKR', // Sri Lankan Rupee
  'LRD', // Liberian Dollar
  'LSL', // Lesotho Loti
  'LYD', // Libyan Dinar
  'MAD', // Moroccan Dirham
  'MDL', // Moldovan Leu
  'MGA', // Malagasy Ariary
  'MKD', // Macedonian Denar
  'MMK', // Myanma Kyat
  'MNT', // Mongolian Tugrik
  'MOP', // Macanese Pataca
  'MUR', // Mauritian Rupee
  'MVR', // Maldivian Rufiyaa
  'MWK', // Malawian Kwacha
  'MZN', // Mozambican Metical
  'NAD', // Namibian Dollar
  'NPR', // Nepalese Rupee
  'OMR', // Omani Rial
  'PAB', // Panamanian Balboa
  'PEN', // Peruvian Nuevo Sol
  'PGK', // Papua New Guinean Kina
  'PYG', // Paraguayan Guarani
  'RON', // Romanian Leu
  'RSD', // Serbian Dinar
  'RWF', // Rwandan Franc
  'SBD', // Solomon Islands Dollar
  'SCR', // Seychellois Rupee
  'SDG', // Sudanese Pound
  'SHP', // Saint Helena Pound
  'SLE', // Sierra Leonean Leone
  'SLL', // Sierra Leonean Leone (old)
  'SOS', // Somali Shilling
  'SRD', // Surinamese Dollar
  'SSP', // South Sudanese Pound
  'STN', // São Tomé and Príncipe Dobra
  'SYP', // Syrian Pound
  'SZL', // Swazi Lilangeni
  'TJS', // Tajikistani Somoni
  'TMT', // Turkmenistani Manat
  'TND', // Tunisian Dinar
  'TOP', // Tongan Pa'anga
  'TTD', // Trinidad and Tobago Dollar
  'TZS', // Tanzanian Shilling
  'UGX', // Ugandan Shilling
  'UYU', // Uruguayan Peso
  'UZS', // Uzbekistani Som
  'VES', // Venezuelan Bolívar
  'VUV', // Vanuatu Vatu
  'WST', // Samoan Tala
  'XAF', // CFA Franc BEAC
  'XCD', // East Caribbean Dollar
  'XOF', // CFA Franc BCEAO
  'XPF', // CFP Franc
  'YER', // Yemeni Rial
  'ZMW', // Zambian Kwacha
  'ZWL', // Zimbabwean Dollar
] as const;

/**
 * Get currency name for display
 */
export function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan',
    INR: 'Indian Rupee',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    BDT: 'Bangladeshi Taka',
    AED: 'UAE Dirham',
    ARS: 'Argentine Peso',
    BRL: 'Brazilian Real',
    CLP: 'Chilean Peso',
    COP: 'Colombian Peso',
    CZK: 'Czech Koruna',
    DKK: 'Danish Krone',
    EGP: 'Egyptian Pound',
    HKD: 'Hong Kong Dollar',
    HUF: 'Hungarian Forint',
    IDR: 'Indonesian Rupiah',
    ILS: 'Israeli Shekel',
    KRW: 'South Korean Won',
    MXN: 'Mexican Peso',
    MYR: 'Malaysian Ringgit',
    NGN: 'Nigerian Naira',
    NOK: 'Norwegian Krone',
    NZD: 'New Zealand Dollar',
    PHP: 'Philippine Peso',
    PKR: 'Pakistani Rupee',
    PLN: 'Polish Zloty',
    QAR: 'Qatari Riyal',
    RUB: 'Russian Ruble',
    SAR: 'Saudi Riyal',
    SEK: 'Swedish Krona',
    SGD: 'Singapore Dollar',
    THB: 'Thai Baht',
    TRY: 'Turkish Lira',
    TWD: 'Taiwan Dollar',
    UAH: 'Ukrainian Hryvnia',
    VND: 'Vietnamese Dong',
    ZAR: 'South African Rand',
    // Additional major currencies
    AED: 'UAE Dirham',
    ARS: 'Argentine Peso',
    BRL: 'Brazilian Real',
    CLP: 'Chilean Peso',
    COP: 'Colombian Peso',
    CZK: 'Czech Koruna',
    DKK: 'Danish Krone',
    EGP: 'Egyptian Pound',
    HKD: 'Hong Kong Dollar',
    HUF: 'Hungarian Forint',
    IDR: 'Indonesian Rupiah',
    ILS: 'Israeli Shekel',
    KRW: 'South Korean Won',
    MXN: 'Mexican Peso',
    MYR: 'Malaysian Ringgit',
    NGN: 'Nigerian Naira',
    NOK: 'Norwegian Krone',
    NZD: 'New Zealand Dollar',
    PHP: 'Philippine Peso',
    PKR: 'Pakistani Rupee',
    PLN: 'Polish Zloty',
    QAR: 'Qatari Riyal',
    RUB: 'Russian Ruble',
    SAR: 'Saudi Riyal',
    SEK: 'Swedish Krona',
    SGD: 'Singapore Dollar',
    THB: 'Thai Baht',
    TRY: 'Turkish Lira',
    TWD: 'Taiwan Dollar',
  };
  
  // Fallback: try to get name from Intl.DisplayNames if available
  if (!names[code]) {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
      const name = displayNames.of(code);
      if (name && name !== code) {
        return name;
      }
    } catch (error) {
      // Intl.DisplayNames not available or failed
    }
  }
  
  return names[code] || code;
}

/**
 * Get all currencies as an array
 */
export function getAllCurrencies(): string[] {
  return [...ALL_MAJOR_CURRENCIES];
}

/**
 * Get popular currencies as an array
 */
export function getPopularCurrencies(): string[] {
  return [...POPULAR_CURRENCIES];
}


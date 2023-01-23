require('dotenv').config();
const request = require('request');
const util = require('util')
const requestAsync = util.promisify(request)

async function googleMapsLookup(address) {
  const apiKey = process.env.API_KEY;

  const options = {
    method: 'GET',
    url: `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`,
    header: {
      'Content-Type': 'application/json',
    },
  };

  try {
      const response = await requestAsync(options);
      const parsedBody = JSON.parse(response.body)
      console.log(`[googleMapsLookup] parsedBody:`, parsedBody)
      if (parsedBody && parsedBody.results && parsedBody.results.length > 0) {
          return parsedBody.results[0]
      }
  } catch (err) {
      console.log(`[googleMapsLookup] err:`, err)
      return null
  }
}

function generateAddressObject(response) {
  if (!response || !response?.address_components || response?.address_components?.length === 0) {
    return null
  }

  const longNames = {}
  const shortNames = {}

  response.address_components.forEach((component) => {
    longNames[component.types.filter((type) => type !== 'political')[0]] = component.long_name
    shortNames[component.types.filter((type) => type !== 'political')[0]] = component.short_name
  })

  const city = longNames.locality || longNames.sublocality || longNames.neighborhood

  if (
    longNames.street_number &&
    longNames.route &&
    city &&
    longNames.administrative_area_level_1 &&
    longNames.postal_code &&
    longNames.country &&
    shortNames.administrative_area_level_1 &&
    shortNames.country
  ) {
    const address1 = `${longNames.street_number} ${longNames.route}`
    const address2 = longNames.subpremise ?? ''
    const province = longNames.administrative_area_level_1
    const zip = longNames.postal_code

    return {
      address1,
      address2,
      city,
      state: longNames.administrative_area_level_1,
      zip,
      country: longNames.country,
      provinceCode: shortNames.administrative_area_level_1,
      countryCode: shortNames.country,
      fullAddress:
        `${address1}${address2 ? ` ${address2}` : ''}, ${city}, ${province}, ${zip}`
    }
  }

  return null
}

module.exports = {
  googleMapsLookup,
  generateAddressObject
};

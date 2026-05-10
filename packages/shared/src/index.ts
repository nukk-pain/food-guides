export { RestaurantMap } from './RestaurantMap'
export type { MappableRestaurant, RestaurantMapProps } from './RestaurantMap'

export { buildPopupHtml, escapeHtml } from './restaurantPopupHtml'

export {
  buildMapLinks,
  buildGoogleSearchUrl,
  normalizePhoneHref,
  copyableAddressText,
} from './mapLinks'
export type { MapLinks } from './mapLinks'

export {
  filterByArea,
  getAreaOptions,
  getCountyLabel,
  getProvinceLabel,
  normalizeMetropolitanAddress,
} from './regions'
export type { AreaSelection, CountyOption, ProvinceOption, WithAddress } from './regions'

export { homeUrl, imageUrl, restaurantsDataUrl } from './urls'

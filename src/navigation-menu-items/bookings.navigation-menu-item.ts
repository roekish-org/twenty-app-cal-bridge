import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER } from '../views/bookings.view';

// Puts "Bookings" in the left sidebar, opening the All Bookings table view.
export default defineNavigationMenuItem({
  universalIdentifier: '4f2c8e10-6b3d-4a7e-9c11-8d5f0a2b6e44',
  name: 'Bookings',
  icon: 'IconCalendar',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
});

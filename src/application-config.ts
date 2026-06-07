import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  CAL_WEBHOOK_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  // Marketplace listing (Settings -> Applications). aboutDescription is omitted
  // on purpose so the npm README serves as the "About" content.
  author: 'Roekish',
  category: 'Integration',
  logoUrl: 'public/logo.svg',
  websiteUrl: 'https://roekish.com',
  emailSupport: 'hello@alexismaison.com',
  // Injected into the cal-webhook function's process.env at runtime.
  // Each installer sets their OWN value: Settings -> Applications -> Cal bridge.
  applicationVariables: {
    CAL_WEBHOOK_SECRET: {
      universalIdentifier: CAL_WEBHOOK_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
      description:
        'Signing secret from the Cal.com webhook subscription. Used to verify the x-cal-signature-256 header on every delivery.',
      isSecret: true,
    },
  },
});
